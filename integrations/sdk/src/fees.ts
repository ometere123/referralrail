import { deriveExternalMessageCallKey, encodeExternalMessageFeeParams, MESSAGE_ALLOCATION_ROOT_PARENT_INDEX, MessageType } from "genlayer-js";
import type { MessageFeeAllocationInput, TransactionFeeEstimate, TransactionFeeOptions } from "genlayer-js/types";
import type { Address } from "viem";
import { ValidationError } from "./errors.js";

export type FeeMethod = "ordinary" | "message" | "external";
export function fundingFor(candidatePayment: bigint, referralReward: bigint): bigint { if (candidatePayment <= 0n || referralReward <= 0n) throw new ValidationError("Candidate payment and referral reward must both be positive."); return candidatePayment + referralReward; }
export function feeMethod(method: string): FeeMethod { return method === "submit_work" || method === "retry_inconclusive" ? "message" : method === "settle_opportunity" ? "external" : "ordinary"; }
export function externalAllocations(recipients: Address[], budget = 120_000_000_000_000n): MessageFeeAllocationInput[] {
  return recipients.map(recipient => ({ messageType: MessageType.External, onAcceptance: false, parentIndex: MESSAGE_ALLOCATION_ROOT_PARENT_INDEX, recipient, callKey: deriveExternalMessageCallKey(), budget, feeParams: encodeExternalMessageFeeParams({ gasLimit: 500_000, maxGasPrice: 300_000_000 }) }));
}
export async function quoteFees(client: any, method: string, args: unknown[], account: any, address: Address, value: bigint, recipients: Address[] = []): Promise<TransactionFeeOptions> {
  if (feeMethod(method) === "external") {
    const allocations = externalAllocations(recipients), estimate: TransactionFeeEstimate = await client.estimateTransactionFees({ distribution: { leaderTimeunitsAllocation: 100, validatorTimeunitsAllocation: 200, rotations: [3], totalMessageFees: allocations.reduce((n, a) => n + BigInt(a.budget ?? 0), 0n) }, messageAllocations: allocations });
    return { distribution: estimate.distribution, feeValue: estimate.feeValue, messageAllocations: allocations };
  }
  const estimate: TransactionFeeEstimate = await client.estimateTransactionFeesForWrite({ address, functionName: method, account, args: args as never[], value, executionHeadroomBps: 12000, messageHeadroomBps: 12000 });
  return { distribution: estimate.distribution, feeValue: estimate.feeValue, ...(estimate.messageAllocations ? { messageAllocations: estimate.messageAllocations } : {}) };
}
