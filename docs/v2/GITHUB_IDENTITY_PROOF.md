# GitHub identity proof

Acceptance creates a challenge containing campaign id, position id, candidate address, and a digest of the bound campaign identity. The candidate must publish that exact challenge from the bound GitHub login on the submitted pull request discussion.

The judge requires the frozen repository, candidate login, base branch, freshness window, and ownership proof. A pull request from another account or created before acceptance is rejected even if its code looks useful.
