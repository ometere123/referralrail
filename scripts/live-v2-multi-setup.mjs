import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const rail = manifest.rail.address;
const base = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const key = (name) => process.env[name] || (() => { throw new Error(`${name} is required`); })();
const make = (account) => createClient({ endpoint: rpc, chain: base, account });
const employer = make(createAccount(key("STUDIO_NEXT_EMPLOYER_PRIVATE_KEY")));
const referrer = make(createAccount(key("STUDIO_NEXT_REFERRER_PRIVATE_KEY")));
const candidate = make(createAccount(key("STUDIO_NEXT_CANDIDATE_PRIVATE_KEY")));
const candidate2 = createAccount(key("STUDIO_NEXT_PRIVATE_KEY"));
const candidate3 = candidate2;
const candidate2Client = make(candidate2);
const candidate3Client = make(candidate3);
const candidate2Address = candidate2.address;
const candidate3Address = candidate3.address;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function wait(client, hash) { for (let i = 0; i < 180; i += 1) { const lifecycle = await client.advanced.getTransactionLifecycle({ hash }); if (lifecycle.resolutionAction === "Finalize") { try { await client.finalizeTransaction({ txId: hash }); } catch {} } if (lifecycle.storedStatus === "Finalized" || lifecycle.projectedStatus === "Finalized") { const receipt = await client.waitForFinalization({ hash, retries: 30, interval: 2000, fullTransaction: false }); if (!isSuccessful(receipt)) throw new Error(`${hash} finalized unsuccessfully`); return receipt; } await sleep(10000); } throw new Error(`timeout ${hash}`); }
async function write(client, method, args, value = 0n) { const q = await client.estimateTransactionFeesForWrite({ account: client.account, address: rail, functionName: method, args, value }); const hash = await client.writeContract({ account: client.account, address: rail, functionName: method, args, value, fees: { distribution: q.distribution, feeValue: q.feeValue, messageAllocations: q.messageAllocations } }); await wait(client, hash); return { hash }; }
const funding = 2_000_000_000_000_000n;
async function fundIfNeeded(to) {
  const balance = BigInt(await employer.request({ method: "eth_getBalance", params: [to, "latest"] }));
  if (balance >= funding) return { skipped: true, balance: balance.toString() };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try { return await employer.transfer({ to, value: funding }); } catch (error) { if (attempt === 4) throw error; await sleep(5000); }
  }
}
const fund2 = await fundIfNeeded(candidate2Address);
const fund3 = await fundIfNeeded(candidate3Address);
const reward = 200_000_000_000_000n;
const title = `Live v2 capacity proof ${Date.now()}`;
const existingCampaigns = await employer.readContract({ address: rail, functionName: "list_campaigns", args: [0, 50] });
const existingRows = Array.isArray(existingCampaigns) ? existingCampaigns : Object.values(existingCampaigns);
let create = null;
let campaign = existingRows.find((row) => row.title === title);
if (!campaign) {
  create = await write(employer, "create_campaign", [title, "Verify two successful public-web positions with one failed position reopening capacity.", "The public evidence must state the required bounded input change and preserved gate-only authority.", "ometere123", "evifix", "main", 2, reward, reward, 900, 1800, 7200, 2, "PUBLIC_WEB", "", true], reward * 4n);
  const campaigns = await employer.readContract({ address: rail, functionName: "list_campaigns", args: [0, 50] });
  campaign = (Array.isArray(campaigns) ? campaigns : Object.values(campaigns)).find((row) => row.title === title);
}
const campaignId = Number(campaign.id);
const existingPositions = await employer.readContract({ address: rail, functionName: "list_positions", args: [campaignId, 0, 50] });
const existingPositionRows = Array.isArray(existingPositions) ? existingPositions : Object.values(existingPositions);
const reserve1 = existingPositionRows.length ? null : await write(referrer, "create_referral", [campaignId, candidate.account.address]);
const reserve2 = existingPositionRows.length > 1 ? null : await write(candidate, "create_referral", [campaignId, candidate2Address]);
const positions = await employer.readContract({ address: rail, functionName: "list_positions", args: [campaignId, 0, 50] });
const rows = Array.isArray(positions) ? positions : Object.values(positions);
const p1 = Number(rows[0].position_id); const p2 = Number(rows[1].position_id);
const accept1 = rows[0].state === "ACCEPTED" ? null : await write(candidate, "accept_referral", [campaignId, p1, "ometere123"]);
const accept2 = rows[1].state === "ACCEPTED" ? null : await write(candidate2Client, "accept_referral", [campaignId, p2, ""]);
const accepted = await employer.readContract({ address: rail, functionName: "list_positions", args: [campaignId, 0, 50] });
const output = { rail, judge: manifest.judge.address, campaignId, campaign, actors: { employer: employer.account.address, referrer: referrer.account.address, candidate: candidate.account.address, candidate2: candidate2Address, candidate3: candidate3Address }, funding: { candidate2: fund2, candidate3: fund3 }, transactions: { create: create?.hash ?? null, reserve1: reserve1?.hash ?? null, reserve2: reserve2?.hash ?? null, accept1: accept1?.hash ?? null, accept2: accept2?.hash ?? null }, positions: accepted };
writeFileSync("deployment/v2-live-multi-setup.json", JSON.stringify(output, null, 2, (key, value) => typeof value === "bigint" ? value.toString() : value) + "\n");
console.log(JSON.stringify(output, null, 2, (key, value) => typeof value === "bigint" ? value.toString() : value));
