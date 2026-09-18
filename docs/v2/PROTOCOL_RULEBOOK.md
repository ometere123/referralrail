# ReferralRail v2 protocol rulebook

ReferralRail is a backend-free multi-position referral campaign escrow protocol.

Employer creates and exactly funds a campaign. A referrer creates or shares a client-side referral link. A candidate joins, explicitly accepts, submits evidence, and is evaluated by OutcomeJudgeV2. COMPLETED creates a pending success and later PAID releases candidate and referrer rewards. NOT_COMPLETED releases capacity. INCONCLUSIVE permits bounded retry. Unused backing is refunded after intake closes and unresolved positions are terminal.

Evidence modes:

- GITHUB_PR freezes owner, repository, base branch, identity handle, acceptance time, pull request, branch, author, freshness, challenge, bounded files and patches.
- PUBLIC_WEB accepts any public HTTPS URL that GenLayer can fetch. An optional allowed_host is an exact submitted-host restriction. X, Medium, DEV and similar services are examples, not protocol modes.

PUBLIC_WEB does not require GitHub or X identity. Host matching is exact. The current runtime does not expose the final redirect destination, so restricted campaigns enforce the submitted URL host and do not claim final-origin verification.

A wallet may accept at most one position in a campaign. Inconclusive retry stays on the same position and is bounded by MAX_ATTEMPTS.

Funding is exact: initial_funding equals max_positions times candidate_reward plus referral_reward. Accounting must conserve initial_funding as paid plus refunded plus locked.
