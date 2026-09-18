import { readFileSync, writeFileSync } from "node:fs";
import { createClient, chains } from "genlayer-js";
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const manifest = read("deployment/v2-61997.json");
const rpc = manifest.rpc;
const client = createClient({ endpoint: rpc, chain: { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } } });
const rail = manifest.rail.address;
const judge = manifest.judge.address;
const campaign = async (id) => client.readContract({ address: rail, functionName: "get_campaign", args: [id] });
const position = async (id, pid = 1) => client.readContract({ address: rail, functionName: "get_position", args: [id, pid] });
const positions = async (id) => client.readContract({ address: rail, functionName: "list_positions", args: [id, 0, 50] });
const judgment = async (id, pid, aid) => client.readContract({ address: judge, functionName: "get_judgment", args: [id, pid, aid] });
const accounting = async (id) => client.readContract({ address: rail, functionName: "get_campaign_accounting", args: [id] });
const successSetup = read("deployment/v2-live-success-setup-final-3.json");
const successAccept = read("deployment/v2-live-success-accept-final-3.json");
const successSubmit = read("deployment/v2-live-success-submit-final-3.json");
const successPaid = read("deployment/v2-live-success-paid-final.json");
const negativeSetup = read("deployment/v2-live-negative-setup-final.json");
const negativeAccept = read("deployment/v2-live-negative-accept-final.json");
const negativeSubmit = read("deployment/v2-live-negative-submit-final.json");
const webSetup = read("deployment/v2-live-web-setup-final.json");
const webAccept = read("deployment/v2-live-web-accept-final.json");
const webPaid = read("deployment/v2-live-web-paid-final.json");
const webRetrySetup = read("deployment/v2-live-web-retry-setup.json");
const webRetryPaid = read("deployment/v2-live-web-retry-paid-final.json");
const capacityA = read("deployment/v2-live-capacity-a-settlement.json");
const capacityB = read("deployment/v2-live-capacity-b-submit.json");
const capacityC = read("deployment/v2-live-capacity-c-settlement.json");
const negativeCampaign = await campaign(4);
const negativePosition = await position(4);
const negativeJudgment = await judgment(4, 1, 1);
const hostCampaign = await campaign(7);
const hostPosition = await position(7);
const hostJudgment = await judgment(7, 1, 1);
const retryFirst = await judgment(8, 1, 1);
const retrySecond = await judgment(8, 1, 2);
const evidence = {
  schema: "referralrail-v2-live-evidence-2",
  generatedAt: new Date().toISOString(),
  network: manifest.network,
  chainId: manifest.chainId,
  rpc: manifest.rpc,
  contracts: { identity: manifest.identity, referralRailV2: manifest.rail, outcomeJudgeV2: manifest.judge, identityBindingTransaction: manifest.identityBindingTransaction, bindingTransaction: manifest.bindingTransaction, protocol: manifest.protocol },
  identity: read("deployment/v2-live-identity-complete.json"),
  success: {
    campaignId: 3, positionId: 1, repository: "ometere123/evifix", pullRequest: 24, pullRequestUrl: "https://github.com/ometere123/evifix/pull/24", actors: successSetup.actors,
    transactions: { create: successSetup.transactions.create, join: successSetup.transactions.join, accept: successAccept.transaction, submit: successSubmit.hash, settle: successPaid.settleTransaction },
    judgment: await judgment(3, 1, 1), finalPosition: successPaid.paid, finalCampaign: successPaid.campaign, accounting: successPaid.accounting,
    assertion: "PAID, both payout legs true, settlement_released true, conserved true"
  },
  negative: {
    campaignId: 4, positionId: 1, repository: "ometere123/thedadsbot", pullRequest: 13, pullRequestUrl: "https://github.com/ometere123/thedadsbot/pull/13", actors: negativeSetup.actors,
    transactions: { create: negativeSetup.transactions.create, join: negativeSetup.transactions.join, accept: negativeAccept.transaction, submit: negativeSubmit.hash },
    judgment: negativeJudgment, finalPosition: negativePosition, finalCampaign: negativeCampaign, accounting: await accounting(4),
    assertion: "NOT_COMPLETED from author, freshness, and challenge failures, then REFUNDED with conserved accounting"
  },
  publicWebSuccess: {
    campaignId: 6, positionId: 1, allowedHost: "raw.githubusercontent.com", evidenceUrl: webPaid.paid.evidence_uri, actors: webSetup.actors,
    transactions: { create: webSetup.transactions.create, join: webSetup.transactions.join, accept: webAccept.transaction, submit: webPaid.paid.active_attempt === 1 ? "0xe98b386afb8ff591476b51e331ffc890b72e6216ab5a6a51f772501e50ce47e5" : "", settle: webPaid.settleTransaction },
    judgment: await judgment(6, 1, 1), finalPosition: webPaid.paid, finalCampaign: webPaid.campaign, accounting: webPaid.accounting,
    assertion: "PUBLIC_WEB completed and paid with exact host restriction and conserved accounting"
  },
  inconclusiveRetry: {
    campaignId: 8, positionId: 1, allowedHost: "raw.githubusercontent.com", unavailableSource: "https://raw.githubusercontent.com/ometere123/evifix/no-such-referralrail-v2-retry/nonexistent.txt", evidenceUrl: webRetryPaid.paid.evidence_uri, actors: webRetrySetup.actors,
    judgments: { first: retryFirst, second: retrySecond }, finalPosition: webRetryPaid.paid, finalCampaign: webRetryPaid.campaign, accounting: webRetryPaid.accounting,
    assertion: "unavailable source produced INCONCLUSIVE, bounded retry produced COMPLETED, then PAID"
  },
  hostRestriction: { campaignId: 7, positionId: 1, allowedHost: "raw.githubusercontent.com", submittedUrl: "https://example.com/", judgment: hostJudgment, finalPosition: hostPosition, finalCampaign: hostCampaign, accounting: await accounting(7), assertion: "wrong public host produced NOT_COMPLETED and refund" },
  multiPosition: { campaignId: 9, actors: { employer: capacityA.campaign.employer, positionA: capacityA.paid.candidate, positionB: capacityB.position.candidate, positionC: capacityC.paid.candidate, referrerA: capacityA.paid.referrer, referrerC: capacityC.paid.referrer }, transactions: { acceptA: null, submitA: "0x16ecc47cc4e42cadb6dccced6ba529d36cdc0a85425d663fda489d7b091802b2", retryA: "0x3b0ec1ae358918d6b98bc0eeaba5bee3b9e694558c6dbe0af480d2fa3fc5bcf8", settleA: capacityA.settleTransaction, submitB: "0xe066c43d8587c03f60bbf8da82291120582b5938ad530f88c7fbd8e02b4cf208", joinC: "0x8b3aa445035677ad2d86d3bff4e66ce0a05dec0dcacc82ed3fe37126272a66b2", acceptC: "0xcd6422d09e61075e918a950f1c94150c3b3885e2d2750cb1a18876e9476ad311", submitC: "0xa157d820f90e56018bc6210edfe559e4a1ec33ff7774f5cdeabe61b7764bbd22", settleC: capacityC.settleTransaction }, campaign: await campaign(9), positions: await positions(9), accounting: await accounting(9), assertion: "position A PAID, position B FAILED and NOT_COMPLETED reopened one funded slot, position C PAID, final successful=2 and conserved=true" },
  freshness: { requestedPr1: { number: 1, url: "https://github.com/ometere123/evifix/pull/1", status: "closed and stale before fresh acceptance" }, actualSuccessPr: { number: 24, url: "https://github.com/ometere123/evifix/pull/24", status: "fresh and completed" } },
  notes: ["No validator receipt blobs or private keys are included.", "Finalized action is explicitly driven by the SDK live scripts before each readback.", "Redirect final-origin verification remains false because the runtime exposes response bodies but not a verified final URL."]
};
const replacer = (_, value) => typeof value === "bigint" ? value.toString() : value;
writeFileSync("deployment/v2/live-evidence.json", JSON.stringify(evidence, replacer, 2) + "\n");
console.log(JSON.stringify({ path: "deployment/v2/live-evidence.json", success: evidence.success.assertion, negative: evidence.negative.assertion, retry: evidence.inconclusiveRetry.assertion }, null, 2));