import { createClient } from "genlayer-js";
import type { TransactionFeeEstimate, TransactionFeeOptions } from "genlayer-js/types";
import type { Account, Address } from "viem";
import { ValidationError } from "./errors.js";
import type { Opportunity } from "./types.js";

export type FeeMethod = "ordinary" | "message";
export function fundingFor(candidatePayment: bigint, referralReward: bigint): bigint { if (candidatePayment <= 0n || referralReward <= 0n) throw new ValidationError("Candidate payment and referral reward must both be positive."); return candidatePayment + referralReward; }
export function feeMethod(method: string): FeeMethod { return ["submit_work", "retry_inconclusive", "settle_opportunity", "cancel_unreferred", "expire", "recover"].includes(method) ? "message" : "ordinary"; }
export function settlementRecipients(o: Pick<Opportunity, "state" | "settlement_released" | "candidate" | "referrer" | "employer">): Address[] {
  if (o.settlement_released) throw new ValidationError("Settlement has already been released; no fee allocations are required.");
  if (o.state === "PAID") return [o.candidate, o.referrer];
  if (o.state === "REFUNDED") return [o.employer];
  throw new ValidationError("Settlement fee quote requires a PAID or REFUNDED opportunity.");
}
export async function quoteFees(client: ReturnType<typeof createClient>, method: string, args: unknown[], account: Account, address: Address, value: bigint, _recipients: Address[] = []): Promise<TransactionFeeOptions> {
  if (feeMethod(method) === "message") {
    const estimate: TransactionFeeEstimate = await client.estimateTransactionFeesForWrite({ address, functionName: method, account, args: args as never[], value, executionHeadroomBps: 12000, messageHeadroomBps: 12000 });
    if (!estimate.messageAllocations?.length) throw new ValidationError(`${method} fee estimation returned no message allocation.`);
    return { distribution: estimate.distribution, feeValue: estimate.feeValue, messageAllocations: estimate.messageAllocations };
  }
  const estimate: TransactionFeeEstimate = await client.estimateTransactionFeesForWrite({ address, functionName: method, account, args: args as never[], value, executionHeadroomBps: 12000, messageHeadroomBps: 12000 });
  return { distribution: estimate.distribution, feeValue: estimate.feeValue, ...(estimate.messageAllocations ? { messageAllocations: estimate.messageAllocations } : {}) };
}
