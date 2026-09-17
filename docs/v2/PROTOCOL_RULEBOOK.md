# ReferralRail v2 protocol rulebook

Campaigns are fully funded at creation. The required escrow is `max_positions * (candidate_reward + referral_reward)`. Campaign terms, repository, base branch, evidence criteria, timing, and rewards are immutable.

Referrers reserve positions for nominated candidates. Candidates must accept personally and bind a GitHub login before submitting one pull request per attempt. OutcomeJudge evaluates only the frozen repository and bounded public GitHub evidence.

Only a finalized judge record can be materialized. A completed result pays the candidate and referrer through separate transfers. A failed or expired position releases its slot. Unused backing is refundable only after intake is closed and all payable positions are resolved.
