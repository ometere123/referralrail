# Protocol

The two-contract architecture is `ReferralRail` for attribution, escrow accounting, lifecycle state, and terminal release, plus `OutcomeJudge` for independent GitHub evidence evaluation. Canonical addresses are `0x935A6fD995b4db5d64E1139D57a37a3f73BE2Ef8` and `0x7842393CeEAB5F053B3024673B5986fDdb95A4C9`.

Funding is candidate payment plus referral reward. The employer, referrer, and candidate are distinct roles. Only the nominated candidate accepts and submits. GenLayer is used because the judge needs consensus over external evidence and a consequential result must be finalized before it is pulled into settlement state.
