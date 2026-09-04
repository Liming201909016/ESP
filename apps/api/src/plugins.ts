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
};

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
  render(caseId: string, findingIds: string[]) {
    return {
      reportId: `RPT-${caseId}`,
      status: "Draft",
      templateVersion: "synthetic-1.0.0",
      findingIds,
      citationsPreserved: true,
    };
  },
};