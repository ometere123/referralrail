import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const rail = manifest.rail.address;
const base = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const need = (n) => process.env[n] || (() => { throw new Error(`${n} is required`); })();
const make = (a) => createClient({ endpoint: rpc, chain: base, account: a });
const employer = make(createAccount(need("STUDIO_NEXT_EMPLOYER_PRIVATE_KEY")));
const referrer = make(createAccount(need("STUDIO_NEXT_REFERRER_PRIVATE_KEY")));
const candidate = make(createAccount(need("STUDIO_NEXT_CANDIDATE_PRIVATE_KEY")));
const candidate2Account = createAccount(`0x${"12".repeat(32)}`);
const candidate2 = make(candidate2Account);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function wait(client, hash) {
  for (let i = 0; i < 180; i += 1) {
    const l = await client.advanced.getTransactionLifecycle({ hash });
    if (l.resolutionAction === "Finalize") { try { await client.finalizeTransaction({ txId: hash }); } catch {} }
    if (l.storedStatus === "Finalized" || l.projectedStatus === "Finalized") {
      const r = await client.waitForFinalization({ hash, retries: 30, interval: 2000, fullTransaction: true });
      if (!isSuccessful(r)) throw new Error(`${hash} finalized unsuccessfully`);
      return r;
    }
    await sleep(10000);
  }
  throw new Error(`timeout ${hash}`);
}
async function write(client, method, args, value = 0n) {
  const q = await client.estimateTransactionFees({ leaderTimeunitsAllocation: 100, validatorTimeunitsAllocation: 200, rotations: [3] });
  const hash = await client.writeContract({ account: client.account, address: rail, functionName: method, args, value, fees: { distribution: q.distribution, feeValue: q.feeValue } });
  return { hash, receipt: await wait(client, hash) };
}
const reward = 200_000_000_000_000n;
const title = `Live v2 final multi ${Date.now()}`;
const created = await write(employer, "create_campaign", [title, "Final multi-position verification with fresh GitHub evidence and exact escrow settlement.", "The pull request must be authored by the bound GitHub identity and contain substantive work.", "ometere123", "evifix", "main", 2, reward, reward, 900, 1800, 7200, 2], reward * 4n);
const campaigns = await employer.readContract({ address: rail, functionName: "list_campaigns", args: [0, 50] });
const rows = Array.isArray(campaigns) ? campaigns : Object.values(campaigns);
const campaign = rows.find((x) => x.title === title);
const campaignId = Number(campaign.id);
const reserve1 = await write(referrer, "create_referral", [campaignId, candidate.account.address]);
const reserve2 = await write(candidate, "create_referral", [campaignId, candidate2Account.address]);
const positions = await employer.readContract({ address: rail, functionName: "list_positions", args: [campaignId, 0, 50] });
const p = Array.isArray(positions) ? positions : Object.values(positions);
const accept1 = await write(candidate, "accept_referral", [campaignId, Number(p[0].position_id), "ometere123"]);
const accept2 = await write(candidate2, "accept_referral", [campaignId, Number(p[1].position_id), "dependabot"]);
const accepted = await employer.readContract({ address: rail, functionName: "list_positions", args: [campaignId, 0, 50] });
const out = { rail, judge: manifest.judge.address, campaignId, campaign, actors: { employer: employer.account.address, referrer: referrer.account.address, candidate: candidate.account.address, candidate2: candidate2Account.address }, transactions: { create: created.hash, reserve1: reserve1.hash, reserve2: reserve2.hash, accept1: accept1.hash, accept2: accept2.hash }, positions: accepted };
writeFileSync(process.env.V2_SETUP_OUTPUT || "deployment/v2-live-final-setup.json", JSON.stringify(out, null, 2, (_, v) => typeof v === "bigint" ? v.toString() : v) + "\n");
console.log(JSON.stringify(out, null, 2, (_, v) => typeof v === "bigint" ? v.toString() : v));
