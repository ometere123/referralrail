import { describe, expect, it } from "vitest";
import { validAddress, validHost, validPublicEvidenceUrl, validateV2Campaign } from "./v2Validation";

const base = {
  title: "Bounded campaign",
  brief: "A sufficiently detailed brief describing the inspectable work required.",
  criteria: "A sufficiently detailed criterion describing the observable result.",
  evidenceProfile: "PUBLIC_WEB" as const,
  owner: "",
  repo: "",
  branch: "",
  allowedHost: "",
  maxPositions: "2",
  pending: "1",
  candidateReward: 1n,
  referralReward: 1n,
  reservationSeconds: 3600,
  workSeconds: 7200,
  campaignSeconds: 86400,
};

describe("v2 frontend validation", () => {
  it("allows public web without repository fields or allowed host", () => {
    expect(validateV2Campaign(base)).toBe("");
  });
  it("requires structured GitHub fields only for GitHub campaigns", () => {
    expect(validateV2Campaign({ ...base, evidenceProfile: "GITHUB_PR", owner: "https://github.com/ometere123", repo: "evifix", branch: "main" })).toMatch(/owner/);
    expect(validateV2Campaign({ ...base, evidenceProfile: "GITHUB_PR", owner: "ometere123", repo: "https://github.com/ometere123/evifix", branch: "main" })).toMatch(/Repository/);
    expect(validateV2Campaign({ ...base, evidenceProfile: "GITHUB_PR", owner: "ometere123", repo: "evifix", branch: "" })).toMatch(/branch/);
  });
  it("enforces position, pending, and duration bounds", () => {
    expect(validateV2Campaign({ ...base, maxPositions: "1001" })).toMatch(/Max positions/);
    expect(validateV2Campaign({ ...base, maxPositions: "2", pending: "3" })).toMatch(/Pending/);
    expect(validateV2Campaign({ ...base, workSeconds: 86400, campaignSeconds: 86400 })).toMatch(/exceed work/);
  });
  it("accepts hostname-only optional policy and rejects URL-shaped hosts", () => {
    expect(validHost("")).toBe(true);
    expect(validHost("docs.example.com")).toBe(true);
    expect(validHost("https://docs.example.com")).toBe(false);
    expect(validHost("example.com/path")).toBe(false);
    expect(validHost("example.com:8080")).toBe(false);
  });
  it("rejects malformed or local public evidence URLs", () => {
    expect(validPublicEvidenceUrl("https://example.com/path")).toBe(true);
    expect(validPublicEvidenceUrl("https://localhost/")).toBe(false);
    expect(validPublicEvidenceUrl("https://127.20.30.40/")).toBe(false);
    expect(validPublicEvidenceUrl("https://172.16.0.1/")).toBe(false);
    expect(validPublicEvidenceUrl("https://172.2.0.1/")).toBe(true);
    expect(validPublicEvidenceUrl("https://example.com/path", "docs.example.com")).toBe(false);
  });
  it("accepts real addresses and rejects malformed, zero, employer, or self values at the action layer", () => {
    expect(validAddress("0x1111111111111111111111111111111111111111")).toBe(true);
    expect(validAddress("0x0000000000000000000000000000000000000000")).toBe(false);
    expect(validAddress("not-an-address")).toBe(false);
  });
});
