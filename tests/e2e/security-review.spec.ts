import { expect, test } from "@playwright/test";

async function runCase(page: import("@playwright/test").Page, caseId: string) {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Synthetic package" }).selectOption(caseId);
  await page.getByRole("button", { name: "Run review" }).click();
}

test("RG happy path supports analyst acceptance and Final report", async ({ page }) => {
  await runCase(page, "SYN-RG-001");
  await expect(page.locator(".outcome")).toHaveText("HumanHandoff");
  await expect(page.locator(".trace-list li")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "RG Security Review" })).toBeVisible();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.locator(".outcome")).toHaveText("Success");
  await expect(page.locator(".report-heading span")).toHaveText("Final");
  await expect(page.locator(".evidence-list li").filter({ hasText: "HumanDecision" })).toHaveCount(1);
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
});

test("RG missing-input path stops after Document Intake", async ({ page }) => {
  await runCase(page, "SYN-RG-002");
  await expect(page.locator(".outcome")).toHaveText("NeedsInformation");
  await expect(page.locator(".trace-list li")).toHaveCount(1);
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