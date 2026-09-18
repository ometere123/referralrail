---
name: referralrail
description: Use for ReferralRail opportunity, referral, evidence submission, judgment, inconclusive recovery, settlement, and MCP workflows. Activate when an agent needs to inspect or operate the ReferralRail protocol, its canonical GenLayer deployment, or its SDK/MCP tools.
---

# ReferralRail

ReferralRail is a funded referral protocol. The employer creates and funds an opportunity, a third-party referrer locks a nominated candidate, and the candidate accepts, binds a GitHub identity, and submits a PR number. The deployed OutcomeJudge evaluates bounded GitHub PR or public web evidence through GenLayer consensus. It is not an off-chain employment decision or an agent-controlled judge.

Canonical deployment: GenLayer Studio Next, chain `61997`, RPC `https://studio-dev.genlayer.com/api`. Use the SDK or MCP when available. Read current finalized state before every action. Never infer success from a transaction hash. A `PAID` or `REFUNDED` outcome is not proof that funds moved until `settlement_released` is true.

Always determine the connected wallet role, validate state and deadlines, preserve exact amounts and identities, and verify finalized execution plus post-write readback. Never leak credentials, call privileged methods, submit arbitrary methods, independently judge GitHub work, override `INCONCLUSIVE`, or bypass bounded retry and recovery.

Use the focused references for the state machine, tool mapping, protocol details, and safety rules.

## v2 campaign deployment

ReferralRail v2 is a separate multi-position campaign contract. Its canonical preview deployment is recorded in `deployment/v2-61997.json`; never replace the frozen v1 addresses or deployment evidence. Use `ReferralRailV2Client` or the v2 MCP tools for campaign, position, and payout operations.

The v2 lifecycle is `ACTIVE` campaign, funded `RESERVED` position, candidate `ACCEPTED`, `JUDGING`, then `COMPLETED` and `PAID`, or `INCONCLUSIVE`, `FAILED`, `EXPIRED`, or `DECLINED`. `resolve_judgment` materializes only a finalized OutcomeJudge record. A successful transaction hash is not enough: read the position and campaign after finalization, and require both `candidate_paid` and `referrer_paid` before describing a position as settled.

V2 evidence is profile-aware. GITHUB_PR freezes the repository, base branch, identity handle, acceptance timestamp, pull request identity, and ownership challenge. PUBLIC_WEB freezes the claimed X handle, public post URL, oEmbed author metadata, acceptance timestamp, and challenge. PUBLIC_WEB freezes the HTTPS host policy, submitted URL, acceptance timestamp, and challenge; the current web API cannot prove a final redirect destination. Do not relax freshness or proof checks to turn stale or inconclusive evidence into a success. Retry only through `retry_inconclusive` within the bounded cure window. Recover only after the contract's timeout or exhausted-cure rule allows it.

When v2 tools are enabled, configure `REFERRALRAIL_V2_ADDRESS` and `OUTCOMEJUDGE_V2_ADDRESS` alongside the existing MCP write controls. Keep all private keys in process environment only. Never post GitHub comments, create off-chain judgments, or use an arbitrary contract method as a substitute for protocol state.
