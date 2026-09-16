import type { Address } from "viem";

export const CANONICAL = {
  chainId: 61997,
  chainName: "GenLayer Studio Next",
  rpcUrl: "https://studio-dev.genlayer.com/api",
  explorerUrl: "https://explorer-studio-dev.genlayer.com",
  referralRail: "0x935A6fD995b4db5d64E1139D57a37a3f73BE2Ef8" as Address,
  outcomeJudge: "0x7842393CeEAB5F053B3024673B5986fDdb95A4C9" as Address,
} as const;

export const NETWORK = { id: CANONICAL.chainId, name: CANONICAL.chainName, nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, rpcUrls: { default: { http: [CANONICAL.rpcUrl] } } } as const;

export function explorerTx(hash: string): string { return `${CANONICAL.explorerUrl}/tx/${hash}`; }
export function explorerAddress(address: string): string { return `${CANONICAL.explorerUrl}/address/${address}`; }
