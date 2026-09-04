import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { getRegistry } from "./registry.js";
import { assertRouterRequest } from "./router-contract.js";
import { generateCandidateResults, getEvaluationSummary } from "./evaluation.js";
import { applyAnalystDisposition, getReview, runBoundDocumentIntake, runSecurityReview, type AnalystDecision } from "./workflow.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
  }));
  app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many Demo API requests; retry later." },
  }));
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

  app.get("/api/evaluation/candidate-results", async (_request, response, next) => {
    try {
      response.json(await generateCandidateResults());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/evaluation/summary", async (_request, response, next) => {
    try {
      response.json(await getEvaluationSummary());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reviews", async (request, response, next) => {
    try {
      assertRouterRequest(request.body);
      response.json(await runSecurityReview(request.body.caseId, request.body.request, request.body.consumerBindingCode));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/skill-invocations/document-intake", async (request, response, next) => {
    try {
      const { caseId, request: requestText, consumerBindingCode } = request.body ?? {};
      if (typeof caseId !== "string" || typeof requestText !== "string" || typeof consumerBindingCode !== "string") {
        response.status(400).json({ error: "caseId, request, and consumerBindingCode are required" });
        return;
      }
      response.json(await runBoundDocumentIntake(caseId, requestText, consumerBindingCode));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reviews/:correlationId", async (request, response, next) => {
    try {
      const review = await getReview(request.params.correlationId);
      if (!review) {
        response.status(404).json({ error: `Review not found: ${request.params.correlationId}` });
        return;
      }
      response.json(review);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reviews/:correlationId/disposition", async (request, response, next) => {
    try {
      const decisions: AnalystDecision[] = ["Accept", "Modify", "Reject", "Escalate", "CannotAssess"];
      const decision = request.body?.decision as AnalystDecision;
      const rationale = request.body?.rationale;
      if (!decisions.includes(decision) || typeof rationale !== "string" || !rationale.trim()) {
        response.status(400).json({ error: "A valid decision and rationale are required" });
        return;
      }
      response.json(await applyAnalystDisposition(request.params.correlationId, decision, rationale.trim(), request.body?.finalRisk));
    } catch (error) {
      next(error);
    }
  });

  const moduleDirectory = fileURLToPath(new URL(".", import.meta.url));
  app.use(express.static(resolve(moduleDirectory, "../../web/dist")));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message.startsWith("Unknown synthetic case") || message.startsWith("Review not found") ? 404
      : message.includes("required") || message.includes("not awaiting") || message.includes("Consumer Binding") || message.includes("does not permit") || message.includes("citations do not resolve") || message.includes("request contract violation") ? 400
      : 500;
    response.status(status).json({ error: message });
  });

  return app;
}