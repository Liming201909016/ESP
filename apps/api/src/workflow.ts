import { randomUUID } from "node:crypto";

import { resolveEmployeeIntent } from "./intent-resolution.js";
import { plugins, resolveBinding, skills } from "./registry.js";
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
  lineage: DecisionLineage;
  [key: string]: unknown;
}

interface DecisionLineage {
  resolutionId: string;
  status: "Partial" | "Complete";
  selectedSkillCodes: string[];
  executedSkillCodes: string[];
  evidenceIds: string[];
  citationEvidenceIds: string[];
  humanDecisionEvidenceId?: string;
  reconciled: {
    selectedSkillsExecuted: boolean;
    citationsResolveToEvidence: boolean;
    humanDecisionRetained: boolean;
    outcomeConstrained: boolean;
  };
}

type IntentResolution = Awaited<ReturnType<typeof resolveEmployeeIntent>>;

function buildDecisionLineage(
  resolution: IntentResolution,
  trace: TraceEntry[],
  evidence: EvidenceItem[],
  report?: ReturnType<typeof reportPlugin.render>,
): DecisionLineage {
  const selectedSkillCodes = resolution.discovery.candidates
    .filter((candidate) => candidate.workflowSelected)
    .map((candidate) => candidate.skillCode);
  const executedSkillCodes = trace.map((entry) => entry.skillCode);
  const evidenceIds = evidence.map((item) => item.evidenceId);
  const evidenceIdSet = new Set(evidenceIds);
  const citationEvidenceIds = report?.findings.flatMap((finding) => finding.citations.map((citation) => citation.evidenceId)) ?? [];
  const humanDecisionEvidenceId = evidence.find((item) => item.type === "HumanDecision")?.evidenceId;
  const selectedSkillsExecuted = selectedSkillCodes.length > 0 && selectedSkillCodes.every((skillCode) => executedSkillCodes.includes(skillCode));
  const citationsResolveToEvidence = Boolean(report) && citationEvidenceIds.every((evidenceId) => evidenceIdSet.has(evidenceId));

  return {
    resolutionId: resolution.resolutionId,
    status: selectedSkillsExecuted && citationsResolveToEvidence ? "Complete" : "Partial",
    selectedSkillCodes,
    executedSkillCodes,
    evidenceIds,
    citationEvidenceIds,
    ...(humanDecisionEvidenceId ? { humanDecisionEvidenceId } : {}),
    reconciled: {
      selectedSkillsExecuted,
      citationsResolveToEvidence,
      humanDecisionRetained: Boolean(humanDecisionEvidenceId),
      outcomeConstrained: resolution.outcome.authorizedType === "Knowledge" && !resolution.outcome.actionAllowed,
    },
  };
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

function validatedReview<T extends { correlationId: string }>(review: T) {
  assertReviewEnvelope(review);
  return review;
}

export class IntentConfirmationRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntentConfirmationRequiredError";
  }
}

export async function executeSecurityReview(caseId: string, requestText: string, bindingCode: string, resolutionId?: string) {
  const normalizedRequest = requestText.trim();
  if (!normalizedRequest) throw new Error("request is required");
  const intentResolution = await resolveEmployeeIntent(normalizedRequest, caseId, bindingCode);
  if (resolutionId) intentResolution.resolutionId = resolutionId;
  if (intentResolution.requiresConfirmation) {
    throw new IntentConfirmationRequiredError(intentResolution.confirmationReason ?? "Intent confirmation is required");
  }
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
    const lineage = buildDecisionLineage(intentResolution, trace, evidence);
    return validatedReview({
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
      intentResolution: {
        resolutionId: intentResolution.resolutionId,
        domain: intentResolution.intent.domain,
        inferredRequestType: intentResolution.intent.inferredRequestType,
        requestedOutcome: intentResolution.outcome.requestedType,
        authorizedOutcome: intentResolution.outcome.authorizedType,
      },
      lineage,
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
    intentResolution: {
      resolutionId: intentResolution.resolutionId,
      domain: intentResolution.intent.domain,
      inferredRequestType: intentResolution.intent.inferredRequestType,
      requestedOutcome: intentResolution.outcome.requestedType,
      authorizedOutcome: intentResolution.outcome.authorizedType,
    },
    lineage: buildDecisionLineage(intentResolution, trace, evidence, report),
  };
  return validatedReview(review);
}

export async function runSecurityReview(caseId: string, requestText: string, bindingCode: string, resolutionId?: string) {
  return persistValidatedReview(await executeSecurityReview(caseId, requestText, bindingCode, resolutionId));
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
  const humanDecisionEvidenceId = review.evidence.find((item) => item.type === "HumanDecision")?.evidenceId;
  review.lineage.evidenceIds = review.evidence.map((item) => item.evidenceId);
  review.lineage.humanDecisionEvidenceId = humanDecisionEvidenceId;
  review.lineage.reconciled.humanDecisionRetained = Boolean(humanDecisionEvidenceId);
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
  const correlationId = randomUUID();
  const invocationId = `INV-${randomUUID()}`;
  const outcome = source.materialComplete ? "Success" : "NeedsInformation";
  const evidence = source.sourceIds.length
    ? source.sourceIds.map((sourceId) => evidencePlugin.create("ToolResult", sourceId, "document-source-accessed"))
    : [evidencePlugin.create("ToolResult", caseId, "document-source-material-incomplete")];
  const pluginRegistration = (pluginCode: string) => {
    const plugin = plugins.find((candidate) => candidate.code === pluginCode);
    if (!plugin) throw new Error(`Plugin is not registered: ${pluginCode}`);
    return plugin;
  };
  const documentSource = pluginRegistration(documentSourcePlugin.code);
  const evidenceStore = pluginRegistration(evidencePlugin.code);
  return {
    contractVersion: "1.0.0",
    correlationId,
    invocationId,
    consumer: { code: consumer.code, name: consumer.name, type: consumer.type },
    consumerBinding: { code: binding.code, status: binding.status },
    skill: { code: skill.code, version: skill.version, implementationVersion: skill.implementationVersion },
    pluginInvocations: [
      {
        invocationId: `PINV-${randomUUID()}`,
        pluginCode: documentSource.code,
        pluginVersion: documentSource.version,
        mode: documentSource.mode,
        outcome,
        evidenceIds: [],
      },
      {
        invocationId: `PINV-${randomUUID()}`,
        pluginCode: evidenceStore.code,
        pluginVersion: evidenceStore.version,
        mode: evidenceStore.mode,
        outcome: "Success",
        evidenceIds: evidence.map((item) => item.evidenceId),
      },
    ],
    outcome,
    payload: {
      materialComplete: source.materialComplete,
      sourceIds: source.sourceIds,
      dataGaps: source.materialComplete ? [] : ["resource list", "permission list"],
    },
    evidence,
    oversight: skill.oversight,
    errors: source.materialComplete ? [] : [{ category: "MissingEvidence", message: "Mandatory review material is missing.", retryable: true }],
  };
}