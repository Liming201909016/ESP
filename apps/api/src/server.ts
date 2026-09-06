import { createApp } from "./app.js";
import { cleanupOrphanedReviewStoreFiles } from "./review-store.js";
import { closeHttpServer } from "./server-lifecycle.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";
const configuredShutdownTimeout = Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 10_000);
const shutdownTimeoutMs = Number.isFinite(configuredShutdownTimeout) && configuredShutdownTimeout > 0 ? configuredShutdownTimeout : 10_000;

const removedTemporaryFiles = await cleanupOrphanedReviewStoreFiles();
const server = createApp().listen(port, host, () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    event: "server_started",
    host,
    port,
    removedTemporaryFiles,
  }));
});

let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", event: "server_stopping", signal }));
  try {
    const result = await closeHttpServer(server, shutdownTimeoutMs);
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", event: "server_stopped", signal, result }));
    process.exitCode = result === "closed" ? 0 : 1;
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      event: "server_shutdown_failed",
      signal,
      error: error instanceof Error ? error.message : "Unexpected shutdown error",
    }));
    process.exitCode = 1;
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));