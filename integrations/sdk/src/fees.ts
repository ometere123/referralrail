import { createClient, deriveExternalMessageCallKey, encodeExternalMessageFeeParams, MESSAGE_ALLOCATION_ROOT_PARENT_INDEX, MessageType } from "genlayer-js";
import type { MessageFeeAllocationInput, TransactionFeeEstimate, TransactionFeeOptions } from "genlayer-js/types";
import type { Account, Address } from "viem";
import { ValidationError } from "./errors.js";
import type { Opportunity } from "./types.js";

export type FeeMethod = "ordinary" | "message" | "external";
export function fundingFor(candidatePayment: bigint, referralReward: bigint): bigint { if (candidatePayment <= 0n || referralReward <= 0n) throw new ValidationError("Candidate payment and referral reward must both be positive."); return candidatePayment + referralReward; }
export function feeMethod(method: string): FeeMethod { return method === "submit_work" || method === "retry_inconclusive" ? "message" : method === "settle_opportunity" || method === "settle_position" || method === "finalise_campaign" ? "external" : "ordinary"; }
export function externalAllocations(recipients: Address[], budget = 120_000_000_000_000n): MessageFeeAllocationInput[] {
  return recipients.map(recipient => ({ messageType: MessageType.External, onAcceptance: false, parentIndex: MESSAGE_ALLOCATION_ROOT_PARENT_INDEX, recipient, callKey: deriveExternalMessageCallKey(), budget, feeParams: encodeExternalMessageFeeParams({ gasLimit: 500_000, maxGasPrice: 300_000_000 }) }));
}
export function settlementRecipients(o: Pick<Opportunity, "state" | "settlement_released" | "candidate" | "referrer" | "employer">): Address[] {
  if (o.settlement_released) throw new ValidationError("Settlement has already been released; no fee allocations are required.");
  if (o.state === "PAID") return [o.candidate, o.referrer];
  if (o.state === "REFUNDED") return [o.employer];
  throw new ValidationError("Settlement fee quote requires a PAID or REFUNDED opportunity.");
}
export async function quoteFees(client: ReturnType<typeof createClient>, method: string, args: unknown[], account: Account, address: Address, value: bigint, recipients: Address[] = []): Promise<TransactionFeeOptions> {
  if (feeMethod(method) === "external") {
    if (recipients.length === 0) throw new ValidationError("Settlement requires recipients from the finalized opportunity state.");
    const allocations = externalAllocations(recipients), estimate: TransactionFeeEstimate = await client.estimateTransactionFees({ leaderTimeunitsAllocation: 100, validatorTimeunitsAllocation: 200, rotations: [3], totalMessageFees: allocations.reduce((n, a) => n + BigInt(a.budget ?? 0), 0n), messageAllocations: allocations });
    return { distribution: estimate.distribution, feeValue: estimate.feeValue, messageAllocations: allocations };
  }
  const estimate: TransactionFeeEstimate = await client.estimateTransactionFeesForWrite({ address, functionName: method, account, args: args as never[], value, executionHeadroomBps: 12000, messageHeadroomBps: 12000 });
  return { distribution: estimate.distribution, feeValue: estimate.feeValue, ...(estimate.messageAllocations ? { messageAllocations: estimate.messageAllocations } : {}) };
}
