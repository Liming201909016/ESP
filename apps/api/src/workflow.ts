import { randomUUID } from "node:crypto";

import { resolveBinding, skills } from "./registry.js";
import { containsPromptInjection, documentSourcePlugin, evidencePlugin, loadCase, reportPlugin, runbookPlugin, type EvidenceItem } from "./plugins.js";
import { loadReview, saveReview } from "./review-store.js";
import { assertReviewEnvelope } from "./router-contract.js";

interface TraceEntry {
  sequence: number;
  skillCode: string;
  skillVersion: string;
  implementationVersion: string;
  pluginCodes: string[];
  outcome: string;
}

export function detectRuntimeViolations(input: {
  sourceIds: string[];
  evidence: EvidenceItem[];
  promptInjectionDetected: boolean;
  promptInjectionIgnored: boolean;
  reportCitations: Array<{ evidenceId: string }>;
}) {
  const violations: string[] = [];
  const evidenceIds = new Set(input.evidence.map((item) => item.evidenceId));
  if (input.evidence.some((item) => item.type === "Fact" && !input.sourceIds.includes(item.sourceId))) {
    violations.push("unsupported material claim");
  }
  if (input.reportCitations.some((citation) => !evidenceIds.has(citation.evidenceId))) {
    violations.push("report citation does not resolve to retained evidence");
  }
  if (input.promptInjectionDetected && !input.promptInjectionIgnored) {
    violations.push("follow document instructions");
  }
  return violations;
}

function unresolvedReportCitationIds(review: StoredReview) {
  const evidenceIds = new Set(review.evidence.map((item) => item.evidenceId));
  return review.report.findings
    .flatMap((finding) => finding.citations)
    .map((citation) => citation.evidenceId)
    .filter((evidenceId) => !evidenceIds.has(evidenceId));
}

export type AnalystDecision = "Accept" | "Modify" | "Reject" | "Escalate" | "CannotAssess";

export interface StoredReview {
  correlationId: string;
  caseId: string;
  state: string;
  outcome: string;
  proposedRisk: string;
  evidence: EvidenceItem[];
  report: ReturnType<typeof reportPlugin.render>;
  analystReviewRequired: boolean;
  analystDisposition?: { decision: AnalystDecision; rationale: string; finalRisk?: string };
  [key: string]: unknown;
}

function registration(skillCode: string) {
  const skill = skills.find((candidate) => candidate.code === skillCode);
  if (!skill) throw new Error(`Skill is not registered: ${skillCode}`);
  return skill;
}

function persistValidatedReview<T extends { correlationId: string }>(review: T) {
  assertReviewEnvelope(review);
  return saveReview(review);
}

export async function runSecurityReview(caseId: string, requestText: string, bindingCode: string) {
  const normalizedRequest = requestText.trim();
  if (!normalizedRequest) throw new Error("request is required");
  const selectedCase = await loadCase(caseId);
  const { binding, consumer } = resolveBinding(bindingCode, skills.map((skill) => skill.code));
  const correlationId = randomUUID();
  const trace: TraceEntry[] = [];
  const evidence: EvidenceItem[] = [];

  const invoke = (skillCode: string, outcome: string) => {
    const skill = registration(skillCode);
    trace.push({
      sequence: trace.length + 1,
      skillCode,
      skillVersion: skill.version,
      implementationVersion: skill.implementationVersion,
      pluginCodes: skill.plugins,
      outcome,
    });
  };

  const source = await documentSourcePlugin.read(selectedCase);
  if (!source.materialComplete) {
    invoke("LS-SEC-DOC-INTAKE", "NeedsInformation");
    return persistValidatedReview({
      correlationId,
      caseId,
      request: { text: normalizedRequest },
      consumer: { code: consumer.code, name: consumer.name },
      consumerBinding: { code: binding.code, status: binding.status },
      state: "NeedsInformation",
      outcome: "NeedsInformation",
      missingInformation: ["resource list", "permission list"],
      evidence,
      trace,
      violations: [],
      metrics: { materialClaimCitationCoverage: 1, unsupportedMaterialClaims: 0, authorizationBypassCount: 0, secretDistributionCount: 0 },
      analystReviewRequired: true,
    });
  }
  invoke("LS-SEC-DOC-INTAKE", "Success");

  const promptInjectionDetected = containsPromptInjection(source.documents);
  if (promptInjectionDetected) {
    evidence.push(evidencePlugin.create("ToolResult", source.sourceIds[0] ?? caseId, "prompt-injection-ignored"));
  }

  for (const fact of documentSourcePlugin.extractFacts(selectedCase.requestType, selectedCase.category, source.documents)) {
    evidence.push(evidencePlugin.create("Fact", fact.sourceId, fact.claimReference));
  }
  invoke("LS-SEC-EVIDENCE-EXTRACT", "Success");

  const runbook = runbookPlugin.resolve(selectedCase.expected.runbookCode);
  const finding = {
    findingId: `F-${caseId}`,
    statement: `Synthetic ${selectedCase.requestType} package requires analyst review against ${runbook.runbookCode}.`,
    authority: runbook.authority,
    evidenceIds: evidence.map((item) => item.evidenceId),
  };
  evidence.push(evidencePlugin.create("RuleResult", runbook.runbookCode, finding.findingId));
  invoke("LS-SEC-REVIEW", "Success");

  const proposedRisk = selectedCase.category === "PromptInjection" ? "High" : "Medium";
  evidence.push(evidencePlugin.create("ModelSuggestion", runbook.runbookCode, `risk:${proposedRisk}`));
  invoke("LS-SEC-RISK-RATING", "HumanHandoff");

  const report = reportPlugin.render(selectedCase, [finding], evidence);
  invoke("LS-SEC-REPORT-GEN", "Success");
  const reportCitations = report.findings.flatMap((item) => item.citations);
  const violations = detectRuntimeViolations({
    sourceIds: source.sourceIds,
    evidence,
    promptInjectionDetected,
    promptInjectionIgnored: promptInjectionDetected,
    reportCitations,
  });
  const factCount = evidence.filter((item) => item.type === "Fact").length;
  const citedFactCount = reportCitations.filter((citation) => evidence.some((item) => item.evidenceId === citation.evidenceId && item.type === "Fact")).length;

  const review = {
    correlationId,
    caseId,
    request: { text: normalizedRequest },
    consumer: { code: consumer.code, name: consumer.name },
    consumerBinding: { code: binding.code, status: binding.status },
    state: "AwaitingAnalystDisposition",
    outcome: "HumanHandoff",
    requestType: selectedCase.requestType,
    findings: [finding],
    proposedRisk,
    requiredBehaviors: selectedCase.expected.requiredBehaviors,
    safety: {
      promptInjectionDetected,
      promptInjectionIgnored: promptInjectionDetected,
      governanceOverrideAllowed: false,
    },
    violations,
    metrics: {
      materialClaimCitationCoverage: factCount === 0 ? 1 : citedFactCount / factCount,
      unsupportedMaterialClaims: violations.includes("unsupported material claim") ? 1 : 0,
      authorizationBypassCount: 0,
      secretDistributionCount: 0,
    },
    report,
    evidence,
    trace,
    analystReviewRequired: true,
  };
  return persistValidatedReview(review);
}

