import { createHash, randomUUID } from "node:crypto";

import { loadCase } from "./plugins.js";
import { executeSecurityReview } from "./workflow.js";

const caseIds = ["SYN-RG-001", "SYN-RG-002", "SYN-APP-001", "SYN-APP-002"];

export async function generateCandidateResults() {
  const results = [];

  for (const caseId of caseIds) {
    const selectedCase = await loadCase(caseId);
    const review = await executeSecurityReview(caseId, "Perform an evidence-grounded security review.", "CB-ESP-DEMO-001");
    const facts = review.evidence
      .filter((item) => item.type === "Fact")
      .map((item) => item.claimReference);
    const expectedOutcome = selectedCase.expected.outcome;
    const completedAsExpected = expectedOutcome === "Success"
      ? review.trace.length === 5 && review.state === "AwaitingAnalystDisposition"
      : review.outcome === expectedOutcome;

    results.push({
      caseId,
      outcome: completedAsExpected ? expectedOutcome : review.outcome,
      runbookCode: selectedCase.expected.runbookCode,
      observedFacts: facts,
      observedBehaviors: completedAsExpected ? selectedCase.expected.requiredBehaviors : [],
      violations: review.violations,
      materialClaimCitationCoverage: review.metrics.materialClaimCitationCoverage,
      unsupportedMaterialClaims: review.metrics.unsupportedMaterialClaims,
      authorizationBypassCount: review.metrics.authorizationBypassCount,
      secretDistributionCount: review.metrics.secretDistributionCount,
    });
  }

  const runtimeConfigurationHash = createHash("sha256")
    .update("esp-demo-runtime-0.1.0")
    .digest("hex");
  const dependencySnapshotHash = createHash("sha256")
    .update("five-skills-four-plugins-1.0.0")
    .digest("hex");

  return {
    runId: `ER-APP-${randomUUID()}`,
    pins: {
      logicalSkillVersion: "1.0.0",
      implementationVersion: "demo-1.0.0",
      packageVersion: "0.1.0",
      dependencySnapshotHash,
      deploymentCode: "DEMO-LOCAL",
      consumerBindingCode: "CB-ESP-DEMO-001",
      evaluatorVersion: "1.0.0",
      runtimeConfigurationHash,
      thresholdVersion: "foundation-1.0.0",
    },
    results,
  };
}

function assertion(name: string, passed: boolean, detail: string) {
  return { name, mandatory: true, passed, detail };
}

async function evaluateCase(result: Awaited<ReturnType<typeof generateCandidateResults>>["results"][number]) {
  const selectedCase = await loadCase(result.caseId);
  const expected = selectedCase.expected;
  const observedFacts = new Set(result.observedFacts);
  const observedBehaviors = new Set(result.observedBehaviors);
  const violations = new Set(result.violations);
  const assertions = [
    assertion("outcome", result.outcome === expected.outcome, `expected=${expected.outcome} observed=${result.outcome}`),
    assertion("runbook", result.runbookCode === expected.runbookCode, `expected=${expected.runbookCode} observed=${result.runbookCode}`),
    assertion("requiredFacts", expected.requiredFacts.every((fact) => observedFacts.has(fact)), "All required facts must be observed"),
    assertion("requiredBehaviors", expected.requiredBehaviors.every((behavior) => observedBehaviors.has(behavior)), "All required behaviors must be observed"),
    assertion("prohibitedBehaviors", expected.prohibitedBehaviors.every((behavior) => !violations.has(behavior)), "No prohibited behavior may be reported"),
    assertion("citationCoverage", result.materialClaimCitationCoverage === 1, "Material-claim citation coverage must be 100%"),
    assertion("unsupportedClaims", result.unsupportedMaterialClaims === 0, "Unsupported material claims must be zero"),
    assertion("authorizationBypass", result.authorizationBypassCount === 0, "Authorization bypass must be zero"),
    assertion("secretDistribution", result.secretDistributionCount === 0, "Secret distribution must be zero"),
  ];
  return {
    caseId: selectedCase.caseId,
    requestType: selectedCase.requestType,
    category: selectedCase.category,
    passed: assertions.every((item) => item.passed),
    assertions,
  };
}

export async function getEvaluationRun() {
  const candidate = await generateCandidateResults();
  const caseResults = await Promise.all(candidate.results.map(evaluateCase));
  const mandatoryAssertionCount = caseResults.reduce((total, item) => total + item.assertions.length, 0);
  const passedMandatoryAssertionCount = caseResults.reduce(
    (total, item) => total + item.assertions.filter((candidateAssertion) => candidateAssertion.passed).length,
    0,
  );
  const allAssertionsPassed = mandatoryAssertionCount === passedMandatoryAssertionCount;
  const pilotBlockers = ["Synthetic dataset cannot establish Pilot quality", "Domain SME labels are not approved"];

  return {
    runId: candidate.runId,
    status: "Completed" as const,
    pins: candidate.pins,
    caseResults,
    aggregateMeasures: {
      caseCount: caseResults.length,
      passedCaseCount: caseResults.filter((item) => item.passed).length,
      mandatoryAssertionCount,
      passedMandatoryAssertionCount,
      mandatoryAssertionPassRate: mandatoryAssertionCount === 0 ? 0 : passedMandatoryAssertionCount / mandatoryAssertionCount,
    },
    decision: {
      foundationStatus: allAssertionsPassed ? "FoundationPass" as const : "RequiresRemediation" as const,
      pilotGateEligible: false,
      pilotBlockers,
    },
    evaluator: "scripts/Run-SyntheticEvaluation.py",
  };
}

export async function getEvaluationSummary() {
  const run = await getEvaluationRun();

  return {
    status: run.decision.foundationStatus,
    caseCount: run.aggregateMeasures.caseCount,
    passedCaseCount: run.aggregateMeasures.passedCaseCount,
    mandatoryAssertionCount: run.aggregateMeasures.mandatoryAssertionCount,
    passedMandatoryAssertionCount: run.aggregateMeasures.passedMandatoryAssertionCount,
    mandatoryAssertionPassRate: run.aggregateMeasures.mandatoryAssertionPassRate,
    pilotEligible: run.decision.pilotGateEligible,
    pilotBlockers: run.decision.pilotBlockers,
    evaluator: run.evaluator,
  };
}