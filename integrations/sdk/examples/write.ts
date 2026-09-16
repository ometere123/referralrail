import { ReferralRailClient } from "../src/index.js";

const rail = ReferralRailClient.fromPrivateKey(process.env.REFERRALRAIL_PRIVATE_KEY as `0x${string}`);
const result = await rail.submitWork(3, 1);
console.log({ txHash: result.txHash, finalized: result.finalized, state: result.stateAfter?.state, settlementReleased: result.settlementReleased });
