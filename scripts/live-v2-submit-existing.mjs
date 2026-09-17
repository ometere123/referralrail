import { createAccount, createClient, chains, isSuccessful, MessageType, MESSAGE_ALLOCATION_ROOT_PARENT_INDEX, deriveInternalMessageCallKey, encodeInternalMessageFeeParams } from "genlayer-js";
import { readFileSync, writeFileSync } from "node:fs";
const rpc="https://studio-dev.genlayer.com/api";
const m=JSON.parse(readFileSync("deployment/v2-61997.json","utf8"));
const base={...chains.studioDevnet,rpcUrls:{...chains.studioDevnet.rpcUrls,default:{http:[rpc]}}};
const c=createClient({endpoint:rpc,chain:base,account:createAccount(process.env.V2_PRIVATE_KEY || process.env.STUDIO_NEXT_CANDIDATE_PRIVATE_KEY)});
const campaignId=Number(process.env.V2_CAMPAIGN_ID || 1);
const positionId=Number(process.env.V2_POSITION_ID || 1);
const prNumber=Number(process.env.V2_PR_NUMBER || 1);
const positionArgs=[campaignId,positionId];
const before=await c.readContract({address:m.rail.address,functionName:"get_position",args:positionArgs});
if(before.state!=="ACCEPTED") throw Error(`position is ${before.state}, expected ACCEPTED`);
const submitArgs=[campaignId,positionId,prNumber];
const callbackBudget=120_000_000_000_000n;
const messageAllocations=[
  {messageType:MessageType.Internal,onAcceptance:false,parentIndex:MESSAGE_ALLOCATION_ROOT_PARENT_INDEX,recipient:m.judge.address,callKey:deriveInternalMessageCallKey("evaluate"),budget:callbackBudget,feeParams:encodeInternalMessageFeeParams({leaderTimeunitsAllocation:100,validatorTimeunitsAllocation:200,rotations:[3],executionBudgetPerRound:30_000_000_000_000_000n})},
  {messageType:MessageType.Internal,onAcceptance:false,parentIndex:0,recipient:m.rail.address,callKey:deriveInternalMessageCallKey("record_judgment"),budget:callbackBudget,feeParams:encodeInternalMessageFeeParams({leaderTimeunitsAllocation:100,validatorTimeunitsAllocation:200,rotations:[3],executionBudgetPerRound:30_000_000_000_000_000n})}
];
const q=await c.estimateTransactionFees({leaderTimeunitsAllocation:100,validatorTimeunitsAllocation:200,rotations:[3],totalMessageFees:callbackBudget*2n,messageAllocations});
const h=await c.writeContract({account:c.account,address:m.rail.address,functionName:"submit_work",args:submitArgs,value:0n,fees:{distribution:q.distribution,feeValue:q.feeValue,messageAllocations}});
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
const out={campaignId,positionId,prNumber,hash:h,before,receipt,position:await c.readContract({address:m.rail.address,functionName:"get_position",args:positionArgs})};
writeFileSync(process.env.V2_SUBMIT_OUTPUT || "deployment/v2-live-submit.json",JSON.stringify(out,null,2,(k,v)=>typeof v==="bigint"?v.toString():v)+"\n");
console.log(JSON.stringify({hash:h,children:receipt.triggered_transactions,position:out.position},null,2));
