# Final live handoff - ReferralRail

Finish ReferralRail completely from the repository folder I have opened for you.

Repository: `https://github.com/ometere123/referralrail`

Do **not** only review it, return a plan, rewrite the architecture, or stop after linting. The product scope and two-contract architecture are already locked. Your job is to execute the remaining environment-dependent release work, fix any real blocker you discover, collect truthful live evidence, configure the frontend against the real contracts, and leave the repository genuinely ready for Agent Tank submission.

The owner is working on **Windows**. Work Windows-first. **Do not require WSL by default.** Use WSL only if GenLayer Direct Mode / GenVM runtime execution demonstrably fails because of a Windows-specific runtime/file-descriptor/path limitation. Frontend work, ordinary Python tests, GenVM linter, Studio Next deployment, live transactions and frontend deployment should remain on native Windows unless there is a concrete blocker.

## Source of truth

Read these files first, in full, before changing code:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/STATE_MACHINE.md`
- `docs/VALIDATION.md`
- `docs/SECURITY_MODEL.md`
- `docs/DEPLOYMENT.md`
- `docs/LIVE_EVIDENCE.md`
- `docs/RUBRIC_TRACEABILITY.md`
- `docs/TEST_PLAN.md`
- `docs/TEST_REPORT.md`
- `docs/DEMO_SCRIPT.md`
- `SUBMISSION.md`
- `contracts/referral_rail.py`
- `contracts/outcome_judge.py`
- `frontend/.env.example`
- `deploy/001_deploy_referralrail.ts`

Preserve the product thesis:

> **Referral attribution becomes enforceable economic state.**

Do not expand ReferralRail into a recruiting marketplace, CV scorer, KYC product, chat system, generalized reputation protocol, DAO, token, cross-chain product, multi-category work marketplace, generic bounty system, generic escrow or generic dispute court.

## Network lock - non-negotiable

Use only:

- Network: **Studio Next / Studionet Dev**
- Chain ID: **61997**
- RPC: `https://studio-dev.genlayer.com/api`
- Explorer: `https://explorer-studio-dev.genlayer.com/`

Never use chain `61999`, old Studionet, Bradbury, or a different RPC anywhere in product configuration, deployment scripts, documentation, screenshots or submission evidence.

The existing code contains network guards. Do not loosen, bypass or remove them.

## Toolchain expectations

Use a supported 64-bit Python 3.12 environment and a current Node version compatible with Next.js 16. Git must be installed because `requirements.txt` contains `git+https://...` dependencies.

The frontend/package versions are intentionally aligned with the current Agent Tank `v2-dev` tooling, including:

- `@genlayer/transaction-kit@0.1.0-rc.2`
- `@genlayer/transaction-kit-react@0.1.0-rc.2`
- `genlayer-js@2.0.0-rc.1`

Do not casually upgrade these prerelease packages during the final release pass. If a package must change to fix a confirmed incompatibility, explain why and verify the whole release gate again.

## Windows-first bootstrap

From **PowerShell** at the repository root:

```powershell
py -3.12 --version
node --version
npm --version
git --version

py -3.12 -m venv .venv
Set-ExecutionPolicy -Scope Process Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
npm install
```

