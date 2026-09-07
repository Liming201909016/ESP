import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createServer } from "node:net";

async function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate a Demo media port"));
        return;
      }
      server.close(() => resolvePort(address.port));
    });
  });
}

export async function startDemoMediaRuntime(name) {
  const root = resolve(import.meta.dirname, "..");
  const port = await availablePort();
  const dataDirectory = resolve(tmpdir(), `esp-${name}-${process.pid}-${Date.now()}`);
  await rm(dataDirectory, { recursive: true, force: true });
  await mkdir(dataDirectory, { recursive: true });

  const child = spawn(process.execPath, [resolve(root, "apps", "api", "dist", "server.js")], {
    cwd: root,
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), ESP_DATA_DIR: dataDirectory, ESP_API_RATE_LIMIT: "1000" },
    stdio: ["ignore", "pipe", "inherit"],
  });

  await new Promise((resolveReady, reject) => {
    const timeout = setTimeout(() => reject(new Error("Demo media runtime did not start")), 10_000);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Demo media runtime exited early: ${code}`));
    });
    child.stdout.on("data", (chunk) => {
      if (!chunk.toString().includes('"event":"server_started"')) return;
      clearTimeout(timeout);
      resolveReady();
    });
  });

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async stop() {
      child.kill();
      await new Promise((resolveExit) => {
        if (child.exitCode !== null) {
          resolveExit();
          return;
        }
        child.once("exit", resolveExit);
        setTimeout(resolveExit, 2_000);
      });
      await rm(dataDirectory, { recursive: true, force: true });
    },
  };
}