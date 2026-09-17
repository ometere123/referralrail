import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const base = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const key = (name) => process.env[name] || (() => { throw new Error(name + " is required"); })();
const make = (name) => createClient({ endpoint: rpc, chain: base, account: createAccount(key(name)) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
async function write(client, method, args, value = 0n) {
  const quote = await client.estimateTransactionFeesForWrite({ account: client.account, address: manifest.rail.address, functionName: method, args, value });
  const hash = await client.writeContract({ account: client.account, address: manifest.rail.address, functionName: method, args, value, fees: { distribution: quote.distribution, feeValue: quote.feeValue, messageAllocations: quote.messageAllocations } });
  await finalize(client, hash);
  return hash;
}
const employer = make("STUDIO_NEXT_EMPLOYER_PRIVATE_KEY");
const referrer = make("STUDIO_NEXT_REFERRER_PRIVATE_KEY");
const candidate = make("STUDIO_NEXT_CANDIDATE_PRIVATE_KEY");
const reward = 100000000000000n;
const title = "Fresh v2 referral-link lifecycle " + Date.now();
const createArgs = [title, "Complete the requested public work and submit verifiable evidence before the frozen deadline.", "The candidate must provide evidence that materially satisfies the frozen campaign requirements.", "ometere123", "evifix", "main", 1, reward, reward, 3600, 7200, 86400, 1, "GITHUB_PR", "", true];
const create = await write(employer, "create_campaign", createArgs, reward * 2n);
const campaigns = await employer.readContract({ address: manifest.rail.address, functionName: "list_campaigns", args: [0, 50] });
const rows = Array.isArray(campaigns) ? campaigns : Object.values(campaigns);
const campaign = rows.find((row) => row.title === title);
if (!campaign) throw new Error("campaign readback missing");
const campaignId = Number(campaign.id);
const join = await write(candidate, "join_via_referral", [campaignId, referrer.account.address]);
const positions = await employer.readContract({ address: manifest.rail.address, functionName: "list_positions", args: [campaignId, 0, 50] });
const position = (Array.isArray(positions) ? positions : Object.values(positions))[0];
if (!position || position.candidate.toLowerCase() !== candidate.account.address.toLowerCase() || position.referrer.toLowerCase() !== referrer.account.address.toLowerCase() || position.state !== "RESERVED") throw new Error("referral-link attribution readback mismatch");
const output = { chainId: 61997, identity: manifest.identity.address, rail: manifest.rail.address, judge: manifest.judge.address, campaignId, transactions: { create, join }, actors: { employer: employer.account.address, referrer: referrer.account.address, candidate: candidate.account.address }, campaign, position };
writeFileSync(process.env.V2_LINK_SETUP_OUTPUT || "deployment/v2-live-link-setup.json", JSON.stringify(output, null, 2, (_, value) => typeof value === "bigint" ? value.toString() : value) + "\n");
console.log(JSON.stringify(output, null, 2, (_, value) => typeof value === "bigint" ? value.toString() : value));


