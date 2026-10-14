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

The corrected contracts are deployed and their deployment and binding transactions are finalized in the manifest. The previous live lifecycle evidence belongs to the superseded v2 addresses and is retained as history only. Fresh lifecycle evidence for the corrected addresses is still required before this branch can claim current `PAID`, `REFUNDED`, payout or recipient results. The Studio Dev read path currently returns a provider rollback error for `gen_call`, so no fresh result is being substituted.

The corrected contract now permits `cancel_campaign` only for an untouched ACTIVE campaign with zero occupied positions, zero successful positions, and zero paid total. Referrers must authorize a campaign before link-based attribution. A fully successful campaign reaches `COMPLETED` after its last payout. Partial-success accounting is covered by the model regressions and the retained Direct Mode scenarios, subject to the pinned runner availability limitation.

V2 is an isolated branch build. It is not deployed to Vercel production. `https://referralrail.vercel.app` remains the v1 production alias and is not a v2 URL.

npm publication is intentionally out of scope. SDK and MCP `0.2.0` are prepared for future publication. No standalone live validator-dissent or `NO_MAJORITY` scenario was intentionally induced; consensus-independent validator rerun is covered by deterministic tests. Redirect final-origin verification remains a known runtime limitation.
