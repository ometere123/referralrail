# Reviewer-rubric traceability

This repository was designed backwards from the supplied GenLayer project-review rubric. This document points reviewers to concrete evidence rather than claiming a score.

## Validity gate

| Requirement | ReferralRail evidence |
|---|---|
| real GenLayer contract | two contract source files under `contracts/` |
| AI decision runs on GenLayer | `OutcomeJudge.evaluate` uses GenLayer web + LLM nondeterminism and equivalence validation |
| frontend reaches actual contract | contract read/write integration under `frontend/lib/`; no server-memory protocol state |
| code substantially new | referral-specific state machine, candidate acceptance, locked attribution, two-contract callback, GitHub verifier and settlement |
| no mocked live integration | public UI reads contract state; mock evidence exists only in test scope |

## GenLayer Fit

The consequential decision is whether a specific accepted referral produced work that satisfies immutable terms. It controls the release of pre-funded candidate and referral value. Employer, candidate and referrer have conflicting incentives, so no one of them is an appropriate unilateral outcome authority.

The contract verifies current external facts from GitHub and the use case is referral-specific rather than a generic adjudication interface. See `ARCHITECTURE.md` and `VALIDATION.md`.

## Contract Quality

- coherent two-contract architecture with distinct economic and judgment responsibilities;
- substantive custom validator independently refetches and re-evaluates the meaningful outcome;
- source-dependent decision uses a restricted credible web path;
- deterministic gates are separated from qualitative judgment;
- first-class `INCONCLUSIVE` outcome;
- bounded data and injection-resistant prompting;
- finalized cross-contract messages + callback authentication + replay protection;
- finite failure/recovery paths and accounting invariant.

See `contracts/`, `VALIDATION.md`, `SECURITY_MODEL.md`, `STATE_MACHINE.md`.

## Engineering

- explicit network guard shared by frontend/deployment;
- exact dependency versions for the hackathon frontend integration;
- state/accounting model tests and static architecture assertions;
- fee-aware deployment automation that waits for finalization and verifies execution;
- no fabricated deployment manifest;
- preflight tool, CI, environment examples, security and deployment docs;
- explicit limitations/trust assumptions;
- bounded retry/timeout/recovery behavior.

See `TEST_REPORT.md`, `DEPLOYMENT.md`, `AGENT_HANDOFF.md`.

## Frontend / UX

- complete lifecycle surfaced in product UI;
- separate views/actions for employer, referrer and candidate roles;
- wallet disconnected / wrong network / transaction tracking / finality / readback / failure states;
- no success claim at submission time;
- visible judgment reason/digest/audit;
- strong terminal settlement state showing candidate and referrer amounts;
- responsive original visual system rather than a starter-template appearance.

Final UX evidence must be the deployed live app and demo video, not this document.
