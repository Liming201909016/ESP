import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { createServer } from "node:net";
import { performance } from "node:perf_hooks";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, process.argv[2] ?? "artifacts/performance/demo-performance.json");
const dataDirectory = await mkdtemp(resolve(tmpdir(), "esp-performance-"));
const startupTargetMs = 10_000;
const workflowTargetMs = 2_000;
const port = await new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") return reject(new Error("Unable to allocate a performance-test port"));
    server.close(() => resolvePort(address.port));
  });
});

const startedAt = performance.now();
const child = spawn(process.execPath, [resolve(root, "apps", "api", "dist", "server.js")], {
  cwd: root,
  env: { ...process.env, PORT: String(port), ESP_DATA_DIR: dataDirectory },
  stdio: ["ignore", "pipe", "inherit"],
});

try {
  await new Promise((resolveReady, reject) => {
    const timeout = setTimeout(() => reject(new Error("Demo exceeded the startup target")), startupTargetMs);
    child.once("exit", (code) => reject(new Error(`Demo exited early: ${code}`)));
    child.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("ESP API listening")) {
        clearTimeout(timeout);
        resolveReady();
      }
    });
  });
  const startupMs = Math.round((performance.now() - startedAt) * 100) / 100;
  const baseUrl = `http://127.0.0.1:${port}`;
  const scenarios = [];

  for (const caseId of ["SYN-RG-001", "SYN-RG-002", "SYN-APP-001", "SYN-APP-002"]) {
    const scenarioStartedAt = performance.now();
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId, request: "Perform an evidence-grounded security review.", consumerBindingCode: "CB-ESP-DEMO-001" }),
    });
    const result = await response.json();
    const durationMs = Math.round((performance.now() - scenarioStartedAt) * 100) / 100;
    if (!response.ok) throw new Error(`${caseId} failed: ${result.error ?? response.status}`);
    scenarios.push({ caseId, durationMs, outcome: result.outcome, passed: durationMs < workflowTargetMs });
  }

  const report = {
    measuredAt: new Date().toISOString(),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    targets: { startupMs: startupTargetMs, workflowMs: workflowTargetMs },
    startup: { durationMs: startupMs, passed: startupMs < startupTargetMs },
    scenarios,
    passed: startupMs < startupTargetMs && scenarios.every((scenario) => scenario.passed),
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Demo performance: ${report.passed ? "PASS" : "FAIL"} (startup ${startupMs}ms; max workflow ${Math.max(...scenarios.map((scenario) => scenario.durationMs))}ms)`);
  console.log(`Report: ${outputPath}`);
  if (!report.passed) process.exitCode = 1;
} finally {
  child.kill();
  await rm(dataDirectory, { recursive: true, force: true });
}