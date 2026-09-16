import type { AvailableActions, ActorContext, CreateOpportunityInput, Opportunity } from "./types.js";

const ZERO = "0x0000000000000000000000000000000000000000";
const role = (o: Opportunity, address?: string) => address?.toLowerCase() === o.employer.toLowerCase() ? "employer" : address?.toLowerCase() === o.candidate.toLowerCase() ? "candidate" : address?.toLowerCase() !== ZERO && address?.toLowerCase() === o.referrer.toLowerCase() ? "referrer" : "other";

export function getAvailableActions(o: Opportunity, context: ActorContext = {}): AvailableActions {
  const actor = role(o, context.address), now = context.now ?? Math.floor(Date.now() / 1000);
  const expiredReferral = now > o.referral_deadline, expiredCompletion = now > o.completion_deadline;
  const recoveryAfterJudgmentTimeout = o.state === "JUDGING" && now > o.judgment_timeout_at;
  const recoveryAfterInconclusive = o.state === "INCONCLUSIVE" && (o.attempt_count >= 2 || now > o.retry_deadline);
  const allowed = (action: string, yes: boolean, reason: string, movesFunds = false) => ({ action, allowed: yes, reason, movesFunds });
  const known = context.address ? actor : "other";
  return [
    allowed("create_referral", o.state === "OPEN" && !expiredReferral && known !== "other" && actor !== "employer" && actor !== "candidate", o.state !== "OPEN" ? "Opportunity is not open." : expiredReferral ? "Referral window has expired." : !context.address ? "A connected wallet address is required." : actor === "employer" || actor === "candidate" ? "Employer and candidate cannot self-refer." : "Referrer wallet is eligible."),
    allowed("accept_referral", o.state === "REFERRED" && !expiredReferral && known === "candidate", o.state !== "REFERRED" ? "Opportunity is not awaiting acceptance." : expiredReferral ? "Referral window has expired." : !context.address ? "A connected wallet address is required." : actor !== "candidate" ? "Only the nominated candidate can accept." : "Candidate can accept."),
    allowed("submit_work", o.state === "ACCEPTED" && !expiredCompletion && known === "candidate", o.state !== "ACCEPTED" ? "Opportunity is not accepted." : expiredCompletion ? "Completion deadline has passed." : !context.address ? "A connected wallet address is required." : actor !== "candidate" ? "Only the accepted candidate can submit." : "Candidate can submit evidence."),
    allowed("retry_inconclusive", o.state === "INCONCLUSIVE" && known === "candidate" && o.attempt_count < 2 && now <= o.retry_deadline, o.state !== "INCONCLUSIVE" ? "Opportunity is not inconclusive." : !context.address ? "A connected wallet address is required." : actor !== "candidate" ? "Only the candidate can retry." : o.attempt_count >= 2 || now > o.retry_deadline ? "Retry window or attempt limit is exhausted." : "Candidate can retry."),
    allowed("resolve_judgment", o.state === "JUDGING", o.state === "JUDGING" ? "A finalized judge record may be pulled." : "Opportunity is not awaiting judgment."),
    allowed("settle_opportunity", (o.state === "PAID" || o.state === "REFUNDED") && !o.settlement_released, o.settlement_released ? "Settlement is already released." : o.state === "PAID" || o.state === "REFUNDED" ? "Terminal outcome is awaiting fund release." : "Outcome is not terminal.", true),
    allowed("cancel_unreferred", o.state === "OPEN" && known === "employer", o.state === "OPEN" && !context.address ? "A connected wallet address is required." : actor === "employer" && o.state === "OPEN" ? "Employer can cancel." : "Only the employer can cancel an open opportunity.", true),
    allowed("expire", (o.state === "OPEN" || o.state === "REFERRED") && expiredReferral || o.state === "ACCEPTED" && expiredCompletion, "Timeout is not yet eligible or state is not expirable.", true),
    allowed("recover", recoveryAfterJudgmentTimeout || recoveryAfterInconclusive, o.state === "JUDGING" ? (recoveryAfterJudgmentTimeout ? "Judgment timeout has passed." : "Judgment timeout has not passed.") : o.state === "INCONCLUSIVE" ? (recoveryAfterInconclusive ? "Recovery is eligible." : "Candidate still has a bounded cure window.") : "State has no recovery action.", true),
  ];
}

export function sameCreatedOpportunity(o: Opportunity, input: CreateOpportunityInput, employer: string): boolean {
  const clean = (value: string, max: number) => value.trim().replace(/\s+/g, " ").slice(0, max);
  return o.employer.toLowerCase() === employer.toLowerCase() && o.candidate.toLowerCase() === input.candidateAddress.toLowerCase() && o.title === clean(input.title, 120) && o.brief === clean(input.brief, 2600) && o.acceptance_criteria === clean(input.acceptanceCriteria, 2600) && o.repo_owner === input.repoOwner.trim() && o.repo_name === input.repoName.trim() && o.candidate_payment === input.candidatePayment && o.referral_reward === input.referralReward && o.funded_amount === input.candidatePayment + input.referralReward;
}

export function findCreatedOpportunity(before: Opportunity[], after: Opportunity[], input: CreateOpportunityInput, employer: string): Opportunity {
  const known = new Set(before.map(o => o.id));
  const matches = after.filter(o => !known.has(o.id) && sameCreatedOpportunity(o, input, employer));
  if (matches.length !== 1) throw new Error(matches.length === 0 ? "Finalized creation readback could not identify the new opportunity." : "Finalized creation readback is ambiguous because multiple matching opportunities appeared concurrently.");
  return matches[0];
}
