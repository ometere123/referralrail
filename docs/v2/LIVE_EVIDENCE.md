# v2 live evidence

The authoritative current v2 evidence is `deployment/v2/live-evidence.json`. It is generated from finalized live outputs on chain 61997 and includes deployment, identity, GitHub success, negative, PUBLIC_WEB success, host restriction, inconclusive retry, multi-position capacity, and conservation readbacks.

The multi-position section is campaign 9. It proves position A reached `PAID`, position B reached `FAILED` with `NOT_COMPLETED`, the failed position reopened one funded slot, and position C reached `PAID`. The final campaign reports `successful=2`, `failed=1`, `paid_total=800000000000000`, `locked_total=0`, and `conserved=true`.

The general `deployment/live-evidence.json` path is an explicit pointer only. Previous-generation evidence is retained under `deployment/v2/history/`. No current v2 evidence is presented as v1 evidence.