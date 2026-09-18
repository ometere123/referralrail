# v2 deployment

The v2 deployment uses GenLayer Studio development chain `61997` and RPC `https://studio-dev.genlayer.com/api`. Deployment is separate from v1 and is recorded in `deployment/v2-61997.json`.

The current v2 evidence is `deployment/v2/live-evidence.json`. The general `deployment/live-evidence.json` path is a pointer to that v2-specific file, while the previous deployment generation is retained under `deployment/v2/history/`.

Deploy the corrected ReferralRailV2 first, deploy OutcomeJudgeV2 with the rail address, then bind the judge once. Drive each write through explicit finalization and verify durable readback before treating it as successful. Never modify the frozen v1 contracts, v1 addresses, chain 61999, or the v1 production alias.