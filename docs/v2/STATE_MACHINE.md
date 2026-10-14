# ReferralRail v2 state machine

Campaign: ACTIVE -> RESOLVING -> REFUNDED, COMPLETED, or CANCELLED. A fully successful campaign becomes COMPLETED after every successful position is paid. An untouched active campaign can be CANCELLED by the employer. After the participation deadline, any caller may close intake so the campaign cannot remain active solely because the employer is absent.

Position: RESERVED -> ACCEPTED -> JUDGING -> COMPLETED -> PAID.

A judgment can instead produce NOT_COMPLETED and terminal FAILED, or INCONCLUSIVE. INCONCLUSIVE can retry on the same position within the retry window and attempt bound, or become FAILED through recovery. Reserved and accepted timeouts can expire. Only finalized readback supports settlement claims.
