import type { Address } from "viem";

export const CANONICAL = {
  chainId: 61997,
  chainName: "GenLayer Studio Next",
  rpcUrl: "https://studio-dev.genlayer.com/api",
  explorerUrl: "https://explorer-studio-dev.genlayer.com",
  referralRail: "0x1BB0B68da8cD29C77aa2B5F4C312E806BfCDCEA5" as Address,
  outcomeJudge: "0xd0C840fdD6654f501060b048F163BAD526A80724" as Address,
} as const;

export const NETWORK = { id: CANONICAL.chainId, name: CANONICAL.chainName, nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, rpcUrls: { default: { http: [CANONICAL.rpcUrl] } } } as const;

export function explorerTx(hash: string): string { return `${CANONICAL.explorerUrl}/tx/${hash}`; }
export function explorerAddress(address: string): string { return `${CANONICAL.explorerUrl}/address/${address}`; }
