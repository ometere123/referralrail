# ReferralRail v2 build status

Branch: `referralrail-v2`
Latest pushed commit: see the current branch head
Network: Studio Next / Studionet Dev
Chain: `61997`
RPC: `https://studio-dev.genlayer.com/api`
Explorer: `https://explorer-studio-dev.genlayer.com/`

The current v2 architecture uses exactly `GITHUB_PR` and `PUBLIC_WEB`. `PUBLIC_WEB` is universal bounded HTTPS evidence. X, Medium, DEV and similar destinations are frontend presets only and are not protocol modes.

Current deployment and evidence:

- Manifest: `deployment/v2-61997.json`
- Canonical evidence: `deployment/v2/live-evidence.json`
- Fee profile: `deployment/v2/fee-profile.json`
- Historical previous generation: `deployment/v2/history/live-evidence-pre-final-readback.json`
- General-path pointer: `deployment/live-evidence.json`

The fresh v2 generation has a real PUBLIC_WEB success that reached `PAID` with `candidate_paid=true`, `referrer_paid=true`, and `settlement_released=true`. Its real negative case reached `FAILED` and then campaign `REFUNDED`. The corrected contract now permits `cancel_campaign` only for an untouched ACTIVE campaign with zero occupied positions, zero successful positions, and zero paid total. Partial-success accounting is covered by Direct Mode and model regressions. Historical GitHub evidence remains preserved, including PR #24 success and PR #13 negative refund.

V2 is an isolated branch build. It is not deployed to Vercel production. `https://referralrail.vercel.app` remains the v1 production alias and is not a v2 URL.

npm publication is intentionally out of scope. SDK and MCP `0.2.0` are prepared for future publication. No standalone live validator-dissent or `NO_MAJORITY` scenario was intentionally induced; consensus-independent validator rerun is covered by deterministic tests. Redirect final-origin verification remains a known runtime limitation.
