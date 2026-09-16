import { describe, expect, it } from "vitest";
import { CANONICAL, ReferralRailClient, ValidationError, fundingFor, getAvailableActions } from "../src/index.js";

const base = { id: 1, employer: "0x0000000000000000000000000000000000000001", candidate: "0x0000000000000000000000000000000000000002", referrer: "0x0000000000000000000000000000000000000003", state: "ACCEPTED", referral_deadline: 9999999999, completion_deadline: 9999999999, attempt_count: 0, retry_deadline: 0, settlement_released: false } as any;
describe("ReferralRail SDK", () => {
  it("pins the canonical deployment", () => expect(CANONICAL.chainId).toBe(61997));
  it("checks exact funding", () => expect(fundingFor(2n, 1n)).toBe(3n));
  it("rejects nonpositive funding", () => expect(() => fundingFor(0n, 1n)).toThrow(ValidationError));
  it("determines candidate actions", () => expect(getAvailableActions(base, { address: base.candidate }).find(x => x.action === "submit_work")?.allowed).toBe(true));
  it("rejects wrong canonical chain", () => expect(() => new ReferralRailClient({ chainId: 61999 })).toThrow(/locked/));
});
