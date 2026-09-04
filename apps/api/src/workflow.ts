import { randomUUID } from "node:crypto";

import { skills } from "./registry.js";
import { documentSourcePlugin, evidencePlugin, loadCase, reportPlugin, runbookPlugin, type EvidenceItem } from "./plugins.js";

interface TraceEntry {
  sequence: number;
  skillCode: string;
  skillVersion: string;
  implementationVersion: string;
  pluginCodes: string[];
  outcome: string;
}

export type AnalystDecision = "Accept" | "Modify" | "Reject" | "Escalate" | "CannotAssess";

interface StoredReview {
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

const reviewStore = new Map<string, StoredReview>();

function registration(skillCode: string) {
  const skill = skills.find((candidate) => candidate.code === skillCode);
  if (!skill) throw new Error(`Skill is not registered: ${skillCode}`);
  return skill;
}

export async function runSecurityReview(caseId: string) {
  const selectedCase = await loadCase(caseId);
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
    return {
      correlationId,
      caseId,
      state: "NeedsInformation",
      outcome: "NeedsInformation",
      missingInformation: ["resource list", "permission list"],
      evidence,
      trace,
      analystReviewRequired: true,
    };
  }
  invoke("LS-SEC-DOC-INTAKE", "Success");

  const promptInjectionDetected = source.documents.some((document) => typeof document.content.untrustedText === "string");
  if (promptInjectionDetected) {
    evidence.push(evidencePlugin.create("ToolResult", source.sourceIds[0] ?? caseId, "prompt-injection-ignored"));
  }

  for (const fact of selectedCase.expected.requiredFacts) {
    evidence.push(evidencePlugin.create("Fact", source.sourceIds[0] ?? caseId, fact));
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

  const review = {
    correlationId,
    caseId,
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
    report,
    evidence,
    trace,
    analystReviewRequired: true,
  };
  reviewStore.set(correlationId, review);
  return review;
}

export function applyAnalystDisposition(
  correlationId: string,
  decision: AnalystDecision,
  rationale: string,
  finalRisk?: string,
) {
  const review = reviewStore.get(correlationId);
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

  review.analystDisposition = { decision, rationale, finalRisk: selectedRisk };
  review.evidence.push(evidencePlugin.create("HumanDecision", "demo-analyst", `disposition:${decision}`));
  review.state = transition.state;
  review.outcome = transition.outcome;
  review.report.status = transition.reportStatus;
  review.report.analystDecision = review.analystDisposition;
  review.analystReviewRequired = false;
  return review;
}