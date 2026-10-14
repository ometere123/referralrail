# ReferralRail v2 test report

## Current tree

- Branch: `referralrail-v2`
- Commit: current `referralrail-v2` branch head
- Chain: 61997
- RPC: `https://studio-dev.genlayer.com/api`
- Current v2 manifest: `deployment/v2-61997.json`

## Automated gates

- `python -m pytest tests/model tests/static -q`: 51 passed.
- Direct Mode: blocked before contract loading because the pinned `py-genlayer` runner archive is not present in the installed or CI GenVM artifact bundle. No Direct Mode pass is claimed for this tree.
- `python scripts/preflight.py --skip-tests`: PASS with a warning that the stored live evidence belongs to a superseded deployment.
- `python scripts/preflight.py --submission --skip-tests`: correctly BLOCKED until fresh evidence matches the current manifest.
- Frontend typecheck: PASS.
- Frontend production build: PASS. Frontend tests: 8 passed.
- SDK typecheck, build, tests, and pack dry-run: PASS. SDK tests: 12 passed, 1 skipped.
- MCP typecheck, build, tests, STDIO E2E, and pack dry-run: PASS. MCP tests: 6 passed.
- GenVM fast lint passed for all three v2 contracts. Semantic validation is blocked by the same missing pinned runner archive.
- `git diff --check`: PASS.

The model and static suites cover v2 participation, referral authorization, campaign completion, capacity and bounded host guards. Direct Mode source tests remain present, but their execution is not claimed while the pinned runner artifact is unavailable.

## Fresh live matrix

The corrected v2 generation was freshly deployed and bound on chain 61997. The deployment and binding transactions are finalized in `deployment/v2-61997.json`.

- Fresh success and negative lifecycle readbacks for the corrected addresses are blocked by the Studio Dev `gen_call` provider error `Can't reconnect until invalid transaction is rolled back`.
- The earlier PUBLIC_WEB and GitHub outputs remain historical and are not evidence for the corrected addresses.

Private keys are not committed. No replacement live claims are recorded until the provider returns authoritative readbacks.

## Frontend and release

- V2 is an isolated branch build only.
- `https://referralrail.vercel.app` remains v1 production and was not changed by this goal.
- V2 was not promoted to Vercel production.
- npm publication was not performed. SDK and MCP `0.2.0` are prepared for future publication.
- Browser live automation is not a release gate here because the native ACL helper failed before browser startup.

## Consensus dissent

No standalone live `NO_MAJORITY` or validator-dissent scenario was intentionally induced. Deterministic/static checks cover independent validator rerun and execution-error handling. A live dissent-specific proof remains unverified.
