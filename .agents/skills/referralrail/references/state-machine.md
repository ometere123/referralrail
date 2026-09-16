# State machine

`OPEN`: employer-funded, no referral. A non-employer and non-candidate referrer may call `create_referral` before the referral deadline. The employer may call `cancel_unreferred`. After the referral deadline, anyone may call `expire`.

`REFERRED`: a referrer is locked and the nominated candidate may call `accept_referral` before the referral deadline. After that deadline, `expire` is eligible.

`ACCEPTED`: the candidate identity is bound. Only the candidate may call `submit_work` before the completion deadline. After that deadline, `expire` is eligible.

`JUDGING`: a submitted PR has caused a finalized message to OutcomeJudge. A finalized judge record can be materialized by `resolve_judgment`. `recover` is eligible only when `judgment_timeout_at` has passed.

`INCONCLUSIVE`: the judge could not safely reach a substantive result. The candidate may retry while attempts remain and `retry_deadline` has not passed. `recover` is eligible when attempts are exhausted or the cure deadline has passed.

`PAID` and `REFUNDED`: the outcome is decided, but these are not proof of a value transfer. A separate finalized `settle_opportunity` must set `closed_at` and `settlement_released`.

`EXPIRED`: a permitted pre-judgment timeout refunded the employer. `CANCELLED`: the employer cancelled an unreferred open opportunity. All listed terminal states reject resubmission.
