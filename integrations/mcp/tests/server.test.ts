import { describe, expect, it, vi } from "vitest";

describe("MCP configuration", () => {
  it("is read-only unless explicitly enabled", async () => {
    vi.stubEnv("REFERRALRAIL_WRITE_ENABLED", "false");
    vi.stubEnv("REFERRALRAIL_PRIVATE_KEY", "");
    const { configuredClient } = await import("../src/config.js");
    expect(configuredClient().writeEnabled).toBe(false);
    expect(configuredClient().account).toBeUndefined();
  });
});
