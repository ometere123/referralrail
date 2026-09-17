import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const campaignId = Number(process.env.V2_CAMPAIGN_ID || 2);
const positionId = Number(process.env.V2_POSITION_ID || 1);
const attemptId = Number(process.env.V2_ATTEMPT_ID || 1);
const base = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const client = createClient({ endpoint: rpc, chain: base, account: createAccount(process.env.STUDIO_NEXT_EMPLOYER_PRIVATE_KEY) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function wait(hash) {
  for (let i = 0; i < 60; i += 1) {
    const lifecycle = await client.advanced.getTransactionLifecycle({ hash });
    if (lifecycle.resolutionAction === "Finalize") { try { await client.finalizeTransaction({ txId: hash }); } catch {} }
    if (lifecycle.storedStatus === "Finalized" || lifecycle.projectedStatus === "Finalized") return lifecycle;
    await sleep(10000);
  }
  throw new Error(`timeout ${hash}`);
}
async function write(method, args) {
  const quote = await client.estimateTransactionFeesForWrite({ account: client.account, address: manifest.rail.address, functionName: method, args, value: 0n });
  const hash = await client.writeContract({ account: client.account, address: manifest.rail.address, functionName: method, args, value: 0n, fees: { distribution: quote.distribution, feeValue: quote.feeValue, messageAllocations: quote.messageAllocations } });
  return { hash, lifecycle: await wait(hash) };
}
const judgment = await client.readContract({ address: manifest.judge.address, functionName: "get_judgment", args: [campaignId, positionId, attemptId] });
if (String(judgment.outcome) !== "COMPLETED") throw new Error(`expected COMPLETED judgment, got ${judgment.outcome}`);
const resolved = await write("resolve_judgment", [campaignId, positionId, attemptId]);
const completed = await client.readContract({ address: manifest.rail.address, functionName: "get_position", args: [campaignId, positionId] });
if (String(completed.state) !== "COMPLETED") throw new Error(`expected COMPLETED position, got ${completed.state}`);
const settled = await write("settle_position", [campaignId, positionId]);
const paid = await client.readContract({ address: manifest.rail.address, functionName: "get_position", args: [campaignId, positionId] });
const campaign = await client.readContract({ address: manifest.rail.address, functionName: "get_campaign", args: [campaignId] });
const accounting = await client.readContract({ address: manifest.rail.address, functionName: "get_campaign_accounting", args: [campaignId] });
if (String(paid.state) !== "PAID" || !paid.candidate_paid || !paid.referrer_paid || !paid.settlement_released) throw new Error("finalized settlement readback did not prove both payout legs");
const output = { campaignId, positionId, attemptId, judgment, resolved, completed, settled, paid, campaign, accounting };
writeFileSync(process.env.V2_RESOLVE_OUTPUT || "deployment/v2-live-success.json", JSON.stringify(output, null, 2, (key, value) => typeof value === "bigint" ? value.toString() : value) + "\n");
console.log(JSON.stringify(output, null, 2, (key, value) => typeof value === "bigint" ? value.toString() : value));
