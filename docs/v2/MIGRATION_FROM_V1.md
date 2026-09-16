# Migrating from ReferralRail v1 to v2

ReferralRail v1 manages one funded opportunity with one nominated candidate, one referrer, and one escrow outcome.

ReferralRail v2 introduces a fully funded campaign with multiple referral positions, a successful-position target, reusable capacity after terminal failure, per-position GenLayer judging, and campaign-level accounting with a final unused escrow refund.

V1 opportunities remain controlled by the v1 contracts and are not migrated automatically. V2 uses fresh contract addresses and fresh campaign state. Existing v1 escrow is never moved by this repository.

Clients should select the v2 deployment explicitly, use finalized state for consequential actions, and read campaign and position accounting after every write.
