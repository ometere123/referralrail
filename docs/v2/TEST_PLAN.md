# v2 test plan

Static tests parse both v1 and v2 contracts and protect the frozen v1 files. Model tests cover two-slot unused refunds, success plus failure plus replacement, all-success, all-failure, completed capacity, double settlement, and early finalisation.

Contract lint and validation cover both v2 contracts. SDK tests cover typed normalization, chain locking, fee method selection, external payout allocation, finalisation, and post-write checks. MCP tests cover read-only defaults, named v2 tools, write gating, and STDIO. The frontend build is the route and type safety gate.
