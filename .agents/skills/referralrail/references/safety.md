# Safety

The SDK hard-locks canonical use to Studio Next chain `61997` and the two deployed addresses. Do not accept per-call network or contract-address overrides in MCP. Keep writes disabled unless a signer and explicit `REFERRALRAIL_WRITE_ENABLED=true` are both present. Keys belong only in process environment, must never be logged, returned, or placed in tool arguments.

`Accepted` is provisional. Every write must reach finalization, prove successful execution, and read finalized protocol state. `PAID` or `REFUNDED` is an outcome state, not proof that value moved. Only `settlement_released` after finalized `settle_opportunity` proves release.

OutcomeJudge owns substantive completion judgment. Do not use an LLM, GitHub API, or personal opinion off-chain to settle the opportunity. For `INCONCLUSIVE`, inspect active attempt, maximum attempts, cure deadline, candidate role, and current state. Recover only after judgment timeout or exhausted/expired cure conditions. Never call `set_judge`, `record_outcome`, or arbitrary contract methods.
