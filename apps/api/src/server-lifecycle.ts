import type { Server } from "node:http";

export type ShutdownResult = "closed" | "forced";

export function closeHttpServer(server: Server, timeoutMs: number): Promise<ShutdownResult> {
  return new Promise((resolveClose, reject) => {
    let completed = false;
    const finish = (result: ShutdownResult) => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      resolveClose(result);
    };
    const timeout = setTimeout(() => {
      server.closeAllConnections();
      finish("forced");
    }, timeoutMs);
    timeout.unref();

    server.close((error) => {
      if (completed) return;
      if (error) {
        completed = true;
        clearTimeout(timeout);
        reject(error);
        return;
      }
      finish("closed");
    });
    server.closeIdleConnections();
  });
}