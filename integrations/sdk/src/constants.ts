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

export const V2_CANONICAL = { ...CANONICAL, referralRail: "0x520a0fA5A4c86bFbD50802E969D5aEA11352D63D" as Address, outcomeJudge: "0x83D67E068e40966a5DC901Ba4CaCCecF0C501259" as Address, identity: "0x1210cEe2E5B151826Db0ee458b51af1413D43AC3" as Address } as const;
