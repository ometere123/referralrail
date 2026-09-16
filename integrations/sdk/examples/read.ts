import { ReferralRailClient } from "../src/index.js";

const rail = new ReferralRailClient();
console.log(await rail.getProtocolConfig());
console.log(await rail.listOpportunities());
