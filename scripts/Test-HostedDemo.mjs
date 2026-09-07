import { chromium } from "@playwright/test";

const baseUrl = (process.argv[2] ?? process.env.ESP_DEMO_URL ?? "https://app-esp-esp-demo-vw6mjjpc4xh64.azurewebsites.net").replace(/\/$/, "");

async function jsonRequest(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${text}`);
  return { response, body: JSON.parse(text) };
}

const healthRequestId = "hosted-smoke-health";
const { response: healthResponse, body: health } = await jsonRequest("/api/health", { headers: { "x-request-id": healthRequestId } });
if (health.status !== "healthy" || !health.ready || health.mode !== "Demo") throw new Error("Hosted Demo health payload is invalid");
if (health.registry.skillCount !== 5 || health.registry.pluginCount !== 4) throw new Error("Hosted registry counts are invalid");
if (health.reviewStore?.status !== "healthy" || health.reviewStore?.durableBackup !== true) throw new Error("Hosted review store is not ready");
if (health.reviewStore?.capacity?.maximumBytes !== 32 * 1024 * 1024 || health.reviewStore?.capacity?.utilization >= 1) {
  throw new Error("Hosted review store capacity contract is invalid");
}
if (healthResponse.headers.get("x-request-id") !== healthRequestId) throw new Error("Hosted request ID propagation failed");

const requiredHeaders = {
  "content-security-policy": "default-src 'self'",
  "strict-transport-security": "max-age=",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "ratelimit-policy": "120-in-15min",
};
for (const [name, expected] of Object.entries(requiredHeaders)) {
  if (!healthResponse.headers.get(name)?.includes(expected)) throw new Error(`Hosted Demo header is missing or invalid: ${name}`);
}
if (healthResponse.headers.has("access-control-allow-origin")) throw new Error("Hosted Demo must not expose wildcard cross-origin access");

const { body: reviewsBeforeEvaluation } = await jsonRequest("/api/reviews?limit=50");
const { body: evaluationRun } = await jsonRequest("/api/evaluation/run");
const { body: reviewsAfterEvaluation } = await jsonRequest("/api/reviews?limit=50");
if (evaluationRun.decision?.foundationStatus !== "FoundationPass"
  || evaluationRun.aggregateMeasures?.passedMandatoryAssertionCount !== 36
  || evaluationRun.caseResults?.length !== 4) {
  throw new Error("Hosted inspectable Evaluation Run is invalid");
}
if (JSON.stringify(reviewsAfterEvaluation.reviews) !== JSON.stringify(reviewsBeforeEvaluation.reviews)) {
  throw new Error("Hosted Evaluation Run polluted operational reviews");
}

const { body: intentResolution } = await jsonRequest("/api/intent-resolutions", {
  method: "POST",
  headers: { "content-type": "application/json", "x-request-id": "hosted-smoke-intent" },
  body: JSON.stringify({
    employeeIntent: "Create an application registration and grant permissions after a security review.",
    evidencePackageId: "SYN-APP-001",
    consumerBindingCode: "CB-ESP-DEMO-001",
  }),
});
if (intentResolution.intent?.inferredRequestType !== "APP" || intentResolution.requiresConfirmation) {
  throw new Error("Hosted intent understanding returned an unexpected decision");
}
if (intentResolution.discovery?.selectedCount !== 5 || intentResolution.discovery?.pluginCodes?.length !== 4) {
  throw new Error("Hosted Skill discovery returned an unexpected governed path");
}
if (intentResolution.outcome?.requestedType !== "Action" || intentResolution.outcome?.authorizedType !== "Knowledge" || intentResolution.outcome?.actionAllowed) {
  throw new Error("Hosted outcome governance did not constrain the requested action");
}

const invokeDocumentIntake = async (consumerBindingCode) => (await jsonRequest("/api/skill-invocations/document-intake", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ caseId: "SYN-RG-001", request: "Review shared document intake.", consumerBindingCode }),
})).body;
const primaryIntake = await invokeDocumentIntake("CB-ESP-DEMO-001");
const secondaryIntake = await invokeDocumentIntake("CB-ARCH-DEMO-001");
if (primaryIntake.consumer.code === secondaryIntake.consumer.code || primaryIntake.consumerBinding.code === secondaryIntake.consumerBinding.code) {
  throw new Error("Hosted reusable Skill invocations did not preserve distinct Consumer identity");
}
if (JSON.stringify(primaryIntake.skill) !== JSON.stringify(secondaryIntake.skill)
  || JSON.stringify(primaryIntake.pluginInvocations.map(({ pluginCode, pluginVersion }) => ({ pluginCode, pluginVersion })))
    !== JSON.stringify(secondaryIntake.pluginInvocations.map(({ pluginCode, pluginVersion }) => ({ pluginCode, pluginVersion })))) {
  throw new Error("Hosted reusable Skill invocations did not resolve the same pinned assets");
}

const expectedCases = {
  "SYN-RG-001": { state: "AwaitingAnalystDisposition", outcome: "HumanHandoff", traceCount: 5 },
  "SYN-RG-002": { state: "NeedsInformation", outcome: "NeedsInformation", traceCount: 1 },
  "SYN-APP-001": { state: "AwaitingAnalystDisposition", outcome: "HumanHandoff", traceCount: 5 },
  "SYN-APP-002": { state: "AwaitingAnalystDisposition", outcome: "HumanHandoff", traceCount: 5 },
};
const scenarios = [];
let latestCorrelationId = "";
for (const [caseId, expected] of Object.entries(expectedCases)) {
  const { body: review } = await jsonRequest("/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caseId,
      request: "Run the automated security review for this evidence package.",
      consumerBindingCode: "CB-ESP-DEMO-001",
    }),
  });
  if (review.state !== expected.state || review.outcome !== expected.outcome || review.trace.length !== expected.traceCount) {
    throw new Error(`${caseId} returned an unexpected governed state`);
  }
  if (review.violations.length) throw new Error(`${caseId} reported runtime violations: ${review.violations.join(", ")}`);
  latestCorrelationId = review.correlationId;
  if (review.state === "NeedsInformation") {
    if (review.lineage?.status !== "Partial" || review.lineage.executedSkillCodes?.length !== 1) {
      throw new Error(`${caseId} returned an invalid partial Decision Lineage`);
    }
  } else if (!review.lineage?.reconciled?.selectedSkillsExecuted || !review.lineage?.reconciled?.citationsResolveToEvidence) {
    throw new Error(`${caseId} returned an unreconciled Decision Lineage`);
  }
  if (review.state === "AwaitingAnalystDisposition") {
    const { body: finalizedReview } = await jsonRequest(`/api/reviews/${review.correlationId}/disposition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision: "CannotAssess", rationale: "Automated Hosted Demo validation cleanup." }),
    });
    if (finalizedReview.state !== "CannotAssess" || !finalizedReview.lineage?.reconciled?.humanDecisionRetained) {
      throw new Error(`${caseId} could not retain the validation decision`);
    }
  }
  scenarios.push({ caseId, state: review.state, outcome: review.outcome, traceCount: review.trace.length });
}

