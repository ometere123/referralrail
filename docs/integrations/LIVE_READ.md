# Canonical live read verification

The read-only verification is isolated in `.github/workflows/referralrail-live-read.yml` and is manually triggerable. It requires no private key and never submits a transaction. It checks the canonical protocol binding, accounting conservation, the verified `PAID` opportunity 3 and `REFUNDED` opportunity 2, their released settlement flag, and their finalized OutcomeJudge records.

The local command is:

```sh
RUN_REFERRALRAIL_LIVE_READS=1 npm exec -- vitest run integrations/sdk/tests/live-read.test.ts --pool=forks
```
