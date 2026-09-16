import { chains, createAccount, createClient } from "genlayer-js";

const rpc = "https://studio-dev.genlayer.com/api";
const txId = process.argv[2];
const key = process.env.STUDIO_NEXT_PRIVATE_KEY;
if (!txId || !key) throw new Error("transaction hash and STUDIO_NEXT_PRIVATE_KEY are required");

const client = createClient({
  endpoint: rpc,
  account: createAccount(key),
  chain: { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } },
});

async function main() {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const lifecycle = await client.advanced.getTransactionLifecycle({ hash: txId });
    const action = lifecycle.resolutionAction ?? lifecycle.resolution_action_name;
    if (action === "Finalize") {
      try {
        const hash = await client.finalizeTransaction({ txId });
        console.log(hash);
        return;
      } catch (error) {
        const message = String(error?.message || error);
        if (message.includes("no active decision")) {
          const latest = await client.advanced.getTransactionLifecycle({ hash: txId });
          if (latest.storedStatus === "Finalized" || latest.projectedStatus === "Finalized") return;
        }
        if (!message.includes("FinalizationNotAllowed")) throw error;
      }
    }
    if (lifecycle.projectedStatus === "Finalized" || lifecycle.storedStatus === "Finalized") return;
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  throw new Error(`transaction ${txId} did not become finalizable`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
