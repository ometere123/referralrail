import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isSuccessful } from "genlayer-js";
import type { DecodedDeployData, GenLayerClient } from "genlayer-js/types";

const EXPECTED_CHAIN_ID = 61997;

type ProfileEntry = {
  leaderTimeunitsAllocation: string;
  validatorTimeunitsAllocation: string;
  executionBudgetPerRound: string;
  totalMessageFees?: string;
  rotationsPerRound?: string;
};
type FeeProfile = { deploy: ProfileEntry; methods: Record<string, ProfileEntry> };

function loadProfile(): FeeProfile {
  const file = path.resolve(process.cwd(), "fee-profile.json");
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch { throw new Error("fee-profile.json is required. Generate it from representative finalized tests before deployment."); }
}

async function fees(client: GenLayerClient<any>, entry: ProfileEntry) {
  const rotationsPerRound = BigInt(entry.rotationsPerRound ?? "1");
  const estimate = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: BigInt(entry.leaderTimeunitsAllocation),
    validatorTimeunitsAllocation: BigInt(entry.validatorTimeunitsAllocation),
    executionBudgetPerRound: BigInt(entry.executionBudgetPerRound),
    totalMessageFees: BigInt(entry.totalMessageFees ?? "0"),
    appealRounds: 1n,
    rotations: [rotationsPerRound, rotationsPerRound],
  });
  return { distribution: estimate.distribution, feeValue: estimate.feeValue };
}

async function deployOne(client: GenLayerClient<any>, filename: string, args: any[], profile: ProfileEntry) {
  const code = new Uint8Array(readFileSync(path.resolve(process.cwd(), "contracts", filename)));
  const txId = await client.deployContract({ code, args, fees: await fees(client, profile) });
  const tx = await client.waitForFinalization({ hash: txId, retries: 240, interval: 5000 });
  if (!isSuccessful(tx)) throw new Error(`${filename} failed: ${tx.statusName} / ${tx.txExecutionResultName}`);
  const decoded = tx.txDataDecoded as DecodedDeployData | undefined;
  const address = decoded?.contractAddress ?? tx.recipient;
  if (!address) throw new Error(`${filename} finalized without a contract address`);
  return { txId, address };
}

export default async function main(client: GenLayerClient<any>) {
  if (Number((client.chain as any).id) !== EXPECTED_CHAIN_ID) {
    throw new Error(`Refusing deployment: ReferralRail is locked to chain ${EXPECTED_CHAIN_ID}`);
  }
  const rpc = String((client.chain as any).rpcUrls?.default?.http?.[0] ?? "");
  if (rpc !== "https://studio-next.genlayer.com/api") {
    throw new Error(`Refusing deployment: unexpected RPC ${rpc}`);
  }

  const profile = loadProfile();
  const settlement = await deployOne(client, "referral_rail.py", [], profile.deploy);
  const judge = await deployOne(client, "outcome_judge.py", [settlement.address], profile.deploy);

  const methodProfile = profile.methods?.set_judge;
  if (!methodProfile) throw new Error("fee-profile.json is missing methods.set_judge");
  const bindTxId = await client.writeContract({
    address: settlement.address as `0x${string}`,
    functionName: "set_judge",
    args: [judge.address],
    fees: await fees(client, methodProfile),
  });
  const bound = await client.waitForFinalization({ hash: bindTxId, retries: 240, interval: 5000 });
  if (!isSuccessful(bound)) throw new Error(`set_judge failed: ${bound.statusName} / ${bound.txExecutionResultName}`);

  const config = await client.readContract({ address: settlement.address as `0x${string}`, functionName: "get_protocol_config", args: [] } as any);
  const manifest = {
    network: "Studio Next / Studionet Dev",
    chainId: EXPECTED_CHAIN_ID,
    rpc: rpc,
    explorer: "https://explorer-studio-dev.genlayer.com/",
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
