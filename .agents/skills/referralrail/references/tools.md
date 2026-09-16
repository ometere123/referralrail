# Tools

Use `referralrail_get_opportunity`, `referralrail_get_protocol`, `referralrail_get_accounting`, `referralrail_get_judgment`, and `referralrail_get_available_actions` for reads. Use `referralrail_create_opportunity` as employer, `referralrail_create_referral` as an unrelated referrer, `referralrail_accept_referral` and `referralrail_submit_work` as the candidate, `referralrail_retry_inconclusive` for a valid bounded retry, `referralrail_resolve_judgment` after a finalized judge record, and `referralrail_settle_opportunity` after `PAID` or `REFUNDED`. `referralrail_cancel_unreferred`, `referralrail_expire`, and `referralrail_recover` are used only when the finalized state and contract deadlines permit them.

Every write requires current state, the proper role where restricted, finalization, successful execution, and readback. Settlement is the only listed action that releases funds.
