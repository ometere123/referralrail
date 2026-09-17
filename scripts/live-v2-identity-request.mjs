import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const base = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const key = process.env.STUDIO_NEXT_CANDIDATE_PRIVATE_KEY;
if (!key) throw new Error("STUDIO_NEXT_CANDIDATE_PRIVATE_KEY is required");
const client = createClient({ endpoint: rpc, chain: base, account: createAccount(key) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function finalize(hash) {
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
const args = ["ometere123"];
const quote = await client.estimateTransactionFeesForWrite({ account: client.account, address: manifest.identity.address, functionName: "request_github", args, value: 0n });
const hash = await client.writeContract({ account: client.account, address: manifest.identity.address, functionName: "request_github", args, value: 0n, fees: { distribution: quote.distribution, feeValue: quote.feeValue } });
const receipt = await finalize(hash);
const identity = await client.readContract({ address: manifest.identity.address, functionName: "get_identity", args: [client.account.address, "GITHUB"] });
const out = { chainId: 61997, identityAddress: manifest.identity.address, wallet: client.account.address, requestTransaction: hash, receipt, identity };
writeFileSync(process.env.V2_IDENTITY_REQUEST_OUTPUT || "deployment/v2-live-identity-request.json", JSON.stringify(out, null, 2, (_, value) => typeof value === "bigint" ? value.toString() : value) + "\n");
console.log(JSON.stringify({ requestTransaction: hash, wallet: client.account.address, challenge: identity.challenge, identity }, null, 2));
