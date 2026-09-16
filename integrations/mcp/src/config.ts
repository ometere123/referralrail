import { createAccount } from "genlayer-js";
import type { Account } from "viem";
import { ReferralRailClient } from "@referralrail/sdk";

export function configuredClient(): { client: ReferralRailClient; account?: Account; writeEnabled: boolean } {
  const key = process.env.REFERRALRAIL_PRIVATE_KEY;
  const writeEnabled = process.env.REFERRALRAIL_WRITE_ENABLED === "true";
  if (writeEnabled && !key) throw new Error("REFERRALRAIL_WRITE_ENABLED=true requires REFERRALRAIL_PRIVATE_KEY.");
  const account = key ? createAccount(key as `0x${string}`) : undefined;
  return { client: new ReferralRailClient(account ? { account } : {}), account, writeEnabled };
}

export function requireWrite(writeEnabled: boolean, account?: Account): void {
  if (!writeEnabled) throw new Error("Writes are disabled. Set REFERRALRAIL_WRITE_ENABLED=true explicitly.");
  if (!account) throw new Error("No signing account is configured.");
}
