import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const port = await new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") {
      reject(new Error("Unable to allocate a smoke-test port"));
      return;
    }
    server.close(() => resolvePort(address.port));
  });
});

const child = spawn(process.execPath, [resolve(root, "apps", "api", "dist", "server.js")], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "inherit"],
});

try {
  await new Promise((resolveReady, reject) => {
    const timeout = setTimeout(() => reject(new Error("One-process Demo did not start")), 10_000);
    child.once("exit", (code) => reject(new Error(`One-process Demo exited early: ${code}`)));
    child.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("ESP API listening")) {
        clearTimeout(timeout);
        resolveReady();
      }
    });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  const rootResponse = await fetch(baseUrl);
  const html = await rootResponse.text();
  const health = await (await fetch(`${baseUrl}/api/health`)).json();
  const registry = await (await fetch(`${baseUrl}/api/registry`)).json();
  const review = await (await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ caseId: "SYN-RG-001" }),
  })).json();

  if (!rootResponse.ok || !html.includes("Enterprise Skill Platform")) throw new Error("Built UI was not served");
  if (health.status !== "healthy") throw new Error("Health endpoint failed");
  if (registry.skills.length !== 5 || registry.plugins.length !== 4) throw new Error("Registry endpoint failed");
  if (review.trace.length !== 5 || review.report.status !== "Draft") throw new Error("Review endpoint failed");
  console.log(`One-process Demo: PASS (port ${port})`);
} finally {
  child.kill();
}