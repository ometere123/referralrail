# ReferralRail v2 architecture

Employer -> fully funded multi-position campaign
Referrer -> client-side referral link and candidate attribution
Candidate -> join and explicit acceptance
Evidence -> GITHUB_PR or universal PUBLIC_WEB
OutcomeJudgeV2 -> COMPLETED, NOT_COMPLETED or INCONCLUSIVE
Settlement -> candidate plus referrer payout, or employer refund
ReferralIdentityV2 -> optional persistent GitHub or X identity proof

There is no backend adjudicator, database, token, marketplace or chat layer.
