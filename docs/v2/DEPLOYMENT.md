# v2 deployment

The v2 deployment uses GenLayer Studio development chain `61997` and RPC `https://studio-dev.genlayer.com/api`. Deployment is separate from v1 and is recorded in `deployment/v2-61997.json`.

Current v2 contracts:

- ReferralIdentityV2: `0xb033E3EaDF931f2B9db494C7A5B52b01e717E366`
- ReferralRailV2: `0xA7084fDdf0F795F132d0eA069b47615FEDac0294`
- OutcomeJudgeV2: `0x811DE43E61aC7a9a2eB640C1B2973De950CFBB20`

The current v2 evidence is `deployment/v2/live-evidence.json`. The previous deployment generation is retained under `deployment/v2/history/live-evidence-pre-final-readback.json`. Fee observations are documented in `deployment/v2/fee-profile.json`.

Deploy ReferralRailV2 first, deploy OutcomeJudgeV2 with the rail address, then bind identity and judge once. Drive each write through explicit finalization and verify durable readback before treating it as successful. Never modify the frozen v1 contracts, v1 addresses, v1 deployment evidence, or the v1 production alias.
