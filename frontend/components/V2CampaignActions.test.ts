import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./V2CampaignActions.tsx", import.meta.url), "utf8");

describe("v2 position action rendering", () => {
  it("renders a GitHub retry write for a valid replacement PR", () => {
    expect(source).toContain('campaign.evidence_profile === "GITHUB_PR"');
    expect(source).toContain('method="retry_inconclusive"');
    expect(source).toContain('String(Number(pr))');
  });
  it("keeps the public web retry write profile-specific", () => {
    expect(source).toContain('retryEvidenceOk ? <Write');
    expect(source).toContain('evidence.trim()');
  });
});