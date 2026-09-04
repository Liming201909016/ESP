import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

export interface DatasetCase {
  caseId: string;
  requestType: "RG" | "APP";
  category: string;
  input: {
    projectDescription: string;
    documents: Array<{ documentId: string; documentType: string; content: Record<string, unknown> }>;
  };
  expected: {
    outcome: string;
    runbookCode: string;
    requiredFacts: string[];
    requiredBehaviors: string[];
    prohibitedBehaviors: string[];
  };
}

export interface EvidenceItem {
  evidenceId: string;
  type: "Fact" | "RuleResult" | "ToolResult" | "ModelSuggestion" | "HumanDecision";
  sourceId: string;
  claimReference: string;
}

export interface ExtractedFact {
  claimReference: string;
  sourceId: string;
}

const datasetUrl = new URL("../../../test-data/security-review/v1.0.0/dataset.json", import.meta.url);

export async function loadCase(caseId: string): Promise<DatasetCase> {
  const dataset = JSON.parse(await readFile(datasetUrl, "utf8")) as { cases: DatasetCase[] };
  const selectedCase = dataset.cases.find((item) => item.caseId === caseId);
  if (!selectedCase) throw new Error(`Unknown synthetic case: ${caseId}`);
  return selectedCase;
}

export const documentSourcePlugin = {
  code: "PLG-DOC-SOURCE",
  version: "1.0.0",
  async read(selectedCase: DatasetCase) {
    return {
      documents: selectedCase.input.documents,
      sourceIds: selectedCase.input.documents.map((document) => document.documentId),
      materialComplete: selectedCase.input.documents.length > 0,
    };
  },
  extractFacts(
    requestType: DatasetCase["requestType"],
    category: string,
    documents: DatasetCase["input"]["documents"],
  ): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    for (const document of documents) {
      const content = document.content;
      if (requestType === "RG") {
        if (Array.isArray(content.resources) && content.resources.length) facts.push({ claimReference: "resource list", sourceId: document.documentId });
        if (typeof content.region === "string") facts.push({ claimReference: "region", sourceId: document.documentId });
        if (Array.isArray(content.identities) && content.identities.length) facts.push({ claimReference: "identity", sourceId: document.documentId });
        if (typeof content.networkExposure === "string") facts.push({ claimReference: "network exposure", sourceId: document.documentId });
        if (Array.isArray(content.permissions) && content.permissions.length) facts.push({ claimReference: "permission list", sourceId: document.documentId });
      } else {
        if (typeof content.signInAudience === "string") facts.push({ claimReference: "sign-in audience", sourceId: document.documentId });
        if (Array.isArray(content.permissions) && content.permissions.length) {
          facts.push({ claimReference: category === "PromptInjection" ? "requested permission" : "permission name", sourceId: document.documentId });
        }
        if (typeof content.permissionType === "string") facts.push({ claimReference: "permission type", sourceId: document.documentId });
        if (Array.isArray(content.redirectUris) && content.redirectUris.length) facts.push({ claimReference: "redirect URI", sourceId: document.documentId });
      }
    }
    return facts;
  },
};

function stringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value && typeof value === "object") return Object.values(value).flatMap(stringValues);
  return [];
}

export function containsPromptInjection(value: unknown) {
  const patterns = [
    /\b(ignore|bypass|override|disregard)\b.{0,100}\b(governance|instruction|policy|evidence|approval)\b/i,
    /\b(mark|declare)\b.{0,60}\bapproved\b.{0,60}\bwithout\b.{0,30}\bevidence\b/i,
  ];
  return stringValues(value).some((text) => patterns.some((pattern) => pattern.test(text)));
}

export const runbookPlugin = {
  code: "PLG-RUNBOOK",
  version: "1.0.0",
  resolve(runbookCode: string) {
    return {
      runbookCode,
      version: "synthetic-1.0.0",
      authority: "MandatoryRunbook",
      mode: "Demo",
    };
  },
};

export const evidencePlugin = {
  code: "PLG-EVIDENCE",
  version: "1.0.0",
  create(type: EvidenceItem["type"], sourceId: string, claimReference: string): EvidenceItem {
    return { evidenceId: `EV-${randomUUID()}`, type, sourceId, claimReference };
  },
};

export const reportPlugin = {
  code: "PLG-REPORT",
  version: "1.0.0",
  render(
    selectedCase: DatasetCase,
    findings: Array<{ findingId: string; statement: string; evidenceIds: string[] }>,
    evidence: EvidenceItem[],
  ) {
    return {
      reportId: `RPT-${selectedCase.caseId}`,
      status: "Draft",
      templateVersion: "synthetic-1.0.0",
      title: `${selectedCase.requestType} Security Review`,
      summary: `Synthetic ${selectedCase.requestType} review produced ${findings.length} finding for analyst disposition.`,
      scope: selectedCase.input.projectDescription,
      runbookCode: selectedCase.expected.runbookCode,
      findings: findings.map((finding) => ({
        findingId: finding.findingId,
        statement: finding.statement,
        citations: finding.evidenceIds.map((evidenceId) => {
          const item = evidence.find((candidate) => candidate.evidenceId === evidenceId);
          return { evidenceId, sourceId: item?.sourceId ?? "unknown", claimReference: item?.claimReference ?? "unknown" };
        }),
      })),
      analystDecision: null as null | { decision: string; rationale: string; finalRisk?: string },
      citationsPreserved: true,
    };
  },
};