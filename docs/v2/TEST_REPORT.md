# ReferralRail v2 test report

## Final tree

- Branch: `referralrail-v2`
- Commit: current `referralrail-v2` branch head
- Chain: 61997
- RPC: `https://studio-dev.genlayer.com/api`
- Current v2 manifest: `deployment/v2-61997.json`

## Automated gates

- `python -m pytest -q`: 46 passed, 3 skipped.
- `python -m pytest tests/direct -q`: 6 passed.
- `python scripts/preflight.py --skip-tests`: PASS.
- Frontend typecheck: PASS.
- Frontend production build: PASS.
- Frontend validation tests: 6 passed.
- SDK typecheck, build, tests, and pack dry-run: PASS. SDK tests: 12 passed, 1 skipped.
- MCP typecheck, build, tests, STDIO E2E, and pack dry-run: PASS. MCP tests: 6 passed.
- GenVM lint and validation passed for `referral_rail_v2.py`, `outcome_judge_v2.py`, and `referral_identity_v2.py`.
- Agent Skill validation: PASS.
- `git diff --check`: PASS.

The Direct Mode harness does not propagate an exact payable value for the v2 method with default arguments. Exact v2 campaign funding is covered by the finalized fresh live campaign and the existing v1 payable Direct Mode test. Static and model tests cover the v2 participation and bounded host guards.

## Fresh live matrix

The current v2 generation was freshly deployed and bound on chain 61997.

- PUBLIC_WEB success: fresh campaign, final position `PAID`, `candidate_paid=true`, `referrer_paid=true`, and `settlement_released=true`.
- PUBLIC_WEB negative: fresh campaign, final position `FAILED`, then campaign `REFUNDED`.
- Historical real evidence preserved: `ometere123/evifix` PR #24 success, `ometere123/thedadsbot` PR #13 negative refund, PUBLIC_WEB host restriction, bounded inconclusive retry, multi-position capacity, and finalized child transaction IDs.

All live claims are sourced from `deployment/v2/live-evidence.json`. The prior generation is retained at `deployment/v2/history/live-evidence-pre-final-readback.json`. Private keys are not committed.

## Frontend and release

- V2 is an isolated branch build only.
- `https://referralrail.vercel.app` remains v1 production and was not changed by this goal.
- V2 was not promoted to Vercel production.
- npm publication was not performed. SDK and MCP `0.2.0` are prepared for future publication.
- Browser live automation is not a release gate here because the native ACL helper failed before browser startup.

## Consensus dissent

No standalone live `NO_MAJORITY` or validator-dissent scenario was intentionally induced. Deterministic/static checks cover independent validator rerun and execution-error handling. A live dissent-specific proof remains unverified.
