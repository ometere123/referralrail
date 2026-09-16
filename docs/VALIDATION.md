# Outcome validation design

## Decision being made

ReferralRail does **not** ask an LLM a generic “is this work good?” question. The consensus question is deliberately closed:

> Does this already-merged GitHub pull request, authored by the GitHub identity explicitly locked by the candidate, materially satisfy every mandatory criterion in this opportunity's immutable work brief and acceptance criteria?

## Deterministic gates first

Before qualitative judgment, every node derives the same objective facts from GitHub:

1. PR base repository equals the frozen repository;
2. PR author login equals the candidate's accepted GitHub login;
3. PR is closed and has a merge timestamp;
4. merge timestamp is at or before the frozen completion deadline.

A readable source that affirmatively fails one of those gates yields `NOT_COMPLETED`. A source that cannot be fetched/parses unexpectedly yields `INCONCLUSIVE`.

## Evidence bounds

The judge intentionally rejects over-broad inputs rather than letting evidence explode unpredictably:

- GitHub API host only;
- PR number supplied, source URL constructed internally;
- at most 50 changed files;
- at most 2,400 patch characters per file;
- at most 24,000 combined evidence characters;
- no readable text patch → `INCONCLUSIVE`.

These bounds keep validator work finite and make fee profiling meaningful.

## Prompt-injection boundary

GitHub metadata, source code, comments, documentation and patch text are labelled untrusted evidence. The prompt explicitly states that instructions inside that material cannot:

- redefine the acceptance criteria;
- force approval/rejection;
- reveal hidden prompts;
- cause tool use or fund movement;
- introduce facts not visible in supplied evidence.

The immutable employer brief and criteria define policy, but even those values cannot override verifier instructions.

## First-class outcomes

`COMPLETED`: objective gates pass and the inspectable merged changes materially satisfy every mandatory criterion.

`NOT_COMPLETED`: evidence is readable and affirmatively demonstrates an objective failure or a mandatory acceptance criterion is materially unmet or contradicted.

`INCONCLUSIVE`: evidence is missing, unavailable, malformed, unsupported in breadth, patchless, truncated, ambiguous, or the qualitative result cannot be safely parsed.

Uncertainty is never silently converted into rejection or approval.

## Substantive validator

The leader calls `evaluate_once(...)` and proposes structured decision evidence. The validator:

- verifies a valid result shape as a basic safety gate;
- **independently calls `evaluate_once(...)` again**;
- therefore independently re-fetches GitHub evidence;
- independently repeats the objective checks;
- independently reruns the qualitative acceptance-criteria judgment;
- compares stable objective key and evidence digest;
- requires the validator's independently derived final outcome to equal the leader's outcome.

The format check cannot approve a result by itself. A leader saying `COMPLETED` is accepted only if the validator itself also derives `COMPLETED` from the meaningful evidence.

## Audit record

For each attempt OutcomeJudge stores:

- opportunity ID;
- attempt ID;
- outcome;
- evidence digest;
- grounded reason;
- compact objective audit string;
- decision timestamp.

The settlement contract separately stores the latest outcome/digest/reason/audit so the economic state and the evidence decision remain inspectable from either side of the two-contract system.
