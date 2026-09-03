import cors from "cors";
import express from "express";

import { getRegistry } from "./registry.js";

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

  return app;
}