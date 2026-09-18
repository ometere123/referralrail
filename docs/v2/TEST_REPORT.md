# ReferralRail v2 test report

## Final tree

- Branch: `referralrail-v2`
- Commit: current `referralrail-v2` branch head
- Chain: 61997
- RPC: `https://studio-dev.genlayer.com/api`

## Automated gates

- `python -m pytest -q`: 46 passed, 3 skipped.
- `python -m pytest tests/direct -vv`: 6 passed, including 2 v2-specific Direct Mode checks. The Direct Mode wrapper does not propagate an exact payable value for the v2 method with default arguments, so exact v2 funding is verified by the finalized live campaign and the existing v1 payable Direct Mode test.
- `python scripts/preflight.py`: PASS.
- Frontend `npm run typecheck`: PASS.
- Frontend `npm run build`: PASS.
- SDK build: PASS.
- SDK tests: 11 passed, 1 skipped.
- SDK pack check: PASS.
- MCP build: PASS.
- MCP tests: 5 passed.
- MCP STDIO E2E: PASS.
- MCP pack check: PASS.
- `git diff --check`: run on the pushed v2 changes before handoff.

GenVM lint and validation passed for `referral_rail_v2.py`, `outcome_judge_v2.py`, and `referral_identity_v2.py` using genvm-linter 0.11.1rc2.

## Live matrix

- GitHub success: campaign 3, position 1, `ometere123/evifix` PR #24, final `PAID`.
- GitHub negative: campaign 4, position 1, `ometere123/thedadsbot` PR #13, final `REFUNDED`.
- PUBLIC_WEB success: campaign 6, position 1, final `PAID`.
- Inconclusive retry: campaign 8, attempt 1 `INCONCLUSIVE`, attempt 2 `COMPLETED`, final `PAID`.
- Host restriction: campaign 7, wrong host `example.com`, final refund path.
- Capacity proof: campaign 9, A `PAID`, B `FAILED` with `NOT_COMPLETED`, C `PAID`, final `successful=2`.

All live claims are sourced from `deployment/v2/live-evidence.json`. Transaction hashes and finalized readbacks are retained in the generated deployment artifacts and canonical evidence. Private keys are not committed.

## Frontend and release

- Vercel production URL: `https://referralrail.vercel.app`
- Deployment status: READY.
- Production alias probe: HTTP 200, title `ReferralRail - referrals that settle on verified work`.
- Browser live automation: not verified because the native ACL helper failed before browser startup.
- npm packages are prepared as SDK `0.2.0` and MCP `0.2.0`, but publication is not complete because npm authentication returned `E401 Unauthorized`.