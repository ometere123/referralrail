import { describe, expect, it } from "vitest";
import { ReferralRailClient } from "../src/index.js";

describe("canonical live reads", () => {
  it.skipIf(process.env.RUN_REFERRALRAIL_LIVE_READS !== "1")("reads the verified deployment without mutating it", async () => {
    const rail = new ReferralRailClient();
    const protocol = await rail.getProtocolConfig();
    const accounting = await rail.getAccounting();
    const opportunity = await rail.getOpportunity(Number(process.env.REFERRALRAIL_LIVE_OPPORTUNITY_ID ?? 3));
    expect(protocol.judge_address.toLowerCase()).toBe(rail.outcomeJudgeAddress.toLowerCase());
    expect(accounting.conservation_delta).toBeGreaterThanOrEqual(0n);
    expect(["PAID", "REFUNDED", "EXPIRED", "CANCELLED"]).toContain(opportunity.state);
  }, 180000);
});
