import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const base = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const client = createClient({ endpoint: rpc, chain: base, account: createAccount(process.env.STUDIO_NEXT_EMPLOYER_PRIVATE_KEY) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForFinalized(hash) {
  for (let i = 0; i < 60; i += 1) {
    const lifecycle = await client.advanced.getTransactionLifecycle({ hash });
    if (lifecycle.resolutionAction === "Finalize") {
      try { await client.finalizeTransaction({ txId: hash }); } catch {}
    }
    if (lifecycle.storedStatus === "Finalized" || lifecycle.projectedStatus === "Finalized" || !lifecycle.decisionActive) {
      const receipt = await client.waitForFinalization({ hash, retries: 10, interval: 2000, fullTransaction: true });
      if (!isSuccessful(receipt)) throw new Error(`${hash}: ${receipt.txExecutionResultName}`);
      return receipt;
    }
    await sleep(10000);
  }
  throw new Error(`timeout ${hash}`);
}

async function write(method, args) {
  const quote = await client.estimateTransactionFeesForWrite({ account: client.account, address: manifest.rail.address, functionName: method, args, value: 0n });
  const hash = await client.writeContract({ account: client.account, address: manifest.rail.address, functionName: method, args, value: 0n, fees: { distribution: quote.distribution, feeValue: quote.feeValue, messageAllocations: quote.messageAllocations } });
  return { hash, receipt: await waitForFinalized(hash) };
}

const judgment = await client.readContract({ address: manifest.judge.address, functionName: "get_judgment", args: [1, 1, 1] });
const resolved = await write("resolve_judgment", [1, 1, 1]);
const afterResolve = await client.readContract({ address: manifest.rail.address, functionName: "get_position", args: [1, 1] });
const closed = await write("close_intake", [1]);
const finalised = await write("finalise_campaign", [1]);
const campaign = await client.readContract({ address: manifest.rail.address, functionName: "get_campaign", args: [1] });
const accounting = await client.readContract({ address: manifest.rail.address, functionName: "get_campaign_accounting", args: [1] });
const output = { judgment, resolved, afterResolve, closed, finalised, campaign, accounting };
writeFileSync("deployment/v2-live-negative.json", JSON.stringify(output, null, 2, (key, value) => typeof value === "bigint" ? value.toString() : value) + "\n");
console.log(JSON.stringify({ judgment, position: afterResolve, resolved: resolved.hash, closed: closed.hash, finalised: finalised.hash, campaign, accounting }, null, 2, (key, value) => typeof value === "bigint" ? value.toString() : value));
