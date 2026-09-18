import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createReferralRailServer } from "../src/server.js";
import { configuredClient, requireWrite } from "../src/config.js";

async function connected() {
  vi.stubEnv("REFERRALRAIL_WRITE_ENABLED", "false"); vi.stubEnv("REFERRALRAIL_PRIVATE_KEY", "");
  const server = createReferralRailServer(); const client = new Client({ name: "test", version: "0.1.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport); await client.connect(clientTransport); return { client, server };
}

describe("ReferralRail MCP", () => {
  it("constructs and discovers the complete safe tool surface", async () => {
    const { client } = await connected(); const result = await client.listTools(); const names = result.tools.map(tool => tool.name);
    expect(names).toContain("referralrail_get_protocol"); expect(names).toContain("referralrail_get_available_actions"); expect(names).toContain("referralrail_settle_opportunity"); expect(names).not.toContain("set_judge"); expect(names).not.toContain("record_outcome"); expect(names).not.toContain("writeAnyMethod");
  });
  it("registers the complete v2 lifecycle without arbitrary or key-bearing tools", async () => { vi.stubEnv("REFERRALRAIL_V2_ADDRESS", "0xe26b9eAA0B956fdcaC1EF5F7c423C9f77CA703a3"); vi.stubEnv("OUTCOMEJUDGE_V2_ADDRESS", "0xdf7d48A4739C44b335B36Fe1F09ABd18eEc73087"); const { client } = await connected(); const names = (await client.listTools()).tools.map(tool => tool.name); for (const name of ["referralrail_v2_get_protocol", "referralrail_v2_get_position", "referralrail_v2_get_accounting", "referralrail_v2_get_available_actions", "referralrail_v2_create_campaign", "referralrail_v2_decline_referral", "referralrail_v2_release_referral", "referralrail_v2_submit_evidence", "referralrail_v2_close_intake", "referralrail_v2_finalise_campaign", "referralrail_v2_cancel_campaign"]) expect(names).toContain(name); expect(names).not.toContain("referralrail_v2_write_any_method"); const evidence = (await client.listTools()).tools.find(tool => tool.name === "referralrail_v2_submit_evidence"); expect(evidence?.description).toContain("public HTTPS evidence URL"); expect(evidence?.description).not.toContain("public X post"); });
  it("is read-only by default and rejects writes without explicit enablement", () => { vi.stubEnv("REFERRALRAIL_WRITE_ENABLED", "false"); vi.stubEnv("REFERRALRAIL_PRIVATE_KEY", "0x" + "1".repeat(64)); expect(configuredClient().writeEnabled).toBe(false); expect(() => requireWrite(false, undefined)).toThrow(/disabled/); });
  it("requires both signer and explicit write mode", () => { vi.stubEnv("REFERRALRAIL_WRITE_ENABLED", "true"); vi.stubEnv("REFERRALRAIL_PRIVATE_KEY", ""); expect(() => configuredClient()).toThrow(/requires/); expect(() => requireWrite(true, undefined)).toThrow(/signing/); });
  it("rejects malformed IDs and addresses through MCP schemas", async () => { const { client } = await connected(); const badId = await client.callTool({ name: "referralrail_get_opportunity", arguments: { opportunityId: 0 } }); const badAddress = await client.callTool({ name: "referralrail_get_available_actions", arguments: { opportunityId: 1, address: "not-an-address" } }); expect(badId.isError).toBe(true); expect(badAddress.isError).toBe(true); });
  it("keeps judgment and settlement delegated to the SDK", async () => { const source = await import("node:fs/promises"); const text = await source.readFile(new URL("../src/server.ts", import.meta.url), "utf8"); expect(text).toContain("client.settleOpportunity"); expect(text).not.toContain("record_outcome"); expect(text).not.toContain("evaluate_once"); });
});
