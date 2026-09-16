# @referralrail/sdk

Typed Node SDK for the canonical ReferralRail deployment on GenLayer Studio Next, chain 61997.

```sh
npm install @referralrail/sdk
```

```ts
import { ReferralRailClient } from "@referralrail/sdk";

const rail = new ReferralRailClient();
const protocol = await rail.getProtocolConfig();
const opportunities = await rail.listOpportunities();
const actions = await rail.getAvailableActions(3, { address: "0x..." });
```

Writes require a signer and always wait for decision, explicitly request finalization, verify successful execution, and read the finalized contract state back. Use `ReferralRailClient.fromPrivateKey(process.env.REFERRALRAIL_PRIVATE_KEY as `0x${string}`)` in a controlled Node process. Never pass keys to a tool or commit them.

`createOpportunity` requires all economic terms and enforces `candidatePayment + referralReward === payable value`. `submitWork` and `retryInconclusive` use discovered internal-message fee allocations. `settleOpportunity` uses separate external recipient allocations. `PAID` and `REFUNDED` are outcome states, not proof of released funds; inspect `settlement_released`.
