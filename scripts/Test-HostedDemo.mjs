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

const expectedCases = {
  "SYN-RG-001": { state: "AwaitingAnalystDisposition", outcome: "HumanHandoff", traceCount: 5 },
  "SYN-RG-002": { state: "NeedsInformation", outcome: "NeedsInformation", traceCount: 1 },
  "SYN-APP-001": { state: "AwaitingAnalystDisposition", outcome: "HumanHandoff", traceCount: 5 },
  "SYN-APP-002": { state: "AwaitingAnalystDisposition", outcome: "HumanHandoff", traceCount: 5 },
};
const scenarios = [];
for (const [caseId, expected] of Object.entries(expectedCases)) {
  const { body: review } = await jsonRequest("/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      caseId,
      request: "Run the automated Hosted Demo validation.",
      consumerBindingCode: "CB-ESP-DEMO-001",
    }),
  });
  if (review.state !== expected.state || review.outcome !== expected.outcome || review.trace.length !== expected.traceCount) {
    throw new Error(`${caseId} returned an unexpected governed state`);
  }
  if (review.violations.length) throw new Error(`${caseId} reported runtime violations: ${review.violations.join(", ")}`);
  if (review.state === "AwaitingAnalystDisposition") {
    const { body: finalizedReview } = await jsonRequest(`/api/reviews/${review.correlationId}/disposition`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision: "CannotAssess", rationale: "Automated Hosted Demo validation cleanup." }),
    });
    if (finalizedReview.state !== "CannotAssess") throw new Error(`${caseId} could not be finalized after validation`);
  }
  scenarios.push({ caseId, state: review.state, outcome: review.outcome, traceCount: review.trace.length });
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  if (await page.title() !== "Enterprise Skill Platform") throw new Error("Hosted browser title is invalid");
  await page.getByRole("button", { name: "Run review" }).click();
  await page.locator(".outcome").waitFor();
  if (await page.locator(".outcome").textContent() !== "HumanHandoff") throw new Error("Hosted browser workflow did not reach HumanHandoff");
  await page.getByRole("button", { name: "Cannot assess" }).click();
  await page.locator(".outcome").filter({ hasText: "CannotAssess" }).waitFor();
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
  if (overflow) throw new Error("Hosted mobile UI has horizontal overflow");
} finally {
  await browser.close();
}

console.log(JSON.stringify({ status: "PASS", baseUrl, scenarios }, null, 2));