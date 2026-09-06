import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { getRegistry } from "./registry.js";
import { checkReviewStore, ReviewStoreCapacityError } from "./review-store.js";
import { assertRouterRequest } from "./router-contract.js";
import { generateCandidateResults, getEvaluationSummary } from "./evaluation.js";
import { applyAnalystDisposition, getReview, runBoundDocumentIntake, runSecurityReview, type AnalystDecision } from "./workflow.js";

export interface RuntimeLogEntry {
  timestamp: string;
  level: "info" | "error";
  event: "http_request" | "request_error";
  requestId: string;
  method: string;
  path: string;
  statusCode?: number;
  durationMs?: number;
  error?: string;
}

interface AppOptions {
  logger?: (entry: RuntimeLogEntry) => void;
  readinessCheck?: typeof checkReviewStore;
}

const validRequestId = /^[A-Za-z0-9._:-]{1,128}$/;

export function createApp(options: AppOptions = {}) {
  const app = express();
  const logger = options.logger ?? ((entry: RuntimeLogEntry) => console.log(JSON.stringify(entry)));
  const readinessCheck = options.readinessCheck ?? checkReviewStore;

  app.set("trust proxy", 1);
  app.use((request, response, next) => {
    const suppliedRequestId = request.header("x-request-id")?.trim();
    const requestId = suppliedRequestId && validRequestId.test(suppliedRequestId) ? suppliedRequestId : randomUUID();
    const startedAt = performance.now();
    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    response.once("finish", () => logger({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "http_request",
      requestId,
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
    }));
    next();
  });
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

  app.get("/api/health", async (request, response) => {
    const registry = getRegistry();
    try {
      const reviewStore = await readinessCheck();
      const ready = registry.status === "healthy" && reviewStore.status === "healthy";
      response.status(ready ? 200 : 503).json({
        status: ready ? "healthy" : "degraded",
        ready,
        mode: "Demo",
        service: "ESP Skill Router API",
        version: "0.1.0",
        uptimeSeconds: Math.floor(process.uptime()),
        registry: { status: registry.status, skillCount: registry.skills.length, pluginCount: registry.plugins.length },
        reviewStore,
      });
    } catch (error) {
      logger({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "request_error",
        requestId: String(response.locals.requestId ?? "unknown"),
        method: request.method,
        path: request.path,
        error: error instanceof Error ? error.message : "Review store readiness check failed",
      });
      response.status(503).json({
        status: "degraded",
        ready: false,
        mode: "Demo",
        service: "ESP Skill Router API",
        version: "0.1.0",
        uptimeSeconds: Math.floor(process.uptime()),
        registry: { status: registry.status, skillCount: registry.skills.length, pluginCount: registry.plugins.length },
        reviewStore: { status: "unavailable", backend: "file", durableBackup: true },
      });
    }
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

  app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = error instanceof ReviewStoreCapacityError ? 507
      : message.startsWith("Unknown synthetic case") || message.startsWith("Review not found") ? 404
      : message.includes("required") || message.includes("not awaiting") || message.includes("Consumer Binding") || message.includes("does not permit") || message.includes("citations do not resolve") || message.includes("request contract violation") ? 400
      : 500;
    const requestId = String(response.locals.requestId ?? "unknown");
    if (status === 500) {
      logger({
        timestamp: new Date().toISOString(),
        level: "error",
        event: "request_error",
        requestId,
        method: request.method,
        path: request.path,
        error: message,
      });
    }
    response.status(status).json({ error: status === 500 ? "Unexpected server error" : message, requestId });
  });

  return app;
}