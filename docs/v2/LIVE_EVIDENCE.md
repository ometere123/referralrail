# v2 live evidence

The authoritative current v2 evidence is `deployment/v2/live-evidence.json`. It is generated from finalized live outputs on chain 61997 and records the fresh v2-only deployment, PUBLIC_WEB success reaching `PAID` with both payout legs released, and PUBLIC_WEB negative evidence reaching `REFUNDED`.

The prior real generation is preserved inside the canonical file and at `deployment/v2/history/live-evidence-pre-final-readback.json`. That historical evidence includes GitHub success for `ometere123/evifix` PR #24, the negative `ometere123/thedadsbot` PR #13, PUBLIC_WEB success and host restriction, bounded inconclusive retry, multi-position capacity, and finalized child transaction IDs.

Fresh verification campaigns used `PUBLIC_WEB` with the challenge requirement disabled so the redeployed contract could be verified without claiming a new off-chain identity or publishing a new challenge. Redirect final-origin verification remains unavailable because the runtime does not expose a cryptographically verified final URL.

The general `deployment/live-evidence.json` path is an explicit pointer only. No current v2 evidence is presented as v1 evidence.
