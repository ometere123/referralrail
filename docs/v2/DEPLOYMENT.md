# v2 deployment

The v2 deployment uses GenLayer Studio development chain `61997` and RPC `https://studio-dev.genlayer.com/api`. Deployment is separate from v1 and is recorded in `deployment/v2-61997.json`.

Deploy the corrected ReferralRailV2 first, deploy OutcomeJudgeV2 with the rail address, then bind the judge once. Re-run contract lint, live readback, frontend build, and evidence assembly after every fresh deployment. Never overwrite `deployment/live-evidence.json` or the v1 production alias.
