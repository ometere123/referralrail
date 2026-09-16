---
name: referralrail
description: Use for ReferralRail opportunity, referral, evidence submission, judgment, inconclusive recovery, settlement, and MCP workflows. Activate when an agent needs to inspect or operate the ReferralRail protocol, its canonical GenLayer deployment, or its SDK/MCP tools.
---

# ReferralRail

ReferralRail is a funded referral protocol. The employer creates and funds an opportunity, a third-party referrer locks a nominated candidate, and the candidate accepts, binds a GitHub identity, and submits a PR number. The deployed OutcomeJudge evaluates public GitHub evidence through GenLayer consensus. It is not an off-chain employment decision or an agent-controlled judge.

Canonical deployment: GenLayer Studio Next, chain `61997`, RPC `https://studio-dev.genlayer.com/api`. Use the SDK or MCP when available. Read current finalized state before every action. Never infer success from a transaction hash. A `PAID` or `REFUNDED` outcome is not proof that funds moved until `settlement_released` is true.

Always determine the connected wallet role, validate state and deadlines, preserve exact amounts and identities, and verify finalized execution plus post-write readback. Never leak credentials, call privileged methods, submit arbitrary methods, independently judge GitHub work, override `INCONCLUSIVE`, or bypass bounded retry and recovery.

Use the focused references for the state machine, tool mapping, protocol details, and safety rules.
