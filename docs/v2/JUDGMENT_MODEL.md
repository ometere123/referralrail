# Judgment model

OutcomeJudgeV2 independently fetches the pull request, issue comments, and bounded file patches from `api.github.com`. It checks repository, author, base branch, acceptance freshness, and the exact ownership challenge before asking GenLayer validators to assess substantive work.

The closed outcomes are `COMPLETED`, `NOT_COMPLETED`, and `INCONCLUSIVE`. Fetch failures and unsafe parsing remain inconclusive. ReferralRail never interprets a client-side opinion as a judgment.
