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

  const report = reportPlugin.render(caseId, [finding.findingId]);
  invoke("LS-SEC-REPORT-GEN", "Success");

  return {
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
}