If PowerShell activation is blocked for any reason, do not waste time changing machine-wide policy. Use the venv executables directly, e.g.:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
```

`npm install` at repository root must generate/update the root lockfile for the workspace. Commit the real generated lockfile; do not hand-author one.

Before continuing, record the exact versions actually used:

```powershell
python --version
python -m pip --version
node --version
npm --version
genvm-lint --version
```

If any required installation fails, diagnose the actual package/toolchain error. Do not switch networks or weaken contract logic to work around an installation problem.

## Required execution order

### 1. Baseline deterministic tests

Run:

```powershell
python -m pytest -q
```

All existing protocol/model/static tests must remain green. At handoff creation time the deterministic suite had 27 passing tests; do not claim that count remains true unless you run it yourself after your changes.

### 2. GenVM lint, semantic validation and typecheck

Run all of these against both contracts:

```powershell
genvm-lint check contracts/referral_rail.py
genvm-lint check contracts/outcome_judge.py
genvm-lint typecheck contracts/referral_rail.py
genvm-lint typecheck contracts/outcome_judge.py
```

`genvm-lint check` performs lint + SDK semantic validation. Treat any non-zero exit as a blocker. Fix real Consensus v0.6/API/type/storage issues, but do **not** weaken validator independence, source restrictions, authorization, finality, recovery or accounting merely to silence a tool.

If the exact SDK artifacts have not been cached and the linter needs them, allow it to download the version required by each contract header. Do not rewrite dependency headers just to use a different cached SDK.

### 3. Add and run the missing GenLayer Direct Mode suite

The deterministic tests are not a substitute for Direct Mode. Create a proper `tests/direct/` suite using the installed `genlayer-test` v0.30 development line and cover every Direct Mode scenario in `docs/TEST_PLAN.md`, especially:

- deploy both contracts and bind the judge once;
- exact payable opportunity creation + underfund/overfund rejection;
- employer/referrer/candidate authorization matrix;
- no employer or candidate self-referral;
- candidate explicit acceptance required;
- frozen attribution readback;
- only candidate may submit work;
- work submission emits the expected finalized judge message;
- objective GitHub failure cases;
- unavailable/malformed GitHub source -> `INCONCLUSIVE`;
- a completed case using mocked GitHub + mocked LLM where leader and validators independently agree;
- **dissenting-validator case** proving a leader `COMPLETED` label cannot pass on schema/enum validity alone;
- callback authenticates the configured judge and exact active attempt;
- stale/wrong attempt and replay rejection;
- completed candidate/referrer split;
- failed-work employer refund;
- inconclusive retry and bounded cure;
- judgment timeout / permissionless recovery;
- accounting conservation and no double settlement.

Mocks must be strict enough that a wrong GitHub route cannot silently match an unrelated fixture.

Run the Direct Mode suite separately as well as in the whole suite:

```powershell
python -m pytest tests/direct -vv
python -m pytest -q
```

Do not call Direct Mode complete just because deterministic model tests passed.

## Windows Direct Mode handling

**Try Direct Mode natively on Windows first.** WSL is a fallback, not the default.

A known class of Windows issue in the current Direct Mode loader is temporary-message-file cleanup around stdin/file descriptor 0. If native Direct Mode fails specifically with a `PermissionError` from the loader's message injection/cleanup path, inspect the traceback first. If it is the known cleanup problem, a narrow Windows-only compatibility shim in `tests/direct/conftest.py` is acceptable:

```python
import sys

if sys.platform == "win32":
    from gltest.direct import loader as direct_loader

    _inject_message_to_fd0 = direct_loader._inject_message_to_fd0

    def _windows_safe_message_injection(vm):
        try:
            _inject_message_to_fd0(vm)
        except PermissionError:
            # Windows can keep fd 0's injected temp file open during loader
            # cleanup even after injection succeeded. Keep this workaround
            # isolated to the loader injection path only.
            pass

    direct_loader._inject_message_to_fd0 = _windows_safe_message_injection
