# Safety

The canonical network and addresses are hard-locked. Do not accept per-call address or RPC overrides. Keep writes disabled unless a signer and explicit write flag are both present. Never log keys. Never use arbitrary contract methods or privileged `set_judge` and `record_outcome` calls.

`accepted` is provisional and `finalized` is the source of truth. OutcomeJudge, not the agent, decides completion. For `INCONCLUSIVE`, inspect attempts, deadline, role, and retry eligibility. Do not claim payment or refund until settlement release is finalized and read back.
