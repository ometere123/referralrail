import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chains, createAccount, createClient, isSuccessful } from "genlayer-js";

const rpc = "https://studio-dev.genlayer.com/api";
const key = process.env.STUDIO_NEXT_PRIVATE_KEY;
if (!key) throw new Error("STUDIO_NEXT_PRIVATE_KEY is required");
const client = createClient({ endpoint: rpc, account: createAccount(key), chain: { ...chains.studioDevnet, rpcUrls: { ...chains.studioDevnet.rpcUrls, default: { http: [rpc] } } } });
async function fee() { const q = await client.estimateTransactionFees(); if (!q.feeValue) throw new Error("zero fee quote"); return { distribution: q.distribution, feeValue: q.feeValue }; }
async function finalize(hash) { for (let i=0;i<180;i++) { const l=await client.advanced.getTransactionLifecycle({hash}); if (l.resolutionAction === "Finalize") { try { await client.finalizeTransaction({txId:hash}); } catch(e) { if (!String(e).includes("no active decision") && !String(e).includes("FinalizationNotAllowed")) throw e; } } const n=await client.advanced.getTransactionLifecycle({hash}); if (n.storedStatus === "Finalized" || n.projectedStatus === "Finalized") return; await new Promise(r=>setTimeout(r,10000)); } throw new Error(`not finalized ${hash}`); }
async function deploy(file,args=[]) { const hash=await client.deployContract({code:new Uint8Array(readFileSync(`contracts/${file}`)),args,fees:await fee()}); await finalize(hash); const r=await client.waitForFinalization({hash,retries:240,interval:5000}); if(!isSuccessful(r)) throw new Error(`${file}: ${r.txExecutionResultName}`); return {txId:hash,address:r.txDataDecoded?.contractAddress ?? r.recipient}; }
const rail=await deploy("referral_rail_v2.py");
const judge=await deploy("outcome_judge_v2.py",[rail.address]);
const bind=await client.writeContract({address:rail.address,functionName:"set_judge",args:[judge.address],fees:await fee()}); await finalize(bind); const br=await client.waitForFinalization({hash:bind,retries:240,interval:5000}); if(!isSuccessful(br)) throw new Error(`binding: ${br.txExecutionResultName}`);
const out={version:"2",network:"Studio Next / Studionet Dev",chainId:61997,rpc,rail,judge,bindingTransaction:bind,generatedAt:new Date().toISOString()}; mkdirSync("deployment",{recursive:true}); writeFileSync("deployment/v2-61997.json",JSON.stringify(out,null,2)+"\n"); console.log(JSON.stringify(out,null,2));