```

Only add that workaround if the actual traceback matches that failure mode. Do not suppress unrelated `PermissionError`s.

If Direct Mode still fails natively because the GenVM runner/toolchain itself requires POSIX behavior, use **WSL only for the Direct Mode/GenVM-runtime tests**. Do not migrate deployment or frontend work unnecessarily.

### WSL fallback procedure

If WSL is already installed, from PowerShell enter it with:

```powershell
wsl
```

Inside WSL, do not reuse the Windows virtualenv. Create a Linux venv. You may run against the same checked-out source under `/mnt/c/...`, while keeping the Linux venv in the WSL home directory:

```bash
python3.12 --version
python3.12 -m venv ~/.venvs/referralrail
source ~/.venvs/referralrail/bin/activate
python -m pip install --upgrade pip
cd /mnt/c/<PATH-TO>/referralrail
python -m pip install -r requirements.txt
python -m pytest tests/direct -vv
python -m pytest -q
```

If Python 3.12 is not available in the WSL distribution, install it using the distribution's supported package method. If installing WSL itself would require a reboot or administrator action, stop and tell the user rather than pretending the Direct Mode suite ran.

Do **not** reuse `.venv` or `node_modules` across Windows and Linux. Do **not** copy private deployment keys into WSL merely for Direct Mode tests. Any test files/fixes created under WSL must end up back in the main Git working tree and be included in the final commit.

Once Direct Mode passes, return to native Windows for frontend/deployment unless another concrete blocker exists.

### 4. Frontend semantic checks and production build

Run:

```powershell
npm run typecheck
npm run build
```

Then run the app:

```powershell
npm run dev
```

Inspect at minimum:

- landing/opportunity board;
- create opportunity;
- opportunity detail/lifecycle;
- desktop width;
- mobile width;
- disconnected wallet;
- wrong network;
- missing contract configuration;
- role-specific actions.

Keep the existing distinct ReferralRail visual identity. Do not replace it with boilerplate or a generic AI/SaaS dashboard.

The UI must make this lifecycle understandable without reading source code:

**opportunity -> referral -> candidate acceptance -> work evidence -> GenLayer decision -> candidate/referrer settlement**.

Do not let the UI call a transaction successful merely because it was submitted. Preserve tracking through finalization and finalized contract readback.

### 5. Real fee profiling - mandatory before deployment

Do **not** invent `fee-profile.json` values.

Use the installed current GenLayer testing/profiling tooling and representative **finalized** executions. If the exact CLI flags have changed, inspect the installed tool's `--help` and the current Agent Tank `v2-dev` profiling examples rather than guessing.

Profile the expensive/message-producing branches listed in `docs/DEPLOYMENT.md`, including:

- deployment of both contracts;
- `set_judge`;
- payable `create_opportunity`;
- `create_referral`;
- `accept_referral`;
- `submit_work` and its finalized child message;
- OutcomeJudge `evaluate` with web + LLM work and finalized callback;
- `record_outcome` completed branch with candidate + referrer transfers;
- not-completed employer refund;
- inconclusive + retry;
- expiry/recovery paths.

Create a **real root `fee-profile.json`** from measured finalized executions and verify message-producing methods have sufficient `totalMessageFees` based on actual observations.

Do not proceed to deployment with guessed/default-zero message budgets for branches that emit messages/transfers.

### 6. Re-run the complete pre-deployment gate

After all fixes and fee profiling:

```powershell
python -m pytest -q
genvm-lint check contracts/referral_rail.py
genvm-lint check contracts/outcome_judge.py
genvm-lint typecheck contracts/referral_rail.py
genvm-lint typecheck contracts/outcome_judge.py
npm run typecheck
npm run build
python scripts/preflight.py
```

Everything must pass before touching the funded deployer wallet.

### 7. Deploy only to Studio Next / 61997

Use the funded authorized deployment wallet and run from the repository root:

```powershell
npm run deploy -- --rpc https://studio-dev.genlayer.com/api
```

`deploy/001_deploy_referralrail.ts` must:

1. reject the wrong chain/RPC;
2. deploy `ReferralRail` and wait for finalization + successful execution;
3. deploy `OutcomeJudge` with ReferralRail's real address and wait for finalization + successful execution;
4. call `set_judge` once and wait for finalization + successful execution;
5. read `get_protocol_config` back;
6. write `deployment/61997.json` using only real results.

If a transaction was submitted but tracking interrupted, **inspect/recover the existing transaction before resending**. Do not blindly redeploy and create duplicate contract pairs.

A deployment is not successful merely because a transaction hash exists. Require finalized status, successful execution and address/config readback.

### 8. Configure the frontend with only real deployed addresses

After successful deployment:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

Set only:

```text
NEXT_PUBLIC_REFERRAL_RAIL_ADDRESS=<real finalized ReferralRail address>
NEXT_PUBLIC_OUTCOME_JUDGE_ADDRESS=<real finalized OutcomeJudge address>
```

Keep:

```text
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61997
NEXT_PUBLIC_GENLAYER_CHAIN_NAME=GenLayer Studio Next
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio-dev.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=https://explorer-studio-dev.genlayer.com
```

Never insert placeholder/fabricated addresses into submission evidence.

Run again:

```powershell
npm run typecheck
npm run build
```

### 9. Execute truthful live evidence

Follow `docs/LIVE_EVIDENCE.md`.

Use **three distinct wallets** for the strongest success demonstration:

- employer;
- referrer;
- candidate.

Use a real public GitHub repository and a real merged PR that genuinely matches the opportunity terms.

Complete the actual flow:

**Employer funds -> referrer refers -> candidate accepts -> candidate submits merged PR number -> OutcomeJudge verifies -> finalized callback -> candidate paid -> referrer paid.**

Confirm by contract readback:

- final opportunity state is `PAID`;
- candidate address/payment are correct;
- referrer address/reward are correct;
- referral was accepted before work submission;
- outcome/attempt corresponds to that opportunity;
- accounting reflects the released funds;
- the same obligation cannot be settled again.

Also run at least one meaningful negative or naturally inconclusive live case if practical. Do not create fake web failures through a backend and present them as organic live evidence.

Record real transaction hashes, explorer links, states/readbacks and evidence references in `deployment/live-evidence.json`. Never type hashes from memory.

### 10. Submission preflight

Run:

```powershell
python scripts/preflight.py --submission
```

Fix every blocker. Do not bypass the script merely to make it print green.

### 11. Deploy and inspect the frontend

Deploy the production frontend to the selected host. ReferralRail requires no Railway, database or persistent application backend. Do not introduce one unless a concrete, unavoidable technical requirement is proven.

From a clean browser/wallet session verify:

- disconnected state;
- network detection/switching to 61997;
- employer opportunity creation/funding;
- referrer referral creation;
- candidate acceptance;
- candidate evidence submission;
- transaction awaiting signature;
- submitted state;
- consensus/decision state;
- finalization;
- finalized readback;
- reverted/error state;
- terminal settlement state;
- mobile usability.

A user should never be encouraged to blindly resubmit while a prior transaction may still be pending/finalizing.

### 12. Complete submission assets

Update `SUBMISSION.md` only with real values:

- repository URL;
- live frontend URL;
- ReferralRail contract address;
- OutcomeJudge contract address;
- deployment/finalization transaction hashes;
- useful live interaction hashes;
- demo video URL.

Record the mandatory **90–120 second demo** using `docs/DEMO_SCRIPT.md`. The core story must remain:

**Employer funds an opportunity -> referrer refers candidate -> candidate accepts -> candidate submits completed evidence -> GenLayer independently verifies -> candidate gets paid -> referrer visibly gets paid because the accepted referral completed.**

### 13. Final repository audit and push

Before declaring completion:

```powershell
git status
git diff --check
git grep -n "61999\|Bradbury" -- . ":(exclude).git"
```

Also manually verify:

- no private key, seed phrase, API secret or funded-wallet credential is committed;
- no fabricated deployment/evidence JSON;
- no mock/demo blockchain integration in the production frontend;
- no stale network configuration;
- no hidden backend dependency;
- no claim of a test/deployment you did not actually run;
- documentation matches the actual final behavior;
- `SUBMISSION.md` points to real live artifacts;
- the final code is pushed to `https://github.com/ometere123/referralrail` and the pushed commit matches the tested tree.

