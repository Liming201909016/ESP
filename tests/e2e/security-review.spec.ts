import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function runCase(page: import("@playwright/test").Page, caseId: string) {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Synthetic package" }).selectOption(caseId);
  await page.getByRole("button", { name: "Run review" }).click();
}

test("RG happy path supports analyst acceptance and Final report", async ({ page }) => {
  await runCase(page, "SYN-RG-001");
  await expect(page.locator(".outcome")).toHaveText("HumanHandoff");
  await expect(page.locator(".trace-list li")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "From selected capability to accountable outcome" })).toBeVisible();
  await expect(page.locator(".lineage-chain")).toContainText("5/5 Skills");
  await expect(page.locator(".lineage-chain")).toContainText("All references retained");
  await page.locator(".lineage-citations button").first().click();
  await expect(page.locator(".evidence-list li.selected")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "RG Security Review" })).toBeVisible();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.locator(".outcome")).toHaveText("Success");
  await expect(page.locator(".report-heading span")).toHaveText("Final");
  await expect(page.locator(".evidence-list li").filter({ hasText: "HumanDecision" })).toHaveCount(1);
  await expect(page.locator(".lineage-chain")).toContainText("Accept");
  await expect(page.locator(".lineage-chain")).toContainText("Final");
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("RG missing-input path stops after Document Intake", async ({ page }) => {
  await runCase(page, "SYN-RG-002");
  await expect(page.locator(".outcome")).toHaveText("NeedsInformation");
  await expect(page.locator(".trace-list li")).toHaveCount(1);
  await expect(page.locator(".lineage-status")).toHaveText("Partial");
  await expect(page.locator(".lineage-chain")).toContainText("1/5 Skills");
  await expect(page.locator(".lineage-chain")).toContainText("No report at governed stop");
  await expect(page.getByRole("heading", { name: "Needs information" })).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("APP happy path can be marked Cannot Assess without final risk", async ({ page }) => {
  await runCase(page, "SYN-APP-001");
  await page.getByRole("button", { name: "Cannot assess" }).click();
  await expect(page.locator(".outcome")).toHaveText("CannotAssess");
  await expect(page.locator(".completed-disposition")).toContainText("Final risk: Not assigned");
  await expect(page.locator(".report-heading span")).toHaveText("Draft");
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("APP prompt injection is ignored and evidenced", async ({ page }) => {
  await runCase(page, "SYN-APP-002");
  await expect(page.getByRole("heading", { name: "Safety control" })).toBeVisible();
  await expect(page.locator(".safety-result")).toContainText("detected and ignored");
  await expect(page.locator(".evidence-list li").filter({ hasText: "prompt-injection-ignored" })).toHaveCount(1);
  await expect(page.locator(".trace-list li")).toHaveCount(5);
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("employee intent discovers an authorized governed path before execution", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Synthetic package" }).selectOption("SYN-APP-001");
  await page.getByRole("textbox", { name: "Request" }).fill("Create an application registration and grant permissions after a security review.");
  await page.getByRole("button", { name: "Discover governed path" }).click();

  await expect(page.getByRole("heading", { name: "Governed execution path" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Governed enterprise outcome path" }).getByRole("listitem")).toHaveCount(6);
  await expect(page.locator(".skill-candidates button")).toHaveCount(5);
  await page.getByRole("button", { name: /Risk Rating/ }).click();
  await expect(page.locator(".skill-inspector")).toContainText("human approval");
  await expect(page.locator(".outcome-contract")).toContainText("Action");
  await expect(page.locator(".outcome-contract")).toContainText("Knowledge");

  await page.getByRole("button", { name: "Run review" }).click();
  await expect(page.locator(".outcome")).toHaveText("HumanHandoff");
  await expect(page.locator(".trace-list li")).toHaveCount(5);
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("recent review queue reopens and resumes the same persisted review", async ({ page }) => {
  await runCase(page, "SYN-APP-001");
  await expect(page.locator(".outcome")).toHaveText("HumanHandoff");
  const correlationText = await page.locator(".result-summary small").filter({ hasText: "Correlation" }).textContent();
  const correlationId = correlationText?.replace("Correlation ", "");
  expect(correlationId).toBeTruthy();

  await page.reload();
  const recentItem = page.locator(`[data-correlation-id="${correlationId}"]`);
  await expect(recentItem).toBeVisible();
  await recentItem.click();
  await expect(page.locator(".result-summary")).toContainText(correlationId!);
  await expect(page.getByRole("heading", { name: "Analyst disposition" })).toBeVisible();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.locator(".report-heading span")).toHaveText("Final");
  await expect(page.locator(".lineage-chain")).toContainText("Accept");
  await expect(recentItem).toContainText("Completed");
  await expect(recentItem).toContainText("Accept");
});

test("review API failure exposes an actionable retry", async ({ page }) => {
  let attempt = 0;
  await page.route("**/api/reviews", async (route) => {
    attempt += 1;
    if (attempt === 1) {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Review service unavailable" }) });
      return;
    }
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Run review" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Review service unavailable" })).toBeVisible();
  await page.getByRole("button", { name: "Retry review" }).click();
  await expect(page.locator(".outcome")).toHaveText("HumanHandoff");
});

test("invalid startup response exposes status retry", async ({ page }) => {
  let attempt = 0;
  await page.route("**/api/registry", async (route) => {
    attempt += 1;
    if (attempt === 1) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "not-json" });
      return;
    }
    await route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("alert").filter({ hasText: "invalid response" })).toBeVisible();
  await page.getByRole("button", { name: "Retry status" }).click();
  await expect(page.locator(".health-badge")).toHaveText("healthy");
});

test("page passes automated WCAG A and AA checks", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("primary review journey is keyboard operable with visible focus", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Synthetic package" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Request" })).toBeFocused();
  await page.keyboard.press("Tab");
  const discoverButton = page.getByRole("button", { name: "Discover governed path" });
  await expect(discoverButton).toBeFocused();
  expect(await discoverButton.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Tab");
  const runButton = page.getByRole("button", { name: "Run review" });
  await expect(runButton).toBeFocused();
  expect(await runButton.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.locator(".outcome")).toBeVisible();
});