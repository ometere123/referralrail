import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const chain = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const need = (name) => process.env[name] || (() => { throw new Error(name + " is required"); })();
const make = (name) => createClient({ endpoint: rpc, chain, account: createAccount(need(name)) });
const employer = make("STUDIO_NEXT_EMPLOYER_PRIVATE_KEY");
const referrer = make("STUDIO_NEXT_REFERRER_PRIVATE_KEY");
const candidate = make("STUDIO_NEXT_CANDIDATE_PRIVATE_KEY");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Studio occasionally returns an HTML gateway page for a valid JSON-RPC request.
// Retry only that transient transport failure; the protocol endpoint remains canonical.
const realFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const response = await realFetch(...args);
    const body = await response.text();
    if (!body.trimStart().startsWith("<")) {
      return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
    }
    if (attempt === 7) return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
    await sleep(2500 * (attempt + 1));
  }
};

async function finalize(client, hash) {
  for (let i = 0; i < 180; i += 1) {
    const lifecycle = await client.advanced.getTransactionLifecycle({ hash });
    if (lifecycle.resolutionAction === "Finalize") { try { await client.finalizeTransaction({ txId: hash }); } catch {} }
    if (lifecycle.storedStatus === "Finalized" || lifecycle.projectedStatus === "Finalized") {
      const receipt = await client.waitForFinalization({ hash, retries: 30, interval: 2000, fullTransaction: true });
      if (!isSuccessful(receipt)) throw new Error(hash + " finalized unsuccessfully");
      return receipt;
    }
    await sleep(10000);
  }
  throw new Error(hash + " did not finalize");
}
async function write(client, functionName, args, value = 0n) {
  const quote = await client.estimateTransactionFeesForWrite({ account: client.account, address: manifest.rail.address, functionName, args, value, executionHeadroomBps: 12000, messageHeadroomBps: 12000 });
  const fees = { distribution: quote.distribution, feeValue: quote.feeValue, ...(quote.messageAllocations?.length ? { messageAllocations: quote.messageAllocations } : {}) };
  const hash = await client.writeContract({ account: client.account, address: manifest.rail.address, functionName, args, value, fees });
  const receipt = await finalize(client, hash);
  return { hash, receipt };
}
async function campaignByTitle(title) {
  const rows = await employer.readContract({ address: manifest.rail.address, functionName: "list_campaigns", args: [0, 50] });
  return (Array.isArray(rows) ? rows : Object.values(rows)).find((row) => row.title === title);
}
async function position(campaignId) {
  const rows = await employer.readContract({ address: manifest.rail.address, functionName: "list_positions", args: [campaignId, 0, 50] });
  return (Array.isArray(rows) ? rows : Object.values(rows))[0];
}
async function runCase({ title, allowedHost, evidenceUri, expectRefund }) {
  const reward = 100000000000000n;
  const create = await write(employer, "create_campaign", [title, "Fresh public HTTPS evidence verification for the isolated v2 deployment.", "The public evidence must describe the bounded protected-value fix and preserved gate-only authority.", "", "", "", 1, reward, reward, 3600, 7200, 86400, 1, "PUBLIC_WEB", allowedHost, false], reward * 2n);
  const campaign = await campaignByTitle(title);
  if (!campaign) throw new Error("campaign readback missing: " + title);
  const campaignId = Number(campaign.id);
  const join = await write(candidate, "join_via_referral", [campaignId, referrer.account.address]);
  const reserved = await position(campaignId);
  const accept = await write(candidate, "accept_referral", [campaignId, Number(reserved.position_id), ""]);
  const submit = await write(candidate, "submit_evidence", [campaignId, Number(reserved.position_id), evidenceUri]);
  const childHashes = Array.isArray(submit.receipt.triggered_transactions) ? submit.receipt.triggered_transactions : (submit.receipt.triggered_transactions ? [submit.receipt.triggered_transactions] : []);
  for (const childHash of childHashes) await finalize(employer, childHash);
  const judging = await position(campaignId);
  const judgment = await employer.readContract({ address: manifest.judge.address, functionName: "get_judgment", args: [campaignId, Number(reserved.position_id), 1] });
  const beforeResolve = await position(campaignId);
  const resolve = beforeResolve.state === "JUDGING" ? await write(employer, "resolve_judgment", [campaignId, Number(reserved.position_id), 1]) : null;
  const resolved = await position(campaignId);
  let settle = null;
  let close = null;
  let finalise = null;
  if (resolved.state === "COMPLETED") settle = await write(employer, "settle_position", [campaignId, Number(reserved.position_id)]);
  if (expectRefund) {
    close = await write(employer, "close_intake", [campaignId]);
    finalise = await write(employer, "finalise_campaign", [campaignId]);
  }
  const finalPosition = await position(campaignId);
  const finalCampaign = await employer.readContract({ address: manifest.rail.address, functionName: "get_campaign", args: [campaignId] });
  const accounting = await employer.readContract({ address: manifest.rail.address, functionName: "get_campaign_accounting", args: [campaignId] });
  if (expectRefund && finalCampaign.state !== "REFUNDED") throw new Error("negative case did not refund");
  if (!expectRefund && (finalPosition.state !== "PAID" || !finalPosition.candidate_paid || !finalPosition.referrer_paid || !finalPosition.settlement_released)) throw new Error("success case did not prove settlement");
  return { campaignId, positionId: Number(reserved.position_id), allowedHost, evidenceUri, transactions: { create: create.hash, join: join.hash, accept: accept.hash, submit: submit.hash, resolve: resolve?.hash || null, settle: settle?.hash || null, close: close?.hash || null, finalise: finalise?.hash || null }, judgment, judging, resolved, finalPosition, finalCampaign, accounting };
}
const proof = "https://raw.githubusercontent.com/ometere123/evifix/referralrail-v2-live-success-1789729305/docs/referralrail-public-proof-6.md";
const success = await runCase({ title: "Fresh v2 redeploy public success " + Date.now(), allowedHost: "raw.githubusercontent.com", evidenceUri: proof, expectRefund: false });
const negative = await runCase({ title: "Fresh v2 redeploy public negative " + Date.now(), allowedHost: "raw.githubusercontent.com", evidenceUri: "https://example.com/", expectRefund: true });
const out = { schema: "referralrail-v2-fresh-deployment-evidence-1", generatedAt: new Date().toISOString(), chainId: 61997, rpc, contracts: manifest, success, negative, notes: ["Fresh evidence after v2-only redeployment.", "PUBLIC_WEB challenge requirement was disabled for these verification campaigns to avoid requiring a new off-chain identity or challenge publication.", "All writes used estimateTransactionFeesForWrite and explicit finalization before readback."] };
writeFileSync("deployment/v2-live-fresh-public.json", JSON.stringify(out, null, 2, (_, value) => typeof value === "bigint" ? value.toString() : value) + "\n");
console.log(JSON.stringify({ success: { campaignId: success.campaignId, position: success.finalPosition.state, settlement: success.finalPosition.settlement_released }, negative: { campaignId: negative.campaignId, campaign: negative.finalCampaign.state, position: negative.finalPosition.state } }, null, 2));
