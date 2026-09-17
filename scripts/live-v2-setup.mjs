import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";

const rpc = "https://studio-dev.genlayer.com/api";
const manifest = JSON.parse(readFileSync("deployment/v2-61997.json", "utf8"));
const railAddress = manifest.rail.address;
const base = { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } };
const key = (name) => process.env[name] || (() => { throw new Error(`${name} is required`); })();
const make = (name) => createClient({ endpoint: rpc, chain: base, account: createAccount(key(name)) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wait(client, hash) {
  for (let i = 0; i < 180; i++) {
    const l = await client.advanced.getTransactionLifecycle({ hash });
    if (l.resolutionAction === "Finalize") { try { await client.finalizeTransaction({ txId: hash }); } catch {} }
    if (l.storedStatus === "Finalized" || l.projectedStatus === "Finalized") {
      const receipt = await client.waitForFinalization({ hash, retries: 30, interval: 2000, fullTransaction: true });
      if (!isSuccessful(receipt)) throw new Error(`${hash} finalized unsuccessfully: ${receipt.txExecutionResultName}`);
      return receipt;
    }
    await sleep(10000);
  }
  throw new Error(`${hash} did not finalize`);
}
async function fee(client, method, args, account, value = 0n) {
  const q = await client.estimateTransactionFeesForWrite({ account, address: railAddress, functionName: method, args, value });
  if (!q.feeValue) throw new Error(`zero fee quote for ${method}`);
  return { distribution: q.distribution, feeValue: q.feeValue, messageAllocations: q.messageAllocations };
}
async function write(client, method, args, value = 0n) {
  const account = client.account;
  const hash = await client.writeContract({ account, address: railAddress, functionName: method, args, value, fees: await fee(client, method, args, account, value) });
  await wait(client, hash);
  return hash;
}
const employer = make("STUDIO_NEXT_EMPLOYER_PRIVATE_KEY");
const referrer = make("STUDIO_NEXT_REFERRER_PRIVATE_KEY");
const candidate = make("STUDIO_NEXT_CANDIDATE_PRIVATE_KEY");
const candidateAddress = candidate.account.address;
const reward = 500000000000000n;
const createArgs = (repo, prBranch = "main") => ["Live v2 verification", "Complete the requested repository work and submit a qualifying pull request.", "The pull request must be authored by the bound GitHub identity and contain substantive work.", repo.split("/")[0], repo.split("/")[1], prBranch, 1, reward, reward, 900, 1800, 3600, 1];
async function campaign(repo) { const args=createArgs(repo); const funding=reward*2n; const create=await write(employer,"create_campaign",args,funding); const list=await employer.readContract({address:railAddress,functionName:"list_campaigns",args:[0,50]}); const rows=Array.isArray(list)?list:Object.values(list); const row=rows.at(-1); return { create, id:Number(row.id), employer:employer.account.address, referrer:referrer.account.address, candidate:candidateAddress, campaign:row }; }
const success = await campaign("ometere123/evifix");
const reserve = await write(referrer,"create_referral",[success.id,candidateAddress]);
const positions = await employer.readContract({address:railAddress,functionName:"list_positions",args:[success.id,0,50]});
const position = (Array.isArray(positions)?positions:Object.values(positions)).at(-1);
const pid = Number(position.position_id);
const accept = await write(candidate,"accept_referral",[success.id,pid,"ometere123"]);
const accepted = await employer.readContract({address:railAddress,functionName:"get_position",args:[success.id,pid]});
const out={railAddress,success:{...success,reserve,positionId:pid,accept,accepted}};
writeFileSync("deployment/v2-live-setup.json",JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out,null,2));
