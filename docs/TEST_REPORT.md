# Test report

## Checks actually executed in the repository-construction environment

Date: 2026-09-14

The available environment had Python and Node/TypeScript parsers but no internet/package registry access and no installed GenLayer/GenVM testing runtime. Claims below are limited to checks that were genuinely run.

### Passed

- Python syntax compilation for both Intelligent Contract files.
- TypeScript/TSX syntax parsing for all frontend/deployment source files using the available TypeScript parser.
- Pure protocol/accounting model test suite: **27 passed**.
- Static contract architecture assertions included in the same pytest run.

The model suite exercises self-referral prevention, explicit candidate acceptance, attribution immutability, actor permissions, double-settlement prevention, referral-reward replay prevention, unauthorized judge callbacks, cross-attempt replay, `NOT_COMPLETED` refund, `INCONCLUSIVE` retry/recovery, stalled-judgment recovery, deterministic expiry/cancellation and the funding conservation invariant.

## Not claimed as executed here

The following require the external toolchain or a live network and therefore remain mandatory release gates:

- installing npm/Python GenLayer dependencies;
- `genvm-lint check` / GenVM semantic validation;
- Direct Mode contract execution;
- live multi-validator integration;
- TypeScript semantic typecheck with project dependencies;
- actual Next.js production build;
- fee-profile measurement;
- 61997 deployment;
- live end-to-end contract evidence;
- deployed frontend smoke test.

`AGENT_HANDOFF.md` tells the deployment agent to execute each remaining gate and stop on failure rather than treating this report as proof of those actions.
