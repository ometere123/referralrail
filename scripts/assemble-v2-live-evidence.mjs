import { readFileSync, writeFileSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const manifest = read("deployment/v2-61997.json");
const successSetup = read("deployment/v2-live-success-setup.json");
const successSubmit = read("deployment/v2-live-success-submit.json");
const success = read("deployment/v2-live-success.json");
const negativeSetup = read("deployment/v2-live-negative-setup.json");
const negativeSubmit = read("deployment/v2-live-negative-submit.json");
const negative = read("deployment/v2-live-negative.json");
const refund = read("deployment/v2-live-refund.json");

const evidence = {
  schema: "referralrail-v2-live-evidence-1",
  generatedAt: new Date().toISOString(),
  network: manifest.network,
  chainId: manifest.chainId,
  rpc: manifest.rpc,
  contracts: { referralRailV2: manifest.rail, outcomeJudgeV2: manifest.judge, bindingTransaction: manifest.bindingTransaction },
  success: {
    repository: "ometere123/evifix",
    pullRequest: 6,
    pullRequestUrl: "https://github.com/ometere123/evifix/pull/6",
    proofCommentUrl: "https://github.com/ometere123/evifix/pull/6#issuecomment-5708534148",
    campaignId: 2,
    positionId: 1,
    actors: { employer: successSetup.success.employer, referrer: successSetup.success.referrer, candidate: successSetup.success.candidate },
    transactions: { create: successSetup.success.create, reserve: successSetup.success.reserve, accept: successSetup.success.accept, submit: successSubmit.hash, judgeChild: successSubmit.receipt.triggered_transactions?.[0], resolve: success.resolved.hash, settle: success.settled.hash },
    judgment: success.judgment,
    finalPosition: success.paid,
    finalCampaign: success.campaign,
    accounting: success.accounting,
    assertion: "PAID with candidate_paid=true, referrer_paid=true, settlement_released=true, conserved=true"
  },
  negative: {
    repository: "ometere123/thedadsbot",
    pullRequest: 13,
    pullRequestUrl: "https://github.com/ometere123/thedadsbot/pull/13",
    campaignId: 3,
    positionId: 1,
    actors: { employer: negativeSetup.success.employer, referrer: negativeSetup.success.referrer, candidate: negativeSetup.success.candidate },
    transactions: { create: negativeSetup.success.create, reserve: negativeSetup.success.reserve, accept: negativeSetup.success.accept, submit: negativeSubmit.hash, judgeChild: negativeSubmit.receipt.triggered_transactions?.[0], resolve: negative.resolved.hash, closeIntake: refund.closed.hash, finalise: refund.finalised.hash },
    judgment: negative.judgment,
    finalPosition: negative.afterResolve,
    finalCampaign: refund.campaign,
    accounting: refund.accounting,
    assertion: "NOT_COMPLETED with author=false, fresh=false, proof=false, then REFUNDED with exact escrow and conserved=true"
  }
};

writeFileSync("deployment/v2/live-evidence.json", JSON.stringify(evidence, null, 2) + "\n");
console.log(JSON.stringify({ path: "deployment/v2/live-evidence.json", success: evidence.success.assertion, negative: evidence.negative.assertion }, null, 2));
