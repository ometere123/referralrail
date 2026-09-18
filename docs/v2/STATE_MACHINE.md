# ReferralRail v2 state machine

Campaign: ACTIVE -> RESOLVING -> REFUNDED, or CANCELLED.

Position: RESERVED -> ACCEPTED -> JUDGING -> COMPLETED -> PAID.

A judgment can instead produce NOT_COMPLETED and terminal FAILED, or INCONCLUSIVE. INCONCLUSIVE can retry on the same position within the retry window and attempt bound, or become FAILED through recovery. Reserved and accepted timeouts can expire. Only finalized readback supports settlement claims.
