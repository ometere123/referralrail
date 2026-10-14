# v2 deployment

The v2 deployment uses GenLayer Studio development chain `61997` and RPC `https://studio-dev.genlayer.com/api`. Deployment is separate from v1 and is recorded in `deployment/v2-61997.json`.

Current v2 contracts:

- ReferralIdentityV2: `0x1210cEe2E5B151826Db0ee458b51af1413D43AC3`
- ReferralRailV2: `0x520a0fA5A4c86bFbD50802E969D5aEA11352D63D`
- OutcomeJudgeV2: `0x83D67E068e40966a5DC901Ba4CaCCecF0C501259`

The current v2 evidence is `deployment/v2/live-evidence.json`. The previous deployment generation is retained under `deployment/v2/history/live-evidence-pre-final-readback.json`. Fee observations are documented in `deployment/v2/fee-profile.json`.

Deploy ReferralRailV2 first, deploy OutcomeJudgeV2 with the rail address, then bind identity and judge once. Drive each write through explicit finalization and verify durable readback before treating it as successful. Never modify the frozen v1 contracts, v1 addresses, v1 deployment evidence, or the v1 production alias.
