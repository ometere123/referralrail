import { describe, expect, it } from "vitest";
import { ReferralRailClient } from "../src/index.js";

describe("canonical live reads", () => {
  it.skipIf(process.env.RUN_REFERRALRAIL_LIVE_READS !== "1")("reads the verified deployment without mutating it", async () => {
    const rail = new ReferralRailClient();
    const protocol = await rail.getProtocolConfig();
    const accounting = await rail.getAccounting();
    const paid = await rail.getOpportunity(3);
    const refunded = await rail.getOpportunity(2);
    const paidJudgment = await rail.getJudgment(3, 1);
    const refundedJudgment = await rail.getJudgment(2, 1);
    expect(protocol.judge_address.toLowerCase()).toBe(rail.outcomeJudgeAddress.toLowerCase());
    expect(accounting.conservation_delta).toBeGreaterThanOrEqual(0n);
    expect(paid.state).toBe("PAID"); expect(paid.settlement_released).toBe(true); expect(paidJudgment?.outcome).toBe("COMPLETED");
    expect(refunded.state).toBe("REFUNDED"); expect(refunded.settlement_released).toBe(true); expect(refundedJudgment?.outcome).toBe("NOT_COMPLETED");
  }, 180000);
});
