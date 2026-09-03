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
});