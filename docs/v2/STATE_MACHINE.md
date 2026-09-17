# ReferralRail v2 state machine

Campaign states are `ACTIVE`, `RESOLVING`, `REFUNDED`, and `CANCELLED`.

Position states are `RESERVED`, `ACCEPTED`, `JUDGING`, `INCONCLUSIVE`, `COMPLETED`, `PAID`, `FAILED`, `EXPIRED`, and `DECLINED`.

`RESERVED`, `ACCEPTED`, `JUDGING`, `INCONCLUSIVE`, and `COMPLETED` occupy active capacity. `PAID` is successful terminal state and no longer occupies active capacity. `FAILED`, `EXPIRED`, and `DECLINED` release capacity and do not create another successful target.

`resolve_judgment` moves a finalized `COMPLETED` result to `COMPLETED`, a failed result to `FAILED`, and an inconclusive result to `INCONCLUSIVE`. `settle_position` moves `COMPLETED` to `PAID` only after both payout legs are released.
