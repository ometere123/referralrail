# ReferralRail v2 security model

The protocol enforces exact funding, role separation, authenticated campaign-specific referral attribution, immutable referral attribution after reservation, one accepted wallet participation per campaign, identity replay protection, bounded attempts, stale callback checks, double-settlement guards, capacity bounds, strict URL parsing, exact host policy, bounded source size, source outage safety, prompt-injection resistance, and finalized settlement readback.

`candidate_paid`, `referrer_paid`, and `settlement_released` mean that the contract recorded and emitted the corresponding payout legs in a finalized transaction. Studio Dev does not currently expose an authenticated recipient-delivery callback that this contract can safely consume. The protocol therefore does not claim independent recipient delivery, does not retry an ambiguous transfer automatically, and does not permit a second payout attempt after release.

PUBLIC_WEB host restrictions are exact against the submitted URL host. Redirect final-origin verification is not claimed because the current GenLayer web API does not expose the final redirect chain. Unrestricted PUBLIC_WEB is the universal path for public platforms and future sites.
