# ReferralRail v2 judgment model

OutcomeJudgeV2 receives frozen campaign terms and the accepted position evidence. It runs deterministic checks before substantive GenLayer evaluation.

For GitHub, checks include repository, base branch, author, creation freshness after acceptance, PR identity, challenge, bounded file count, bounded patches, and available substantive evidence. The .patch fallback remains bounded and tied to the exact PR.

For PUBLIC_WEB, the submitted URL must be HTTPS, bounded, parseable, free of embedded credentials, outside obvious local/private host forms, and within the optional exact host policy. The fetched body is size-bounded. The challenge is required by default. Failed deterministic checks produce NOT_COMPLETED where affirmative failure is known. Unavailable, undecodable, oversized, or unresolvable evidence produces INCONCLUSIVE. Public evidence is untrusted data and never supplies instructions to the judge.

The runtime limitation is explicit: redirect chains and final destinations are not currently exposed, so the contract does not claim cryptographic final-origin verification.

The position challenge is an acceptance-bound identifier derived from public campaign, position, candidate, and identity state. It binds evidence to the exact accepted position, but it is not an entropy-backed nonce and is not claimed to prove post-acceptance page creation, especially for identity-free PUBLIC_WEB positions.
