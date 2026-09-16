# ReferralRail v2 build status

Branch: `referralrail-v2`

Base: `d9841981f8e7c69a0eaeb1da9a880e0df29ec990`

Contracts: linted and deployed fresh on chain 61997. The current deployment is recorded in `deployment/v2-61997.json`.

Frontend: production build and TypeScript checks pass. V2 campaign routes are exposed at `/v2`, `/v2/campaigns/[id]`, and `/v2/campaigns/new`.

SDK: v2 typed reads and writes are present and typecheck.

Tests: v2 model and static contract tests pass.

Live evidence: pending completion of real reservation, judgment, settlement, failure, reopening, and refund readbacks. This status file must not be changed to claim completion until `deployment/v2/live-evidence.json` contains those finalized receipts and state snapshots.

Known limitations: the remaining live evidence and full MCP/skill v2 audit are still required for the final completion claim.
