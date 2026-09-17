"use client";
import { useState } from "react";
import { GenLayerTransactionPanel, type SubmitInput, type TrackedStatus } from "@genlayer/transaction-kit-react";
import { CheckCircle2, DatabaseZap, ShieldCheck, XCircle } from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import { useTransactionKit } from "@/lib/genlayer/kit";
import { REFERRALRAIL_NETWORK } from "@/lib/genlayer/network";

export default function VerifiedTransaction({tx,userValue,externalRecipients=[],verify,onVerified}:{tx:SubmitInput;userValue?:bigint;externalRecipients?:string[];verify:()=>Promise<boolean>;onVerified?:()=>void|Promise<void>}){
 const {address,correctNetwork}=useWallet(); const kit=useTransactionKit(address,externalRecipients);
 const [phase,setPhase]=useState<'tracking'|'readback'|'confirmed'|'failed'>('tracking'); const [message,setMessage]=useState('');
 const done=async(status:TrackedStatus)=>{
   if(status.successful===false){setPhase('failed');setMessage('The finalized transaction did not execute successfully.');return;}
   setPhase('readback'); setMessage('Finalized. Verifying durable contract state…');
   for(let i=0;i<8;i++){try{if(await verify()){setPhase('confirmed');setMessage('Finalized and confirmed by contract readback.');await onVerified?.();return;}}catch{}
     await new Promise(r=>setTimeout(r,1500));}
   setPhase('failed'); setMessage('Transaction finalized, but the expected final contract state was not observed. Do not resubmit until the transaction is inspected.');
 };
 if(!address) return <div className="notice warning">Connect the wallet that must perform this protocol action.</div>;
 if(!correctNetwork) return <div className="notice warning">Switch to Studio Next / Studionet Dev chain 61997 before signing.</div>;
 if(!kit) return <div className="notice warning">Transaction Kit is unavailable for this wallet session.</div>;
 return <div className="tx-shell">
   <div className="tx-proofline"><span>Signature</span><span>Submitted</span><span>Consensus</span><span>Finalized</span><span>Readback</span></div>
   {phase!=='confirmed'&&phase!=='failed'&&<GenLayerTransactionPanel kit={kit} tx={tx} userValue={userValue} network={REFERRALRAIL_NETWORK.chainName} theme="dark" trackUntil="finalized" onDone={done}/>} 
   {phase==='readback'&&<div className="verification-state"><DatabaseZap size={18}/>{message}</div>}
   {phase==='confirmed'&&<div className="verification-state success"><CheckCircle2 size={19}/><div><strong>Protocol state confirmed</strong><p>{message}</p></div></div>}
   {phase==='failed'&&<div className="verification-state failure"><XCircle size={19}/><div><strong>Not confirmed</strong><p>{message}</p></div></div>}
   <div className="finality-note"><ShieldCheck size={14}/> ReferralRail never labels a write successful from wallet submission alone. This panel tracks GenLayer finality, then verifies final contract state.</div>
 </div>
}
