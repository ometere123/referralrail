"use client";
import { useMemo } from "react";
import { createTransactionKit, type TransactionKit } from "@genlayer/transaction-kit";
import { GENLAYER_CHAIN } from "./network";
import { provider } from "./client";

export function useTransactionKit(address: string | null): TransactionKit | null {
  return useMemo(() => {
    const injected = provider();
    if (!injected || !address) return null;
    return createTransactionKit({
      chain: GENLAYER_CHAIN,
      provider: injected,
      account: address as `0x${string}`,
    } as never);
  }, [address]);
}
