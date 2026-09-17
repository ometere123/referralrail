"use client";

import { readFinal } from "./client";

export function identityAddress(): string {
  return process.env.NEXT_PUBLIC_REFERRAL_IDENTITY_V2_ADDRESS || "";
}

export async function readIdentity(wallet: string, platform: "GITHUB" | "X") {
  if (!identityAddress()) throw new Error("The v2 identity contract is not configured.");
  return (await readFinal(identityAddress(), "get_identity", [wallet, platform])) as any;
}


