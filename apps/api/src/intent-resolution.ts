import { randomUUID } from "node:crypto";

import { containsPromptInjection, loadCase } from "./plugins.js";
import { resolveBinding, skills } from "./registry.js";

type RequestType = "RG" | "APP";
type RequestedOutcome = "Knowledge" | "Service" | "Action";

const requestTypeSignals: Record<RequestType, Array<{ pattern: RegExp; label: string }>> = {
  RG: [
    { pattern: /\bresource[ -]?group\b/i, label: "resource group" },
    { pattern: /\bsubscription\b/i, label: "subscription" },
    { pattern: /\bnetwork(?:ing)?\b/i, label: "network" },
    { pattern: /\bmanaged identity\b/i, label: "managed identity" },
    { pattern: /\binfrastructure\b/i, label: "infrastructure" },
  ],
  APP: [
    { pattern: /\bapp(?:lication)? registration\b/i, label: "application registration" },
    { pattern: /\benterprise app\b/i, label: "enterprise application" },
    { pattern: /\bpermission(?:s)?\b/i, label: "permissions" },
    { pattern: /\bredirect uri\b/i, label: "redirect URI" },
    { pattern: /\bsign[ -]?in audience\b/i, label: "sign-in audience" },
    { pattern: /\bconsent\b/i, label: "consent" },
  ],
};

const objectivePattern = /\b(review|assess|check|audit|security|risk|compliance|validate)\b/i;
const actionPattern = /\b(create|grant|approve|deploy|execute|change|register|provision)\b/i;
const servicePattern = /\b(book|reserve|parking|service|request access)\b/i;
const missingInputPattern = /\b(missing|incomplete|without|not provided|need more information)\b/i;
const promptInjectionPattern = /\bprompt injection|untrusted instruction\b/i;

const selectionReasons: Record<string, string> = {
  "LS-SEC-DOC-INTAKE": "Normalize the request and verify mandatory material.",
  "LS-SEC-EVIDENCE-EXTRACT": "Extract cited facts from the authorized evidence package.",
  "LS-SEC-REVIEW": "Apply the pinned security Runbook to the discovered scope.",
  "LS-SEC-RISK-RATING": "Propose a risk rating while retaining human approval.",
  "LS-SEC-REPORT-GEN": "Produce a report whose material claims resolve to evidence.",
};

function findSignals(text: string, requestType: RequestType) {
  return requestTypeSignals[requestType]
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);
}

function requestedOutcome(text: string): RequestedOutcome {
  if (actionPattern.test(text)) return "Action";
  if (servicePattern.test(text)) return "Service";
  return "Knowledge";
}

export async function resolveEmployeeIntent(employeeIntent: string, evidencePackageId: string, bindingCode: string) {
  const normalized = employeeIntent.trim().replace(/\s+/g, " ");
  const selectedCase = await loadCase(evidencePackageId);
  const rgSignals = findSignals(normalized, "RG");
  const appSignals = findSignals(normalized, "APP");
  const inferredRequestType: RequestType | null = rgSignals.length === appSignals.length
    ? null
    : rgSignals.length > appSignals.length ? "RG" : "APP";
  const objectiveRecognized = objectivePattern.test(normalized);
  const contextMatchesIntent = inferredRequestType === null || inferredRequestType === selectedCase.requestType;
  const safetyConcern = promptInjectionPattern.test(normalized) || containsPromptInjection(normalized);
  const inferredCategory = safetyConcern ? "PromptInjection" : missingInputPattern.test(normalized) ? "MissingInput" : "HappyPath";
  const outcomeRequested = requestedOutcome(normalized);
  const { binding, consumer } = resolveBinding(bindingCode, []);
  const workflowMatches = objectiveRecognized && contextMatchesIntent;
  const candidates = skills.map((skill) => {
    const authorized = binding.skillCodes.includes(skill.code);
    return {
      skillCode: skill.code,
      name: skill.name,
      version: skill.version,
      implementationVersion: skill.implementationVersion,
      pluginCodes: skill.plugins,
      oversight: skill.oversight,
      decision: authorized ? "Authorized" as const : "Blocked" as const,
      workflowSelected: workflowMatches && authorized,
      selectionReason: selectionReasons[skill.code] ?? "Required by the governed review workflow.",
    };
  });
  const selectedSkills = candidates.filter((candidate) => candidate.workflowSelected);
  const pluginCodes = [...new Set(selectedSkills.flatMap((candidate) => candidate.pluginCodes))];
  const requiresConfirmation = !objectiveRecognized || !contextMatchesIntent;
  const confidence = safetyConcern ? 0.99
    : objectiveRecognized && inferredRequestType && contextMatchesIntent ? 0.96
    : objectiveRecognized && contextMatchesIntent ? 0.78
    : 0.42;

  return {
    resolutionId: `IR-${randomUUID()}`,
    intent: {
      raw: employeeIntent,
      normalized,
      domain: objectiveRecognized ? "SecurityReview" as const : "Unclassified" as const,
      objective: objectiveRecognized ? "Evaluate security posture" : "Clarification required",
      inferredRequestType,
      inferredCategory,
      signals: [...rgSignals, ...appSignals],
      confidence,
      selectionBasis: inferredRequestType ? "EmployeeIntent" as const : "EvidenceContext" as const,
    },
    evidenceContext: {
      caseId: selectedCase.caseId,
      requestType: selectedCase.requestType,
      category: selectedCase.category,
      projectDescription: selectedCase.input.projectDescription,
      contextMatchesIntent,
    },
    discovery: {
      candidateCount: candidates.length,
      selectedCount: selectedSkills.length,
      candidates,
      pluginCodes,
    },
    authorization: {
      bindingCode: binding.code,
      consumerCode: consumer.code,
      consumerName: consumer.name,
      status: binding.status,
      allSelectedSkillsAuthorized: selectedSkills.length > 0 && selectedSkills.every((candidate) => candidate.decision === "Authorized"),
      blockedSkillCodes: candidates.filter((candidate) => candidate.decision === "Blocked").map((candidate) => candidate.skillCode),
    },
    governance: {
      evidenceRequired: true,
      evaluationRequired: true,
      humanDecisionRequired: true,
      autonomousApprovalAllowed: false,
    },
    outcome: {
      requestedType: outcomeRequested,
      authorizedType: "Knowledge" as const,
      actionAllowed: false,
      title: "Evidence-grounded security review",
      reason: outcomeRequested === "Knowledge"
        ? "The active binding authorizes a read-only evidence and report outcome."
        : `${outcomeRequested} intent is constrained to a read-only Knowledge outcome by policy.`,
    },
    requiresConfirmation,
    confirmationReason: !objectiveRecognized
      ? "State a review, assessment, audit, security, risk, or compliance objective."
      : !contextMatchesIntent
        ? `The intent appears to target ${inferredRequestType}, but the selected evidence package is ${selectedCase.requestType}.`
        : null,
    nextAction: {
      endpoint: "/api/reviews" as const,
      body: { caseId: selectedCase.caseId, request: normalized, consumerBindingCode: binding.code },
    },
  };
}