# v2 deployment

The v2 deployment uses GenLayer Studio development chain `61997` and RPC `https://studio-dev.genlayer.com/api`. Deployment is separate from v1 and is recorded in `deployment/v2-61997.json`.

Current v2 contracts:

- ReferralIdentityV2: `0x1210cEe2E5B151826Db0ee458b51af1413D43AC3`
- ReferralRailV2: `0x520a0fA5A4c86bFbD50802E969D5aEA11352D63D`
- OutcomeJudgeV2: `0x83D67E068e40966a5DC901Ba4CaCCecF0C501259`

The prior v2 evidence files are historical and belong to superseded addresses. `deployment/v2/live-evidence.json` is not valid for the current manifest until it is regenerated from fresh finalized readbacks. Fee observations in `deployment/v2/fee-profile.json` are historical for the same reason.

Deploy ReferralRailV2 first, deploy OutcomeJudgeV2 with the rail address, then bind identity and judge once. Drive each write through explicit finalization and verify durable readback before treating it as successful. The deployment and binding transactions in the current manifest are finalized, but the protocol configuration readback is currently blocked by the Studio Dev provider rollback error. Never modify the frozen v1 contracts, v1 addresses, v1 deployment evidence, or the v1 production alias.