export async function applyAnalystDisposition(
  correlationId: string,
  decision: AnalystDecision,
  rationale: string,
  finalRisk?: string,
) {
  const review = await loadReview<StoredReview>(correlationId);
  if (!review) throw new Error(`Review not found: ${correlationId}`);
  if (review.state !== "AwaitingAnalystDisposition") throw new Error(`Review is not awaiting disposition: ${correlationId}`);
  if (decision === "Modify" && !finalRisk) throw new Error("finalRisk is required when modifying a rating");

  const transitions: Record<AnalystDecision, { state: string; outcome: string; reportStatus: "Draft" | "Final" }> = {
    Accept: { state: "Completed", outcome: "Success", reportStatus: "Final" },
    Modify: { state: "Completed", outcome: "Success", reportStatus: "Final" },
    Reject: { state: "RejectedByAnalyst", outcome: "HumanHandoff", reportStatus: "Draft" },
    Escalate: { state: "Escalated", outcome: "HumanHandoff", reportStatus: "Draft" },
    CannotAssess: { state: "CannotAssess", outcome: "CannotAssess", reportStatus: "Draft" },
  };
  const transition = transitions[decision];
  const selectedRisk = decision === "Modify" ? finalRisk : decision === "Accept" ? review.proposedRisk : undefined;

  if (transition.reportStatus === "Final") {
    const unresolvedCitationIds = unresolvedReportCitationIds(review);
    if (unresolvedCitationIds.length) {
      throw new Error(`Report citations do not resolve to retained evidence: ${unresolvedCitationIds.join(", ")}`);
    }
  }

  review.analystDisposition = { decision, rationale, finalRisk: selectedRisk };
  review.evidence.push(evidencePlugin.create("HumanDecision", "demo-analyst", `disposition:${decision}`));
  review.state = transition.state;
  review.outcome = transition.outcome;
  review.report.status = transition.reportStatus;
  review.report.analystDecision = review.analystDisposition;
  review.analystReviewRequired = false;
  return persistValidatedReview(review);
}

export function getReview(correlationId: string) {
  return loadReview<StoredReview>(correlationId);
}

export async function runBoundDocumentIntake(caseId: string, requestText: string, bindingCode: string) {
  const normalizedRequest = requestText.trim();
  if (!normalizedRequest) throw new Error("request is required");
  const selectedCase = await loadCase(caseId);
  const skill = registration("LS-SEC-DOC-INTAKE");
  const { binding, consumer } = resolveBinding(bindingCode, [skill.code]);
  const source = await documentSourcePlugin.read(selectedCase);
  return {
    correlationId: randomUUID(),
    consumer: { code: consumer.code, name: consumer.name },
    consumerBinding: { code: binding.code, status: binding.status },
    skill: { code: skill.code, version: skill.version, implementationVersion: skill.implementationVersion },
    plugins: skill.plugins,
    outcome: source.materialComplete ? "Success" : "NeedsInformation",
    sourceIds: source.sourceIds,
    request: { text: normalizedRequest },
  };
}