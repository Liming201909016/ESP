import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "docs", "00-Hackathon", "assets");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();
try {
  for (const capture of [
    { name: "desktop", viewport: { width: 1440, height: 1000 } },
    { name: "mobile", viewport: { width: 390, height: 844 } },
  ]) {
    const page = await browser.newPage({ viewport: capture.viewport });
    await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
    await page.getByRole("combobox", { name: "Synthetic package" }).selectOption("SYN-APP-002");
    await page.getByRole("button", { name: "Run review" }).click();
    await page.getByRole("heading", { name: "Safety control" }).waitFor();
    await page.screenshot({ path: resolve(outputDirectory, `esp-demo-${capture.name}.png`), fullPage: true });
    await page.close();
  }
  console.log(`Demo screenshots: PASS (${outputDirectory})`);
} finally {
  await browser.close();
}