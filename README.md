# ReferralRail

**Referral attribution becomes enforceable economic state.**

ReferralRail is a GenLayer Future of Work protocol for one narrow lifecycle: an employer pre-funds a paid opportunity, a third-party referrer binds the nominated candidate, the candidate explicitly accepts that attribution before completing the job, GenLayer independently verifies the finished public work, and a successful result splits the committed funding between candidate and referrer.

ReferralRail is deliberately **not** a freelance marketplace, generic bounty board, generic escrow, dispute court, reputation system, or prediction market. The protocol exists to make a referral relationship — and its later economic consequence — explicit, accepted, immutable and auditable before the outcome is known.

## Hackathon target

- Track: **Future of Work**
- Network: **Studio Next / Studionet Dev**
- Chain ID: **61997**
- RPC: `https://studio-next.genlayer.com/api`
- Explorer: `https://explorer-studio-dev.genlayer.com/`
- Contracts: exactly two Intelligent Contracts
- Backend: none
- Evidence source: public GitHub API only

The repository intentionally hard-locks the frontend and deployment tooling to this network configuration.

## Product lifecycle

1. **Employer funds opportunity.** The immutable brief, acceptance criteria, GitHub repository, candidate wallet, candidate payment, referral reward, and deadlines are written on-chain. The call must carry exactly `candidate payment + referral reward`.
2. **Referrer locks attribution.** A third-party referrer names the already-registered candidate. Employer and candidate cannot self-refer; an existing referral cannot be replaced.
3. **Candidate accepts.** Only the candidate may accept and bind their GitHub login. This is the point at which referral attribution becomes accepted protocol state.
4. **Candidate submits completed work.** The candidate supplies only a PR number. The repository source was frozen at opportunity creation, preventing arbitrary evidence URLs.
5. **OutcomeJudge verifies.** Objective GitHub facts are checked first, then the actual merged change is evaluated against the frozen natural-language criteria. Validators independently refetch and independently re-run the substantive judgment.
6. **Settlement.** `COMPLETED` pays candidate + referrer; `NOT_COMPLETED` refunds the employer; `INCONCLUSIVE` enters a bounded cure route. Stale or exhausted cases can always recover funds.

Terminal opportunity states are `PAID`, `REFUNDED`, `EXPIRED`, or `CANCELLED`.

## Why GenLayer is essential

The three economic actors have conflicting incentives. An employer should not be able to erase a referrer after useful work is delivered; a referrer should not be able to silently bind a candidate; and a candidate should not be able to self-certify completion. Whether a merged change materially satisfies an immutable natural-language work specification is consequential judgment that moves pre-funded value. ReferralRail puts that judgment inside GenLayer consensus rather than a private employer database or centralized reviewer.

The protocol deliberately separates deterministic facts from judgment:

- deterministic: repository identity, PR author, merged state, merge deadline, exact funding, actor authorization, replay protection;
- consensus judgment: whether the readable merged diff materially satisfies every mandatory acceptance criterion;
- safe uncertainty: missing, malformed, truncated or unavailable evidence becomes `INCONCLUSIVE`, not an invented approval or rejection.

## Contracts

### `contracts/referral_rail.py`

The settlement/state contract owns funding, attribution, candidate acceptance, the state machine, immutable economic terms, settlement, refund/expiry/recovery, replay protection and accounting invariants. It can accept outcome callbacks only from the one configured judge and only for the exact active opportunity/attempt.

### `contracts/outcome_judge.py`

The source-restricted judge fetches only the GitHub PR and changed-file API paths derived from the repository already frozen in the settlement contract. It stores an evidence digest and audit summary. Its validator does not merely validate JSON: it independently refetches GitHub and independently repeats the meaningful evaluation before comparing the outcome and stable evidence fields.

Contract-to-contract writes use finalized messages so appealed parent executions cannot create irreversible duplicate economic actions.

## Frontend

The Next.js frontend makes the protocol lifecycle visible rather than hiding it behind a generic dashboard. It has a distinct referral/payment visual language, a public live opportunity board, employer creation flow, candidate/referrer role actions, judgment evidence, terminal settlement display and responsive layouts.

Transaction UX distinguishes wallet/network readiness, signature, submission, consensus, finalization and contract readback. A write is not labelled successful merely because the wallet submitted it: the UI tracks to finalization and then checks finalized contract state.

## Repository map

```text
contracts/                 two Intelligent Contracts
frontend/                  Next.js product UI + Transaction Kit RC2
deploy/                    fee-aware two-contract deployment script
deployment/                generated live manifest/evidence destination
docs/                      architecture, security, validation, state machine, demo and review traceability
tests/model/               executable state/accounting model tests
tests/static/              contract architecture and safety assertions
scripts/                   preflight and live-evidence helpers
SUBMISSION.md               Portal-ready submission copy
AGENT_HANDOFF.md            exact remaining live execution procedure
```

## Local verification

The environment used to create this repository had no external package registry or GenVM runtime, so the checks that were genuinely executable here are recorded in `docs/TEST_REPORT.md`. Run the full release gate in a networked development environment before submission:

```bash
python -m pip install -r requirements.txt
npm install
python -m pytest -q
genvm-lint check contracts/referral_rail.py
genvm-lint check contracts/outcome_judge.py
npm run typecheck
npm run build
python scripts/preflight.py
```

The current pure-Python protocol/invariant suite contains 27 passing tests. GenVM lint/direct-mode, package installation and the real Next build still require the toolchain and are intentionally **not** claimed as completed here.

## Deployment

Do not deploy until a representative **finalized** fee profile has been measured for the actual message-producing branches. `deploy/001_deploy_referralrail.ts` refuses the wrong chain/RPC, deploys ReferralRail, deploys OutcomeJudge with the settlement address, binds the judge exactly once, waits for finalization, verifies execution success and writes `deployment/61997.json` from real receipts/readback.

Follow `docs/DEPLOYMENT.md` and `AGENT_HANDOFF.md`. No deployment address or transaction hash is hard-coded or fabricated in this repository.

## Demo

The intended 90–120 second story is:

**Employer funds → referrer refers → candidate accepts → candidate submits merged PR → GenLayer verifies → candidate is paid → referrer visibly earns because their accepted referral completed.**

See `docs/DEMO_SCRIPT.md`.

## Submission status

Code, product architecture, frontend source, deterministic model tests, documentation and deployment automation are prepared. The remaining actions require an internet-enabled GenLayer environment and funded signing wallet: install dependencies, run GenVM checks/direct integration, generate the real fee profile, deploy to 61997, execute live evidence cases, configure the two frontend addresses, build/deploy the frontend, and record the mandatory demo. Exact commands and stop conditions are in `AGENT_HANDOFF.md`.
