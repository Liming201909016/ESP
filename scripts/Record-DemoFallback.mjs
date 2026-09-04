import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const assetDirectory = resolve(root, "docs", "00-Hackathon", "assets");
const recordingDirectory = resolve(root, "artifacts", "demo-recording");
const outputPath = resolve(assetDirectory, "esp-demo-fallback.webm");

await rm(recordingDirectory, { recursive: true, force: true });
await mkdir(recordingDirectory, { recursive: true });
await mkdir(assetDirectory, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: recordingDirectory, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

try {
  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.getByRole("heading", { name: "Five Skills. Four Plugins. One contract." }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.getByRole("combobox", { name: "Synthetic package" }).scrollIntoViewIfNeeded();
  await page.getByRole("combobox", { name: "Synthetic package" }).selectOption("SYN-APP-002");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Run review" }).click();
  await page.getByRole("heading", { name: "Safety control" }).waitFor();
  await page.getByRole("heading", { name: "Safety control" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  await page.getByRole("heading", { name: /Evidence/ }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  await page.getByRole("heading", { name: "Analyst disposition" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await page.getByRole("heading", { name: "Human decision retained" }).waitFor();
  await page.getByRole("heading", { name: "APP Security Review" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.getByRole("heading", { name: "FoundationPass" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
} finally {
  await page.close();
  await context.close();
  await browser.close();
}

const recordings = (await readdir(recordingDirectory)).filter((name) => name.endsWith(".webm"));
if (recordings.length !== 1) {
  throw new Error(`Expected one fallback recording, found ${recordings.length}`);
}
await copyFile(resolve(recordingDirectory, recordings[0]), outputPath);
console.log(`Demo fallback recording: PASS (${outputPath})`);