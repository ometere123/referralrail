# Current v1 protocol

ReferralRail v1 models one funded opportunity with one nominated candidate. It is not a campaign, multi-candidate pool, or multi-slot marketplace.

The employer creates the opportunity and pays exactly `candidate_payment + referral_reward`. A third-party referrer locks attribution for the already nominated candidate. The candidate accepts that referral, binds a GitHub login, and submits a positive pull request number. The employer cannot self-refer and the candidate cannot self-refer.

The two-contract architecture is `ReferralRail` for attribution, escrow accounting, lifecycle state, and terminal release, plus `OutcomeJudge` for source-restricted GitHub evidence evaluation. The judge can be called only by ReferralRail and the result is authoritative only after GenLayer finalization. The judge evaluates public evidence from `api.github.com`; the agent must not fetch GitHub and replace that judgment.

Canonical deployment is Studio Next / Studionet Dev, chain `61997`, RPC `https://studio-dev.genlayer.com/api`. ReferralRail is `0x935A6fD995b4db5d64E1139D57a37a3f73BE2Ef8` and OutcomeJudge is `0x7842393CeEAB5F053B3024673B5986fDdb95A4C9`.
