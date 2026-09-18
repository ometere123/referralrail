import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const key = process.env.STUDIO_NEXT_CANDIDATE_PRIVATE_KEY;
if (!key) throw new Error("STUDIO_NEXT_CANDIDATE_PRIVATE_KEY is required");
const chain = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const client = createClient({ endpoint: rpc, chain, account: createAccount(key) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function finalize(hash) {
  for (let i = 0; i < 180; i += 1) {
    const lifecycle = await client.advanced.getTransactionLifecycle({ hash });
    if (lifecycle.resolutionAction === "Finalize") { try { await client.finalizeTransaction({ txId: hash }); } catch {} }
    if (lifecycle.storedStatus === "Finalized" || lifecycle.projectedStatus === "Finalized") {
      const receipt = await client.waitForFinalization({ hash, retries: 30, interval: 2000, fullTransaction: true });
      if (!isSuccessful(receipt)) throw new Error(`${hash} finalized unsuccessfully`);
      return receipt;
    }
    await sleep(10000);
  }
  throw new Error(`${hash} did not finalize`);
}

async function write(address, functionName, args) {
  const quote = await client.estimateTransactionFeesForWrite({ account: client.account, address, functionName, args, value: 0n });
  const hash = await client.writeContract({ account: client.account, address, functionName, args, value: 0n, fees: { distribution: quote.distribution, feeValue: quote.feeValue, messageAllocations: quote.messageAllocations } });
  return { hash, receipt: await finalize(hash) };
}

const beforeIdentity = await client.readContract({ address: manifest.identity.address, functionName: "get_identity", args: [client.account.address, "GITHUB"] });
if (beforeIdentity.state !== "PENDING") throw new Error(`expected PENDING GitHub identity, got ${beforeIdentity.state}`);
const completion = await write(manifest.identity.address, "complete_github", []);
const identity = await client.readContract({ address: manifest.identity.address, functionName: "get_identity", args: [client.account.address, "GITHUB"] });
if (identity.state !== "ACTIVE" || String(identity.canonical_id) !== "45469370") throw new Error("final ACTIVE GitHub identity readback mismatch");

const campaignId = Number(process.env.V2_CAMPAIGN_ID || 1);
const positionId = Number(process.env.V2_POSITION_ID || 1);
const beforePosition = await client.readContract({ address: manifest.rail.address, functionName: "get_position", args: [campaignId, positionId] });
if (beforePosition.state !== "RESERVED") throw new Error(`expected RESERVED position, got ${beforePosition.state}`);
const acceptance = await write(manifest.rail.address, "accept_referral", [campaignId, positionId, "ometere123"]);
const position = await client.readContract({ address: manifest.rail.address, functionName: "get_position", args: [campaignId, positionId] });
if (position.state !== "ACCEPTED" || String(position.github_login) !== "ometere123") throw new Error("final ACCEPTED position readback mismatch");

const out = { chainId: 61997, identityAddress: manifest.identity.address, railAddress: manifest.rail.address, wallet: client.account.address, challenge: beforeIdentity.challenge, transactions: { completion: completion.hash, acceptance: acceptance.hash }, identity, beforePosition, position };
writeFileSync(process.env.V2_IDENTITY_ACCEPT_OUTPUT || "deployment/v2-live-identity-accept.json", JSON.stringify(out, null, 2, (_, value) => typeof value === "bigint" ? value.toString() : value) + "\n");
console.log(JSON.stringify({ completion: completion.hash, acceptance: acceptance.hash, identity, position }, null, 2));
