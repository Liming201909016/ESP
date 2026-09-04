import cors from "cors";
import express from "express";

import { getRegistry } from "./registry.js";
import { runSecurityReview } from "./workflow.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    const registry = getRegistry();
    response.json({
      status: "healthy",
      mode: "Demo",
      service: "ESP Skill Router API",
      version: "0.1.0",
      registry: { status: registry.status, skillCount: registry.skills.length, pluginCount: registry.plugins.length },
    });
  });

  app.get("/api/registry", (_request, response) => {
    response.json(getRegistry());
  });

  app.post("/api/reviews", async (request, response, next) => {
    try {
      const caseId = request.body?.caseId;
      if (typeof caseId !== "string" || !caseId) {
        response.status(400).json({ error: "caseId is required" });
        return;
      }
      response.json(await runSecurityReview(caseId));
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    response.status(message.startsWith("Unknown synthetic case") ? 404 : 500).json({ error: message });
  });

  return app;
}