const { body: recentReviews } = await jsonRequest("/api/reviews?limit=8");
if (!recentReviews.reviews?.some((item) => item.correlationId === latestCorrelationId)) {
  throw new Error("Hosted Recent Reviews did not retain the latest validation review");
}
const { body: reopenedReview } = await jsonRequest(`/api/reviews/${latestCorrelationId}`);
if (reopenedReview.correlationId !== latestCorrelationId || !reopenedReview.lineage) {
  throw new Error("Hosted Recent Review could not be reopened with its lineage");
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  if (await page.title() !== "Enterprise Skill Platform") throw new Error("Hosted browser title is invalid");
  const evaluation = page.getByRole("region", { name: "FoundationPass" });
  if (await evaluation.locator("details").count() !== 4 || !(await evaluation.textContent())?.includes("36/36")) {
    throw new Error("Hosted Evaluation Run is not inspectable in the browser");
  }
  await page.getByRole("button", { name: "Prove governed reuse" }).click();
  await page.getByRole("heading", { name: "Architecture Review Workflow" }).waitFor();
  if (!(await page.getByRole("region", { name: "One Skill, two Consumers." }).textContent())?.includes("No copied implementation")) {
    throw new Error("Hosted governed reuse proof is not visible");
  }
  await page.getByRole("button", { name: "Run review" }).click();
  await page.locator(".outcome").waitFor();
  if (await page.locator(".outcome").textContent() !== "HumanHandoff") throw new Error("Hosted browser workflow did not reach HumanHandoff");
  await page.getByRole("button", { name: "Cannot assess", exact: true }).click();
  await page.locator(".outcome").filter({ hasText: "CannotAssess" }).waitFor();
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
  if (overflow) throw new Error("Hosted mobile UI has horizontal overflow");
} finally {
  await browser.close();
}

console.log(JSON.stringify({ status: "PASS", baseUrl, scenarios }, null, 2));