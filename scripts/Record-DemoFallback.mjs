import { access, copyFile, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

import { startDemoMediaRuntime } from "./demo-media-runtime.mjs";

const root = resolve(import.meta.dirname, "..");
const assetDirectory = resolve(root, "docs", "00-Hackathon", "assets");
const recordingDirectory = resolve(root, "artifacts", "demo-recording");
const outputPath = resolve(assetDirectory, "esp-demo-fallback.webm");

async function availableAsset(preferred, fallback) {
  try {
    await access(preferred);
    return preferred;
  } catch {
    return fallback;
  }
}

async function showSlide(page, imagePath, label, durationMs) {
  const image = (await readFile(imagePath)).toString("base64");
  await page.setContent(`<!doctype html><html><head><style>
    html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f4f6f2}
    body{display:grid;place-items:center}
    img{display:block;width:100%;height:100%;object-fit:contain}
  </style></head><body><img src="data:image/png;base64,${image}" alt="${label}"></body></html>`);
  await page.waitForTimeout(durationMs);
}

await rm(recordingDirectory, { recursive: true, force: true });
await mkdir(recordingDirectory, { recursive: true });
await mkdir(assetDirectory, { recursive: true });

const runtime = await startDemoMediaRuntime("recording");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: recordingDirectory, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

try {
  const overviewSlide = await availableAsset(
    resolve(assetDirectory, "esp-overview.png"),
    resolve(assetDirectory, "esp-demo-desktop.png"),
  );
  await showSlide(page, overviewSlide, "Enterprise Skill Platform overview", 8000);
  await showSlide(page, resolve(assetDirectory, "esp-demo-governance.png"), "ESP Governance Control Plane", 6000);
  await page.goto(runtime.baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "smooth"; });
  await page.getByRole("tab", { name: /^Review/ }).waitFor();
  await page.waitForTimeout(6000);
  await page.getByRole("combobox", { name: "Synthetic package" }).selectOption("SYN-RG-001");
  await page.getByRole("textbox", { name: "Request" }).fill("Review this resource group, network exposure, and managed identity for security risk.");
  await page.getByRole("button", { name: "Run review" }).click();
  await page.locator(".outcome").filter({ hasText: "HumanHandoff" }).waitFor();
  await page.getByRole("heading", { name: "From selected capability to accountable outcome" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(9000);
  await page.getByRole("heading", { name: /Evidence/ }).scrollIntoViewIfNeeded();
  await page.locator(".lineage-citations button").first().click();
  await page.waitForTimeout(9000);
  await page.getByRole("heading", { name: "Analyst disposition" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  await page.getByRole("combobox", { name: "Final risk" }).selectOption("High");
  await page.getByRole("button", { name: "Modify", exact: true }).click();
  await page.getByRole("heading", { name: "Human decision retained" }).waitFor();
  await page.getByRole("heading", { name: "RG Security Review" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(8000);

  await page.getByRole("combobox", { name: "Synthetic package" }).selectOption("SYN-RG-003");
  await page.getByRole("button", { name: "Run review" }).click();
  await page.getByRole("region", { name: "Governed execution stopped" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(9000);

  await page.getByRole("tab", { name: /^Governance/ }).click();
  await page.getByText("84/84 passed").waitFor();
  await page.locator(".governance-plane").evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    element.scrollIntoView({ block: "start" });
    window.scrollBy(0, -84);
  });
  await page.waitForTimeout(9000);

  await page.getByRole("tab", { name: /^Evaluation/ }).click();
  await page.locator(".evaluation-band").evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    element.scrollIntoView({ block: "start" });
    window.scrollBy(0, -84);
  });
  await page.waitForTimeout(9000);

  await page.getByRole("tab", { name: /^Reuse/ }).click();
  await page.getByRole("button", { name: "Prove governed reuse" }).click();
  await page.getByRole("heading", { name: "Architecture Review Workflow" }).waitFor();
  await page.locator(".reuse-proof").evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    element.scrollIntoView({ block: "start" });
    window.scrollBy(0, -84);
  });
  await page.waitForTimeout(12000);
} finally {
  await page.close();
  await context.close();
  await browser.close();
  await runtime.stop();
}

const recordings = (await readdir(recordingDirectory)).filter((name) => name.endsWith(".webm"));
if (recordings.length !== 1) {
  throw new Error(`Expected one fallback recording, found ${recordings.length}`);
}
await copyFile(resolve(recordingDirectory, recordings[0]), outputPath);
console.log(`Demo fallback recording: PASS (${outputPath})`);