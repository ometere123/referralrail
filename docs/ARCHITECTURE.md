# Architecture

## Thesis

ReferralRail makes **accepted referral attribution** part of the funded work agreement before the outcome exists. The referrer does not earn because an employer later remembers a spreadsheet entry; the referrer earns because the candidate explicitly accepted a locked referral and GenLayer later verified the contracted outcome.

## System boundary

```text
Employer / Referrer / Candidate wallets
                │
                ▼
         Next.js frontend
                │
     Transaction Kit RC2
                │
                ▼
┌──────────────────────────────┐
│ ReferralRail                 │
│ funding + attribution +      │
│ acceptance + state machine   │
└──────────────┬───────────────┘
               │ finalized message
               ▼
┌──────────────────────────────┐
│ OutcomeJudge                 │
│ GitHub evidence + consensus  │
│ substantive verification     │
└──────────────┬───────────────┘
               │ HTTPS read only
               ▼
      GitHub public API
               │
               └──── finalized callback ───► ReferralRail
                                              │
                                              ├─ candidate payment
                                              └─ referral reward / employer refund
```

There is no application database, persistent server, adjudication API, worker queue or off-chain decision maker.

## Why two contracts

The separation is functional rather than cosmetic.

`ReferralRail` is an economic state machine. Its responsibilities are deterministic: preserve terms, enforce actor permissions, lock attribution, maintain the funding invariant, authenticate the judge, reject stale/replayed results and move the predetermined value.

`OutcomeJudge` is an evidence/consensus component. It owns the non-deterministic web/LLM path, bounds evidence, stores judgment audit material and independently validates the substantive completion decision.

Keeping the judge outside the value/state contract gives a narrow authorization boundary: a judgment can only affect value through an authenticated callback that identifies one active attempt. Conversely, the judge cannot create or rewrite referral economics.

## Frozen opportunity data

At creation the employer fixes:

- title;
- work brief;
- acceptance criteria;
- GitHub repository owner/name;
- candidate wallet;
- candidate payment;
- referral reward;
- referral and completion windows.

Funding must equal the two economic obligations exactly. The opportunity cannot be edited later.

## Referral identity model

The employer chooses the candidate wallet when funding. A third party can then create the referral only for that exact candidate. The referrer cannot be the employer or the candidate. Only one referrer can bind an opportunity.

Only the candidate can accept the referral. Acceptance locks a GitHub login used later by OutcomeJudge to verify PR authorship. The referrer is therefore both third-party asserted and candidate acknowledged before evidence submission.

## Work evidence model

The frontend does not submit arbitrary URLs. Candidate work submission is a positive PR number only. OutcomeJudge constructs the only allowed source paths from the opportunity's frozen repository:

- pull request metadata;
- changed files for that pull request.

This design removes an unnecessary source-choice attack surface and makes the verifier's trust boundary reviewable.

## Consensus path

OutcomeJudge performs one complete `evaluate_once` on the leader and one complete independent `evaluate_once` inside the validator. Each execution:

1. fetches PR metadata and changed files from the public GitHub API;
2. verifies repository, PR author, merged status and merge deadline deterministically;
3. rejects unsupported evidence breadth into `INCONCLUSIVE`;
4. canonicalizes the inspectable patch into bounded evidence;
5. asks the LLM the closed question defined by frozen brief + criteria;
6. maps output to `COMPLETED`, `NOT_COMPLETED`, or `INCONCLUSIVE`;
7. derives stable objective/evidence fields.

The validator compares objective key, evidence digest and final outcome. It does not approve a label because it has the right enum/JSON shape.

## Message/finality model

Candidate submission moves the settlement opportunity to `JUDGING` and emits `OutcomeJudge.evaluate(...)` only when the settlement transaction finalizes. The judge stores a result and emits `ReferralRail.record_outcome(...)` only after the judgment finalizes.

This reduces duplicate/irreversible child effects during appeals. The settlement callback still performs its own sender/state/attempt checks so stale or replayed children are harmless.

## Value model

For an opportunity with candidate payment `C` and referral reward `R`:

`funded_amount = C + R`

Protocol accounting maintains:

`total_funded = total_paid + total_refunded + locked_total`

No fee is retained by ReferralRail. `COMPLETED` releases exactly `C` to the candidate and `R` to the referrer. Failure/recovery releases the full original funded amount to the employer.

## Liveness

ReferralRail has no endless state:

- no referral by deadline → expire/refund;
- accepted but no work by completion deadline → expire/refund;
- judge callback missing beyond timeout → recover/refund;
- inconclusive → candidate may retry once within cure window;
- attempts exhausted or cure window expires → recover/refund;
- completed → paid;
- not completed → refunded;
- unreferred employer cancellation → cancelled/refunded.

See `STATE_MACHINE.md` for exact transitions.
