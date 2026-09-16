import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { DecodedDeployData, GenLayerClient } from "genlayer-js/types";

// The RC3 CLI executes deploy scripts from a temporary directory. Resolve the
// runtime SDK from the repository so ESM package lookup does not depend on the
// temporary script location (important with pnpm's workspace layout).
let isSuccessful: (tx: any) => boolean;

const EXPECTED_CHAIN_ID = 61997;

async function fees(client: GenLayerClient<any>) {
  // The profile documents measured execution envelopes, but its zero message-fee
  // fields are not a sendable fee quote. RC1 rejects such a transaction before
  // GenVM with FeeValueMustBeNonZero. Always obtain the actual current fee value.
  const estimate = await client.estimateTransactionFees();
  if (!estimate.feeValue || estimate.feeValue === 0n) {
    throw new Error("Studio Next returned a zero feeValue");
  }
  return { distribution: estimate.distribution, feeValue: estimate.feeValue };
}

async function deployOne(client: GenLayerClient<any>, filename: string, args: any[]) {
  const code = new Uint8Array(readFileSync(path.resolve(process.cwd(), "contracts", filename)));
  const txId = await client.deployContract({ code, args, fees: await fees(client) });
  const tx = await client.waitForFinalization({ hash: txId, retries: 240, interval: 5000 });
  if (!isSuccessful(tx)) throw new Error(`${filename} failed: ${tx.statusName} / ${tx.txExecutionResultName}`);
  const decoded = tx.txDataDecoded as DecodedDeployData | undefined;
  const address = decoded?.contractAddress ?? tx.recipient;
  if (!address) throw new Error(`${filename} finalized without a contract address`);
  return { txId, address };
}

export default async function main(client: GenLayerClient<any>) {
  ({ isSuccessful } = await import(
    pathToFileURL(path.resolve(process.cwd(), "node_modules/genlayer-js/dist/index.js")).href
  ));
  if (Number((client.chain as any).id) !== EXPECTED_CHAIN_ID) {
    throw new Error(`Refusing deployment: ReferralRail is locked to chain ${EXPECTED_CHAIN_ID}`);
  }
  const rpc = String((client.chain as any).rpcUrls?.default?.http?.[0] ?? "");
  if (rpc !== "https://studio-dev.genlayer.com/api") {
    throw new Error(`Refusing deployment: unexpected RPC ${rpc}`);
  }

  const settlement = await deployOne(client, "referral_rail.py", []);
  const judge = await deployOne(client, "outcome_judge.py", [settlement.address]);

  const bindTxId = await client.writeContract({
    address: settlement.address as `0x${string}`,
    functionName: "set_judge",
    args: [judge.address],
    fees: await fees(client),
  });
  const bound = await client.waitForFinalization({ hash: bindTxId, retries: 240, interval: 5000 });
  if (!isSuccessful(bound)) throw new Error(`set_judge failed: ${bound.statusName} / ${bound.txExecutionResultName}`);

  const config = await client.readContract({ address: settlement.address as `0x${string}`, functionName: "get_protocol_config", args: [] } as any);
  const manifest = {
    network: "Studio Next / Studionet Dev",
    chainId: EXPECTED_CHAIN_ID,
    rpc: rpc,
    explorer: "https://explorer-studio-dev.genlayer.com/",
    explorerReferralRail: `https://explorer-studio-dev.genlayer.com/address/${settlement.address}`,
    explorerOutcomeJudge: `https://explorer-studio-dev.genlayer.com/address/${judge.address}`,
    explorerBindingTransaction: `https://explorer-studio-dev.genlayer.com/tx/${bindTxId}`,
    runtime: "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng",
    referralRail: settlement,
    outcomeJudge: judge,
    bindingTransaction: bindTxId,
    protocolConfigReadback: config,
    generatedAt: new Date().toISOString(),
  };
  mkdirSync(path.resolve(process.cwd(), "deployment"), { recursive: true });
  writeFileSync(path.resolve(process.cwd(), "deployment", "61997.json"), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}
