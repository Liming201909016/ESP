import { afterAll, describe, expect, it } from "vitest";

import { createApp } from "./app.js";

const server = createApp().listen(0, "127.0.0.1");

afterAll(() => server.close());

describe("health endpoint", () => {
  it("reports Demo Mode health", async () => {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Test server did not bind to a TCP port");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "healthy",
      mode: "Demo",
      registry: { status: "healthy", skillCount: 5, pluginCount: 4 },
    });
  });

  it("returns five pinned Skills and four healthy Demo Plugins", async () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/registry`);
    const body = await response.json();

    expect(body.skills).toHaveLength(5);
    expect(body.plugins).toHaveLength(4);
    expect(body.skills.every((skill: { version: string }) => skill.version === "1.0.0")).toBe(true);
    expect(body.plugins.every((plugin: { status: string; mode: string }) => plugin.status === "healthy" && plugin.mode === "Demo")).toBe(true);
  });

  it("runs the RG happy path through five pinned Skills", async () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId: "SYN-RG-001" }),
    });
    const body = await response.json();

    expect(body.state).toBe("AwaitingAnalystDisposition");
    expect(body.trace).toHaveLength(5);
    expect(body.trace.map((entry: { sequence: number }) => entry.sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(body.evidence.length).toBeGreaterThan(0);
    expect(body.report).toMatchObject({
      status: "Draft",
      title: "RG Security Review",
      runbookCode: "RB-RG-CUSTOMER-001",
      citationsPreserved: true,
      analystDecision: null,
    });
    expect(body.report.findings[0].citations).toHaveLength(4);
  });

  it("stops after intake when mandatory material is missing", async () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId: "SYN-RG-002" }),
    });
    const body = await response.json();

    expect(body.outcome).toBe("NeedsInformation");
    expect(body.trace).toHaveLength(1);
    expect(body.trace[0]).toMatchObject({ skillCode: "LS-SEC-DOC-INTAKE", outcome: "NeedsInformation" });
  });

  it("runs the APP happy path with cited permission evidence", async () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId: "SYN-APP-001" }),
    });
    const body = await response.json();

    expect(body.requestType).toBe("APP");
    expect(body.trace).toHaveLength(5);
    expect(body.evidence.filter((item: { type: string }) => item.type === "Fact")).toHaveLength(4);
    expect(body.safety).toMatchObject({ promptInjectionDetected: false, governanceOverrideAllowed: false });
  });

  it("ignores prompt injection and records a safe outcome", async () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId: "SYN-APP-002" }),
    });
    const body = await response.json();

    expect(body.safety).toEqual({
      promptInjectionDetected: true,
      promptInjectionIgnored: true,
      governanceOverrideAllowed: false,
    });
    expect(body.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "ToolResult", claimReference: "prompt-injection-ignored" }),
    ]));
    expect(body.proposedRisk).toBe("High");
    expect(body.trace).toHaveLength(5);
  });

  it("accepts the proposed risk and finalizes the report with HumanDecision evidence", async () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const review = await (await fetch(`${baseUrl}/api/reviews`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ caseId: "SYN-RG-001" }),
    })).json();
    const disposition = await (await fetch(`${baseUrl}/api/reviews/${review.correlationId}/disposition`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision: "Accept", rationale: "Evidence reviewed" }),
    })).json();

    expect(disposition).toMatchObject({
      state: "Completed",
      outcome: "Success",
      report: { status: "Final", analystDecision: { decision: "Accept", finalRisk: "Medium" } },
    });
    expect(disposition.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "HumanDecision", claimReference: "disposition:Accept" }),
    ]));
  });

  it("keeps the report Draft when the analyst marks Cannot Assess", async () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const review = await (await fetch(`${baseUrl}/api/reviews`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ caseId: "SYN-APP-001" }),
    })).json();
    const disposition = await (await fetch(`${baseUrl}/api/reviews/${review.correlationId}/disposition`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision: "CannotAssess", rationale: "Evidence requires clarification" }),
    })).json();

    expect(disposition).toMatchObject({ state: "CannotAssess", outcome: "CannotAssess", report: { status: "Draft" } });
    expect(disposition.analystDisposition.finalRisk).toBeUndefined();
  });
});