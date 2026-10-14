# v2 live evidence

The historical v2 evidence files record finalized outputs for superseded v2 addresses. They must not be used as current evidence for `deployment/v2-61997.json`.

Fresh evidence for the corrected deployment is not yet valid. The Studio Dev `gen_call` read path currently returns `Can't reconnect until invalid transaction is rolled back`, so the live success and negative cases cannot be read back authoritatively. No replacement hashes or states are recorded here until the provider recovers.

The prior real generation is preserved inside the canonical file and at `deployment/v2/history/live-evidence-pre-final-readback.json`. That historical evidence includes GitHub success for `ometere123/evifix` PR #24, the negative `ometere123/thedadsbot` PR #13, PUBLIC_WEB success and host restriction, bounded inconclusive retry, multi-position capacity, and finalized child transaction IDs.

When fresh verification resumes, the scripts use `PUBLIC_WEB` with the challenge requirement disabled so the corrected deployment can be verified without claiming a new off-chain identity or publishing a new challenge. Redirect final-origin verification remains unavailable because the runtime does not expose a cryptographically verified final URL.

The general `deployment/live-evidence.json` path is an explicit pointer only. No current v2 evidence is presented as v1 evidence.
