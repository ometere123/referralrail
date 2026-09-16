import type { AvailableActions, ActorContext, Opportunity } from "./types.js";

const ZERO = "0x0000000000000000000000000000000000000000";
const role = (o: Opportunity, address?: string) => address?.toLowerCase() === o.employer.toLowerCase() ? "employer" : address?.toLowerCase() === o.candidate.toLowerCase() ? "candidate" : address?.toLowerCase() === o.referrer.toLowerCase() ? "referrer" : "other";

export function getAvailableActions(o: Opportunity, context: ActorContext = {}): AvailableActions {
  const actor = role(o, context.address), now = context.now ?? Math.floor(Date.now() / 1000), expiredReferral = now > o.referral_deadline, expiredCompletion = now > o.completion_deadline;
  const allowed = (action: string, yes: boolean, reason: string, movesFunds = false) => ({ action, allowed: yes, reason, movesFunds });
  return [
    allowed("create_referral", o.state === "OPEN" && !expiredReferral && actor !== "employer" && actor !== "candidate", o.state !== "OPEN" ? "Opportunity is not open." : expiredReferral ? "Referral window has expired." : actor === "employer" || actor === "candidate" ? "Employer and candidate cannot self-refer." : "Referrer wallet is eligible."),
    allowed("accept_referral", o.state === "REFERRED" && actor === "candidate" && !expiredReferral, actor !== "candidate" ? "Only the nominated candidate can accept." : o.state !== "REFERRED" ? "Opportunity is not awaiting acceptance." : expiredReferral ? "Referral window has expired." : "Candidate can accept."),
    allowed("submit_work", o.state === "ACCEPTED" && actor === "candidate" && !expiredCompletion, actor !== "candidate" ? "Only the accepted candidate can submit." : o.state !== "ACCEPTED" ? "Opportunity is not accepted." : expiredCompletion ? "Completion deadline has passed." : "Candidate can submit evidence."),
    allowed("retry_inconclusive", o.state === "INCONCLUSIVE" && actor === "candidate" && o.attempt_count < 2 && now <= o.retry_deadline, actor !== "candidate" ? "Only the candidate can retry." : o.state !== "INCONCLUSIVE" ? "Opportunity is not inconclusive." : o.attempt_count >= 2 || now > o.retry_deadline ? "Retry window or attempt limit is exhausted." : "Candidate can retry."),
    allowed("resolve_judgment", o.state === "JUDGING", o.state === "JUDGING" ? "A finalized judge record may be pulled." : "Opportunity is not awaiting judgment."),
    allowed("settle_opportunity", (o.state === "PAID" || o.state === "REFUNDED") && !o.settlement_released, o.settlement_released ? "Settlement is already released." : o.state === "PAID" || o.state === "REFUNDED" ? "Terminal outcome is awaiting fund release." : "Outcome is not terminal.", true),
    allowed("cancel_unreferred", o.state === "OPEN" && actor === "employer", actor === "employer" && o.state === "OPEN" ? "Employer can cancel." : "Only the employer can cancel an open opportunity.", true),
    allowed("expire", (o.state === "OPEN" || o.state === "REFERRED") && expiredReferral || o.state === "ACCEPTED" && expiredCompletion, "Timeout is not yet eligible or state is not expirable.", true),
    allowed("recover", o.state === "JUDGING" || o.state === "INCONCLUSIVE", "Recovery is available only for stalled judgment or exhausted inconclusive state.", true),
  ];
}
