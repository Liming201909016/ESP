import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

import { startDemoMediaRuntime } from "./demo-media-runtime.mjs";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "docs", "00-Hackathon", "assets");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
try {
  for (const capture of [
    { name: "desktop", viewport: { width: 1440, height: 1000 } },
    { name: "mobile", viewport: { width: 390, height: 844 } },
  ]) {
    const runtime = await startDemoMediaRuntime(`screenshot-${capture.name}`);
    try {
      const page = await browser.newPage({ viewport: capture.viewport });
      await page.goto(runtime.baseUrl, { waitUntil: "networkidle" });
      await page.getByRole("combobox", { name: "Synthetic package" }).selectOption("SYN-RG-001");
      await page.getByRole("textbox", { name: "Request" }).fill("Review this resource group, network exposure, and managed identity for security risk.");
      await page.getByRole("button", { name: "Run review" }).click();
      await page.locator(".outcome").filter({ hasText: "HumanHandoff" }).waitFor();
      await page.screenshot({ path: resolve(outputDirectory, `esp-demo-${capture.name}.png`), fullPage: true });
      await page.close();
    } finally {
      await runtime.stop();
    }
  }

  const runtime = await startDemoMediaRuntime("screenshot-proofs");
  const proofPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await proofPage.goto(runtime.baseUrl, { waitUntil: "networkidle" });
    await proofPage.getByRole("tab", { name: /^Governance/ }).click();
    await proofPage.getByText("84/84 passed").waitFor();
    await proofPage.screenshot({ path: resolve(outputDirectory, "esp-demo-governance.png"), fullPage: true });
    await proofPage.getByRole("tab", { name: /^Reuse/ }).click();
    await proofPage.getByRole("button", { name: "Prove governed reuse" }).click();
    await proofPage.getByRole("heading", { name: "Architecture Review Workflow" }).waitFor();
    await proofPage.screenshot({ path: resolve(outputDirectory, "esp-demo-reuse.png"), fullPage: true });
    await proofPage.getByRole("tab", { name: /^Evaluation/ }).click();
    await proofPage.getByRole("region", { name: "FoundationPass" }).waitFor();
    await proofPage.screenshot({ path: resolve(outputDirectory, "esp-demo-evaluation.png"), fullPage: true });
    await proofPage.close();
  } finally {
    await runtime.stop();
  }
  console.log(`Demo screenshots: PASS (${outputDirectory})`);
} finally {
  await browser.close();
}