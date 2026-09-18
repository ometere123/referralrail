# v2 deployment

The v2 deployment uses GenLayer Studio development chain `61997` and RPC `https://studio-dev.genlayer.com/api`. Deployment is separate from v1 and is recorded in `deployment/v2-61997.json`.

Current v2 contracts:

- ReferralIdentityV2: `0xbB5cbE643013B6a0408c64c8D3cF1D2B74282fD1`
- ReferralRailV2: `0xe26b9eAA0B956fdcaC1EF5F7c423C9f77CA703a3`
- OutcomeJudgeV2: `0xdf7d48A4739C44b335B36Fe1F09ABd18eEc73087`

The current v2 evidence is `deployment/v2/live-evidence.json`. The previous deployment generation is retained under `deployment/v2/history/live-evidence-pre-final-readback.json`. Fee observations are documented in `deployment/v2/fee-profile.json`.

Deploy ReferralRailV2 first, deploy OutcomeJudgeV2 with the rail address, then bind identity and judge once. Drive each write through explicit finalization and verify durable readback before treating it as successful. Never modify the frozen v1 contracts, v1 addresses, v1 deployment evidence, or the v1 production alias.
