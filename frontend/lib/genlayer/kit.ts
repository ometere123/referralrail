"use client";

import { useMemo, useRef } from "react";
import { createTransactionKit, type PolicyInput, type PolicyQuote, type SubmitInput, type TransactionKit } from "@genlayer/transaction-kit";
import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN } from "./network";
import { provider } from "./client";

type SubmittedCallback = (hash: `0x${string}`) => void;
type DynamicQuote = PolicyQuote & { __messageAllocations?: unknown[] };

const asBigInt = (value: unknown): bigint => BigInt(String(value ?? 0));

function dynamicQuote(estimate: any, userValue: bigint): DynamicQuote {
  const distribution = estimate.distribution;
  const messageFees = asBigInt(distribution.totalMessageFees);
  const executionBudget = asBigInt(distribution.executionBudgetPerRound);
  const feeValue = asBigInt(estimate.feeValue);
  return {
    distribution,
    feeValue,
    userValue,
    total: feeValue + userValue,
    source: "network-default",
    verification: { status: "unavailable" },
    breakdown: {
      timeUnitFees: feeValue > messageFees + executionBudget ? feeValue - messageFees - executionBudget : 0n,
      executionBudget,
      messageFees,
    },
    caps: {
      genPerTimeUnit: asBigInt(distribution.maxPriceGenPerTimeUnit),
      storagePrice: asBigInt(distribution.storageFeeMaxGasPrice),
      receiptPrice: asBigInt(distribution.receiptFeeMaxGasPrice),
    },
    refundable: true,
    __messageAllocations: Array.isArray(estimate.messageAllocations) ? estimate.messageAllocations : [],
  };
}

export function useTransactionKit(address: string | null, onSubmitted?: SubmittedCallback): TransactionKit | null {
  const submitted = useRef(onSubmitted);
  submitted.current = onSubmitted;
  return useMemo(() => {
    const injected = provider();
    if (!injected || !address) return null;
    const fallback = createTransactionKit({
      chain: GENLAYER_CHAIN,
      provider: injected,
      account: address as `0x${string}`,
      allowUnverified: true,
    });
    const client = createClient({
      chain: GENLAYER_CHAIN,
      provider: injected,
      account: address as `0x${string}`,
    } as never);
    const estimate = async (input: PolicyInput, tx?: SubmitInput): Promise<PolicyQuote> => {
      if (!tx || tx.kind !== "write") return fallback.estimate(input, tx);
      const userValue = input.userValue ?? 0n;
      const quote = await client.estimateTransactionFeesForWrite({
        account: address as never,
        address: tx.address,
        functionName: tx.method,
        args: tx.args ?? [],
        value: userValue,
        executionHeadroomBps: 12000,
        messageHeadroomBps: 12000,
      } as never);
      return dynamicQuote(quote, userValue);
    };
    const submit = async (quote: PolicyQuote, tx: SubmitInput) => {
      if (tx.kind !== "write") return fallback.submit(quote, tx);
      const dynamic = quote as DynamicQuote;
      const fees = {
        distribution: quote.distribution,
        feeValue: quote.feeValue,
        ...(dynamic.__messageAllocations?.length ? { messageAllocations: dynamic.__messageAllocations } : {}),
      };
      const hash = await client.writeContract({
        account: address as never,
        address: tx.address,
        functionName: tx.method,
        args: tx.args ?? [],
        value: quote.userValue,
        fees,
      } as never);
      submitted.current?.(hash as `0x${string}`);
      return { genlayerTxId: hash as `0x${string}` };
    };
    return { ...fallback, estimate, submit } as TransactionKit;
  }, [address]);
}