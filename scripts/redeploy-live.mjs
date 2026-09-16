import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chains, createAccount, createClient, isSuccessful } from "genlayer-js";

const rpc = "https://studio-dev.genlayer.com/api";
const deployerKey = process.env.STUDIO_NEXT_PRIVATE_KEY;
if (!deployerKey) throw new Error("STUDIO_NEXT_PRIVATE_KEY is required");
const client = createClient({
  endpoint: rpc,
  account: createAccount(deployerKey),
  chain: { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } },
});

async function fees() {
  const estimate = await client.estimateTransactionFees();
  return { distribution: estimate.distribution, feeValue: estimate.feeValue };
}

async function finalize(hash) {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const lifecycle = await client.advanced.getTransactionLifecycle({ hash });
    if (lifecycle.resolutionAction === "Finalize") {
      try {
        await client.finalizeTransaction({ txId: hash });
        return;
      } catch (error) {
        const message = String(error?.message || error);
        if (message.includes("no active decision")) {
          const latest = await client.advanced.getTransactionLifecycle({ hash });
          if (latest.storedStatus === "Finalized" || latest.projectedStatus === "Finalized") return;
        }
        if (!message.includes("FinalizationNotAllowed")) throw error;
      }
    }
    if (lifecycle.projectedStatus === "Finalized" || lifecycle.storedStatus === "Finalized") return;
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  throw new Error(`transaction ${hash} did not become finalizable`);
}

async function deploy(file, args = []) {
  const code = new Uint8Array(readFileSync(`contracts/${file}`));
  const hash = await client.deployContract({ code, args, fees: await fees() });
  await finalize(hash);
  const receipt = await client.waitForFinalization({ hash, retries: 240, interval: 5000 });
  if (!isSuccessful(receipt)) throw new Error(`${file} failed: ${receipt.txExecutionResultName}`);
  return { txId: hash, address: receipt.txDataDecoded?.contractAddress ?? receipt.recipient };
}

const settlement = await deploy("referral_rail.py");
const judge = await deploy("outcome_judge.py", [settlement.address]);
const bindingTransaction = await client.writeContract({
  address: settlement.address,
  functionName: "set_judge",
  args: [judge.address],
  fees: await fees(),
});
await finalize(bindingTransaction);
const bindingReceipt = await client.waitForFinalization({ hash: bindingTransaction, retries: 240, interval: 5000 });
if (!isSuccessful(bindingReceipt)) throw new Error(`set_judge failed: ${bindingReceipt.txExecutionResultName}`);
const config = await client.readContract({ address: settlement.address, functionName: "get_protocol_config", args: [] });
const manifest = {
  network: "Studio Next / Studionet Dev",
  chainId: 61997,
  rpc,
  explorer: "https://explorer-studio-dev.genlayer.com/",
  explorerReferralRail: `https://explorer-studio-dev.genlayer.com/address/${settlement.address}`,
  explorerOutcomeJudge: `https://explorer-studio-dev.genlayer.com/address/${judge.address}`,
  explorerBindingTransaction: `https://explorer-studio-dev.genlayer.com/tx/${bindingTransaction}`,
  runtime: "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng",
  referralRail: settlement,
  outcomeJudge: judge,
  bindingTransaction,
  protocolConfigReadback: config,
  generatedAt: new Date().toISOString(),
};
mkdirSync("deployment", { recursive: true });
writeFileSync("deployment/61997.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));
