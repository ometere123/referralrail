import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { DecodedDeployData, GenLayerClient } from "genlayer-js/types";

const CHAIN_ID = 61997;
const RPC = "https://studio-dev.genlayer.com/api";

async function fee(client: GenLayerClient<any>) {
  const estimate = await client.estimateTransactionFees();
  if (!estimate.feeValue || estimate.feeValue === 0n) throw new Error("Refusing v2 deployment with a zero fee quote");
  return { distribution: estimate.distribution, feeValue: estimate.feeValue };
}

async function deploy(client: GenLayerClient<any>, filename: string, args: any[]) {
  const code = new Uint8Array(readFileSync(path.resolve(process.cwd(), "contracts", filename)));
  const hash = await client.deployContract({ code, args, fees: await fee(client) });
  const tx = await client.waitForFinalization({ hash, retries: 240, interval: 5000 });
  if (!((await import(pathToFileURL(path.resolve(process.cwd(), "node_modules/genlayer-js/dist/index.js")).href)).isSuccessful(tx as never))) throw new Error(`${filename} deployment did not finalize successfully`);
  const decoded = tx.txDataDecoded as DecodedDeployData | undefined;
  const address = decoded?.contractAddress ?? tx.recipient;
  if (!address) throw new Error(`${filename} finalized without an address`);
  return { hash, address };
}

export default async function main(client: GenLayerClient<any>) {
  if (Number((client.chain as any).id) !== CHAIN_ID) throw new Error(`Refusing deployment: expected chain ${CHAIN_ID}`);
  const rpc = String((client.chain as any).rpcUrls?.default?.http?.[0] ?? "");
  if (rpc !== RPC) throw new Error(`Refusing deployment: expected ${RPC}`);
  const rail = await deploy(client, "referral_rail_v2.py", []);
  const judge = await deploy(client, "outcome_judge_v2.py", [rail.address]);
  const bindHash = await client.writeContract({ address: rail.address as `0x${string}`, functionName: "set_judge", args: [judge.address], fees: await fee(client) });
  const bind = await client.waitForFinalization({ hash: bindHash, retries: 240, interval: 5000 });
  if (!((await import(pathToFileURL(path.resolve(process.cwd(), "node_modules/genlayer-js/dist/index.js")).href)).isSuccessful(bind as never))) throw new Error("v2 judge binding did not finalize successfully");
  const manifest = { version: "2", network: "Studio Next / Studionet Dev", chainId: CHAIN_ID, rpc, explorer: "https://explorer-studio-dev.genlayer.com", referralRailV2: rail, outcomeJudgeV2: judge, bindingTransaction: bindHash, generatedAt: new Date().toISOString() };
  mkdirSync(path.resolve(process.cwd(), "deployment"), { recursive: true });
  writeFileSync(path.resolve(process.cwd(), "deployment", "v2-61997.json"), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}
