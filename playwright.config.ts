import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const e2eDataDirectory = resolve(tmpdir(), `esp-e2e-${process.pid}`);
process.env.ESP_E2E_DATA_DIR = e2eDataDirectory;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  globalTeardown: "./tests/e2e/global-teardown.ts",
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    env: { ESP_DATA_DIR: e2eDataDirectory },
    reuseExistingServer: true,
    timeout: 30_000,
  },
});