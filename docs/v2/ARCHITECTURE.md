# ReferralRail v2 architecture

ReferralRailV2 owns campaign terms, funded capacity, referral attribution, position state, accounting, and deterministic payout. OutcomeJudgeV2 owns bounded nondeterministic GitHub evidence evaluation.

The rail emits a finalized child call to the judge. The rail later pulls the finalized judgment by campaign, position, and attempt. No frontend, SDK, MCP server, or GitHub client can substitute for that record.

The frontend uses Transaction Kit for writes and finalized readback. The SDK and MCP expose named methods only. Private keys remain process configuration.
