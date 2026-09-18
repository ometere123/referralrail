# ReferralRail v2 build status

Branch: `referralrail-v2`
Latest pushed commit: see the current `referralrail-v2` branch head
Network: Studio Next / Studionet Dev
Chain: `61997`
RPC: `https://studio-dev.genlayer.com/api`
Explorer: `https://explorer-studio-dev.genlayer.com/`

The current v2 architecture uses exactly `GITHUB_PR` and `PUBLIC_WEB`. `PUBLIC_WEB` is universal bounded HTTPS evidence. X, Medium, DEV and similar destinations are frontend presets only and are not protocol modes.

Current deployment and evidence:

- Manifest: `deployment/v2-61997.json`
- Canonical evidence: `deployment/v2/live-evidence.json`
- Historical previous generation: `deployment/v2/history/live-evidence-previous-generation.json`
- General-path pointer: `deployment/live-evidence.json`

Verified completed gates:

- Fresh v2 contracts deployed and bound on chain 61997.
- GitHub success lifecycle completed and paid with fresh PR #24.
- Negative GitHub lifecycle for `ometere123/thedadsbot` PR #13 refunded.
- PUBLIC_WEB success, host restriction, and inconclusive retry lifecycles completed.
- Multi-position campaign 9 proved A `PAID`, B `FAILED`, C `PAID`, with `successful=2` and conserved accounting.
- Full Python tests, Direct Mode, preflight, GenVM lint and validation, frontend typecheck, and production build passed.
- SDK and MCP build, tests, packaging checks, and MCP STDIO E2E passed.
- Vercel production deployment is READY and responds with HTTP 200.

Known incomplete or environment-blocked gates:

- Native browser automation remains blocked by the Windows ACL helper before a browser session can start.
- npm publication and clean-install verification are pending npm authentication. `npm whoami` returned `E401 Unauthorized`.
- No standalone live validator-dissent or `NO_MAJORITY` scenario was intentionally induced; consensus-independent validator rerun is covered by static and model checks.
These blockers are recorded here explicitly. They do not change the verified on-chain or build results.