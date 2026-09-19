# ReferralRail v2 partial-success conservation proof

This document is evidence for a two-position ReferralRail v2 campaign.

The campaign is fully funded for two positions. One candidate submission is judged COMPLETED and is settled. The candidate receives the candidate reward and the referrer receives the referral reward. That paid position is terminal PAID and no longer locks campaign capacity.

The second candidate submission is judged NOT_COMPLETED. Its position becomes FAILED and its unused escrow unit is released back to campaign capacity. The employer must not be able to call `cancel_campaign` after the successful position has been paid, because `successful` and `paid_total` are nonzero.

After intake closes, `finalise_campaign` refunds exactly one unused unit to the employer. The final accounting invariant is:

`initial_funding = paid_total + refunded_total + locked_total`

For this proof, `paid_total` equals one candidate reward plus one referral reward, `refunded_total` equals one unused candidate reward plus one unused referral reward, and `locked_total` equals zero.