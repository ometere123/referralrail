"use client";

import { createClient } from "genlayer-js";
import { TransactionHashVariant } from "genlayer-js/types";
import { GENLAYER_CHAIN, WALLET_NETWORK } from "./network";

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window { ethereum?: Eip1193Provider; }
}

export function provider(): Eip1193Provider | null {
  return typeof window === "undefined" ? null : window.ethereum ?? null;
}

export function createReferralRailClient(account?: string | null) {
  return createClient({
    chain: GENLAYER_CHAIN,
    ...(account ? { account: account as `0x${string}` } : {}),
  } as never);
}

export async function readFinal(address: string, functionName: string, args: unknown[] = []) {
  const client = createReferralRailClient();
  return client.readContract({
    address: address as `0x${string}`,
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  } as never);
}

export async function ensureStudioNext(): Promise<void> {
  const p = provider();
  if (!p) throw new Error("No EIP-1193 wallet detected");
  const current = String(await p.request({ method: "eth_chainId" }));
  if (parseInt(current, 16) === GENLAYER_CHAIN.id) return;
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: WALLET_NETWORK.chainId }] });
  } catch (error: any) {
    const message = String(error?.message || "").toLowerCase();
    const unknownChain = error?.code === 4902 || error?.code === -32603 || message.includes("unrecognized chain") || message.includes("unknown chain");
    if (!unknownChain) throw error;
    await p.request({ method: "wallet_addEthereumChain", params: [WALLET_NETWORK] });
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: WALLET_NETWORK.chainId }] });
  }
}

export function settlementAddress(): string {
  return process.env.NEXT_PUBLIC_REFERRAL_RAIL_ADDRESS || "";
}
export function judgeAddress(): string {
  return process.env.NEXT_PUBLIC_OUTCOME_JUDGE_ADDRESS || "";
}
