# Security model

## Assets

The primary protected asset is employer-funded GEN allocated to one candidate payment plus one referral reward. The secondary protected assets are referral attribution and the integrity of the completion decision.

## Trust assumptions

ReferralRail intentionally trusts only the following external facts for the MVP:

- the public GitHub API response for the frozen repository/PR;
- the candidate's self-declared GitHub login at explicit referral acceptance;
- GenLayer consensus and its validator execution environment.

ReferralRail does **not** prove legal identity behind a GitHub login, authorship of every individual line beyond GitHub's PR author metadata, private repository activity, employment status or off-chain employer promises outside the frozen brief.

## Threats and controls

| Threat | Control |
|---|---|
| Employer removes referrer after useful work | no post-referral method can rewrite attribution; employer cancellation ends once referral is bound |
| Referrer silently claims a candidate | candidate must explicitly accept from the registered candidate wallet |
| Self-referral | referrer cannot equal employer or candidate |
| Referral hijack / duplicates | first valid referral moves state out of `OPEN`; later referral writes revert |
| Candidate submits somebody else's PR | GitHub author login must equal login locked by the candidate at acceptance |
| Arbitrary/hostile evidence URL | candidate submits only PR number; judge constructs GitHub API URLs from frozen repo |
| Prompt injection in source code/docs | evidence is explicitly untrusted and cannot redefine verifier instructions |
| Rubber-stamp validator | validator independently refetches and reruns substantive evaluation |
| Source outage interpreted as failure | outage/malformed source → `INCONCLUSIVE` |
| Oversized PR causes unbounded judgment | strict file/patch/total evidence caps; unsupported scope → `INCONCLUSIVE` |
| Fake callback moves funds | settlement authenticates configured judge address |
| Stale/replayed callback | callback must match current `JUDGING` state and exact active attempt |
| Double settlement | terminal states are irreversible; callback state/attempt checks; lock released once |
| Wrong actor submits | only registered candidate may submit/retry |
| Employer underfunds | create call requires exact value = candidate payment + referral reward |
| Split arithmetic leaks funds | payout rechecks split equals funded amount |
| Funds stuck after source/child failure | judgment timeout + bounded inconclusive cure + permissionless recovery |
| Funds stuck when no referral/work | deterministic referral/completion expiry routes |
| Appeal duplicates child messages | cross-contract work uses finalized messages; receiver is additionally replay-safe |
| UI reports false success | transaction tracks to finalization, then finalized state readback must match expected state |

## Accounting invariant

At all times, the model is intended to satisfy:

`total_funded = total_paid + total_refunded + locked_total`

`total_paid` includes both candidate and referral payments. No protocol fee is retained.

## Known MVP limitations

GitHub public API can rate-limit or omit patches for large/binary diffs. Those conditions deliberately produce `INCONCLUSIVE`. The MVP supports one GitHub PR per attempt and one candidate per opportunity. It does not support private repositories, KYC, CV scoring, generalized reputation, multiple milestones, messaging, cross-chain value or token issuance.

The candidate's accepted GitHub login is a claim by the candidate wallet; the protocol does not cryptographically prove wallet↔GitHub account ownership. For the hackathon this is an explicit trust assumption rather than a hidden claim.
