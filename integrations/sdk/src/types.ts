import type { Account, Address } from "viem";

export type OpportunityState = "OPEN" | "REFERRED" | "ACCEPTED" | "JUDGING" | "INCONCLUSIVE" | "PAID" | "REFUNDED" | "EXPIRED" | "CANCELLED";
export type Outcome = "NONE" | "COMPLETED" | "NOT_COMPLETED" | "INCONCLUSIVE";
export type Opportunity = {
  id: number; employer: Address; candidate: Address; title: string; brief: string; acceptance_criteria: string;
  repo_owner: string; repo_name: string; candidate_payment: bigint; referral_reward: bigint; funded_amount: bigint;
  created_at: number; referral_deadline: number; completion_deadline: number; state: OpportunityState; state_code: number;
  referrer: Address; candidate_github: string; referred_at: number; accepted_at: number; active_attempt: number;
  attempt_count: number; active_pr_number: number; evidence_submitted_at: number; judgment_timeout_at: number;
  retry_deadline: number; last_outcome: Outcome; last_outcome_code: number; last_evidence_digest: string;
  last_reason: string; last_audit: string; closed_at: number; settlement_released: boolean;
};
export type Accounting = { total_funded: bigint; total_paid: bigint; total_refunded: bigint; locked_total: bigint; conservation_delta: bigint };
export type ProtocolConfig = { owner: Address; judge_address: Address; max_attempts: number; inconclusive_cure_seconds: number; judgment_timeout_seconds: number; evidence_host: string };
export type JudgeConfig = { settlement_address: Address; evidence_host: string; max_files: number; max_patch_per_file: number; max_evidence_chars: number; validation: string };
export type Judgment = { opportunity_id: number; attempt_id: number; outcome: Outcome; outcome_code: number; evidence_digest: string; reason: string; audit: string; decided_at: number };
export type ActorContext = { address?: Address; now?: number };
export type AvailableActions = { action: string; allowed: boolean; reason: string; movesFunds: boolean }[];
export type CreateOpportunityInput = { title: string; brief: string; acceptanceCriteria: string; repoOwner: string; repoName: string; candidateAddress: Address; candidatePayment: bigint; referralReward: bigint; referralWindowSeconds: number; completionWindowSeconds: number; };
export type WriteResult = { txHash: `0x${string}`; successful: boolean; finalized: boolean; stateBefore?: Opportunity; stateAfter?: Opportunity; opportunity?: Opportunity; settlementReleased?: boolean; explorerUrl: string; transaction: unknown };
export type ReferralRailConfig = { rpcUrl?: string; chainId?: number; chainName?: string; referralRailAddress?: Address; outcomeJudgeAddress?: Address; account?: Account | Address };
