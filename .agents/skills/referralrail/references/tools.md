# Tool mapping

| Tool | Normal caller | Required state and arguments | Permissionless | Moves funds | Expected readback |
|---|---|---|---|---|---|
| `referralrail_get_protocol` | anyone | none | yes | no | canonical binding |
| `referralrail_list_opportunities` | anyone | optional offset and limit | yes | no | finalized list |
| `referralrail_get_opportunity` | anyone | positive opportunity ID | yes | no | typed opportunity |
| `referralrail_get_judgment` | anyone | positive opportunity and attempt IDs | yes | no | finalized judge record or empty |
| `referralrail_get_accounting` | anyone | none | yes | no | conservation totals |
| `referralrail_get_available_actions` | anyone | ID and optional wallet | yes | no | role and deadline-aware actions |
| `referralrail_create_opportunity` | employer | all frozen terms and exact funding | no | locks funds | `OPEN` |
| `referralrail_create_referral` | unrelated referrer | `OPEN`, candidate address | no | no | `REFERRED` attribution |
| `referralrail_accept_referral` | nominated candidate | `REFERRED`, GitHub login | no | no | `ACCEPTED` |
| `referralrail_submit_work` | candidate | `ACCEPTED`, PR number | no | no | `JUDGING` and child message |
| `referralrail_retry_inconclusive` | candidate | valid `INCONCLUSIVE` cure window | no | no | `JUDGING` |
| `referralrail_resolve_judgment` | any actor | `JUDGING`, finalized attempt | yes | no | `PAID`, `REFUNDED`, or `INCONCLUSIVE` |
| `referralrail_settle_opportunity` | any actor | unreleased `PAID` or `REFUNDED` | yes | yes | `settlement_released` true |
| `referralrail_cancel_unreferred` | employer | `OPEN` | no | yes | `CANCELLED` |
| `referralrail_expire` | any actor | eligible referral or completion timeout | yes | yes | `EXPIRED` |
| `referralrail_recover` | any actor | judgment timeout or exhausted cure | yes | yes | `REFUNDED` |

Every write uses the SDK. It checks finalized state, waits for finalization, verifies execution, and performs finalized readback. A hash alone is never success.