If CI exists/runs, inspect its status after push and fix genuine failures before submission.

## Critical contract properties not to weaken

- exactly two Intelligent Contracts with real separation of responsibility;
- candidate fixed when the employer funds;
- third-party referral only;
- explicit candidate acceptance before work submission;
- immutable referral attribution after lock/acceptance;
- source restricted to GitHub API paths derived from frozen repository + PR number;
- objective GitHub gates before LLM judgment;
- `COMPLETED`, `NOT_COMPLETED`, and `INCONCLUSIVE` are all real protocol outcomes;
- external evidence is treated as untrusted data and prompt-injection boundaries remain intact;
- evidence size/judgment scope remains bounded;
- validator independently refetches **and independently reruns the substantive judgment**;
- validator does not merely check JSON/enum validity;
- finalized Intelligent Contract messages are preserved;
- settlement callback authenticates judge + exact active opportunity/attempt;
- maximum evidence attempts and cure deadline remain bounded;
- judgment timeout + permissionless recovery remain available;
- full-funding invariant and single settlement remain enforced;
- candidate/referrer payouts cannot exceed committed funding;
- UI does not call a submitted transaction successful before finalization + finalized readback.

## Stop conditions

Stop and report the exact blocker instead of inventing evidence if:

- required wallet funding/authorization is missing;
- Studio Next is unavailable;
- the current v0.6 toolchain exposes an API incompatibility you cannot safely resolve;
- the GitHub evidence needed for the success case is not actually public and merged;
- either contract fails GenVM validation/typecheck;
- Direct Mode cannot be made to execute safely on native Windows and WSL is unavailable without user/admin action;
- fee profiling cannot produce truthful representative measurements;
- deployment does not finalize successfully;
- deployed protocol config/readback does not match the expected pair;
- frontend cannot confirm finalized state from the real contracts.

Never fabricate or simulate an address, transaction hash, fee measurement, screenshot, live result, validator result, CI result, deployed contract state or test result.

## What your final response to the owner must contain

Do not end with “done” alone. Report:

1. exact commit SHA pushed;
2. exact test commands and pass counts;
3. whether Direct Mode ran on native Windows or WSL, and why;
4. GenVM lint/typecheck results for both contracts;
5. frontend typecheck/build result;
6. fee-profile provenance (what finalized branches were measured);
7. deployed ReferralRail address + deployment tx;
8. deployed OutcomeJudge address + deployment tx;
9. judge-binding tx + config readback result;
10. successful live lifecycle transaction hashes + final state/readback;
11. negative/inconclusive live case evidence if run;
12. live frontend URL;
13. demo URL/status;
14. `python scripts/preflight.py --submission` result;
15. anything still genuinely outstanding.

If any item did not happen, say exactly that. Do not infer success from intent or from a submitted transaction.
