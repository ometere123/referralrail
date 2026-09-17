import { createAccount, createClient, chains, isSuccessful } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";
const rpc="https://studio-dev.genlayer.com/api";
const m=JSON.parse(readFileSync("deployment/v2-61997.json","utf8"));
const base={...chains.studioDevnet,rpcUrls:{...chains.studioDevnet.rpcUrls,default:{http:[rpc]}}};
const c=createClient({endpoint:rpc,chain:base,account:createAccount(process.env.STUDIO_NEXT_CANDIDATE_PRIVATE_KEY)});
const positionArgs=[1,1];
const before=await c.readContract({address:m.rail.address,functionName:"get_position",args:positionArgs});
if(before.state!=="ACCEPTED") throw Error(`position is ${before.state}, expected ACCEPTED`);
const submitArgs=[1,1,1];
const q=await c.estimateTransactionFeesForWrite({account:c.account,address:m.rail.address,functionName:"submit_work",args:submitArgs,value:0n});
const h=await c.writeContract({account:c.account,address:m.rail.address,functionName:"submit_work",args:submitArgs,value:0n,fees:{distribution:q.distribution,feeValue:q.feeValue,messageAllocations:q.messageAllocations}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let receipt;
for(let i=0;i<60;i++){
  const l=await c.advanced.getTransactionLifecycle({hash:h});
  if(l.resolutionAction==="Finalize"){try{await c.finalizeTransaction({txId:h})}catch{} }
  if(l.storedStatus==="Finalized"||l.projectedStatus==="Finalized"){
    receipt=await c.waitForFinalization({hash:h,retries:10,interval:2000,fullTransaction:true});
    break;
  }
  await sleep(10000);
}
if(!receipt||!isSuccessful(receipt)) throw Error(`${h}: ${receipt?.txExecutionResultName||"timeout"}`);
const out={hash:h,before,receipt,position:await c.readContract({address:m.rail.address,functionName:"get_position",args:positionArgs})};
writeFileSync("deployment/v2-live-submit.json",JSON.stringify(out,null,2,(k,v)=>typeof v==="bigint"?v.toString():v)+"\n");
console.log(JSON.stringify({hash:h,children:receipt.triggered_transactions,position:out.position},null,2));
