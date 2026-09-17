"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { SubmitInput } from "@genlayer/transaction-kit-react";
import { AlertCircle, CheckCircle2, ExternalLink, GitPullRequest, Handshake, Hourglass, RotateCcw, ShieldCheck, WalletCards } from "lucide-react";
import VerifiedTransaction from "@/components/VerifiedTransaction";
import { Lifecycle } from "@/components/Lifecycle";
import { settlementAddress } from "@/lib/genlayer/client";
import { EXPLORER_URL } from "@/lib/genlayer/network";
import { getOpportunity } from "@/lib/contracts/referralRail";
import { useWallet } from "@/lib/genlayer/wallet";
import { useInvalidateProtocol, useJudgment, useOpportunity } from "@/lib/hooks/useProtocol";
import { dateTime, gen, shortAddress } from "@/lib/format";

function TxBox({method,args,verify,label,onDone,externalRecipients=[]}:{method:string;args:any[];verify:()=>Promise<boolean>;label:string;onDone:()=>Promise<void>;externalRecipients?:string[]}){
 const tx=useMemo<SubmitInput>(()=>({kind:'write',address:settlementAddress() as `0x${string}`,method,args} as SubmitInput),[method,JSON.stringify(args)]);
 return <div><div className="eyebrow">{label}</div><VerifiedTransaction tx={tx} externalRecipients={externalRecipients} verify={verify} onVerified={onDone}/></div>;
}

export default function OpportunityPage(){
 const params=useParams<{id:string}>(); const id=Number(params.id); const wallet=useWallet(); const invalidate=useInvalidateProtocol();
 const {data:o,isLoading,error,refetch}=useOpportunity(id); const {data:j}=useJudgment(id,o?.active_attempt||0);
 const [action,setAction]=useState(''); const [github,setGithub]=useState(''); const [pr,setPr]=useState('');
 if(isLoading) return <div className="container detail-shell"><div className="skeleton"/></div>;
 if(error||!o) return <div className="container detail-shell"><div className="notice error">Could not read this opportunity from finalized contract state.</div></div>;
 const addr=(wallet.address||'').toLowerCase(); const employer=addr===o.employer.toLowerCase(); const candidate=addr===o.candidate.toLowerCase(); const referrer=addr===o.referrer.toLowerCase(); const now=Math.floor(Date.now()/1000);
 const refresh=async()=>{await invalidate(id);await refetch();setAction('')};
 const verifyState=async(predicate:(x:any)=>boolean)=>predicate(await getOpportunity(id));
 const canExpire=(['OPEN','REFERRED'].includes(o.state)&&now>o.referral_deadline)||(o.state==='ACCEPTED'&&now>o.completion_deadline);
 const canRecover=(o.state==='JUDGING'&&now>o.judgment_timeout_at)||(o.state==='INCONCLUSIVE'&&(o.attempt_count>=2||now>o.retry_deadline));
 const settlementRecipients=o.state==='PAID'?[o.candidate,o.referrer]:[o.employer];
 return <div className="container detail-shell">
  <div className="detail-top"><div><Link href="/opportunities" className="meta">← All opportunities</Link><div className="eyebrow" style={{marginTop:17}}>Opportunity #{o.id} · {o.repo_owner}/{o.repo_name}</div><h1>{o.title}</h1><div className="detail-state"><span className={`status ${o.state.toLowerCase()}`}>{o.state}</span><span className="meta">last outcome {o.last_outcome}</span></div></div><a className="button secondary small" href={`${EXPLORER_URL.replace(/\/$/,'')}/contracts/${settlementAddress()}`} target="_blank" rel="noreferrer">Contract <ExternalLink size={13}/></a></div>
  <Lifecycle state={o.state}/>
  {o.state==='PAID'&&o.settlement_released&&<div className="settlement-highlight"><div><small>Candidate paid</small><strong>{gen(o.candidate_payment)}</strong><span className="meta">{shortAddress(o.candidate)}</span></div><div><small>Referrer paid</small><strong>{gen(o.referral_reward)}</strong><span className="meta">{shortAddress(o.referrer)}</span></div></div>}
  {o.state==='PAID'&&!o.settlement_released&&<div className="notice warning" style={{marginTop:18}}>Outcome is COMPLETED, but funds have not been released yet. Run the settlement action below before treating the candidate or referrer as paid.</div>}
  {o.state==='REFUNDED'&&!o.settlement_released&&<div className="notice warning" style={{marginTop:18}}>Outcome is NOT_COMPLETED and refund is approved, but the employer funds have not been released yet. Run the settlement action below.</div>}
  <div className="detail-grid" style={{marginTop:18}}><div className="panel brief-card"><h2>Frozen work agreement</h2><div className="prose">{o.brief}</div><div className="criteria"><strong>Acceptance criteria</strong><div className="prose" style={{marginTop:9}}>{o.acceptance_criteria}</div></div><div className="role-strip"><div className="role-card"><small>Employer</small><strong>{shortAddress(o.employer)}{employer?' · you':''}</strong></div><div className="role-card"><small>Candidate</small><strong>{shortAddress(o.candidate)}{candidate?' · you':''}</strong></div><div className="role-card"><small>Referrer</small><strong>{o.referrer.startsWith('0x0000')?'not locked':`${shortAddress(o.referrer)}${referrer?' · you':''}`}</strong></div></div></div>
   <aside className="panel side-card"><h2>Economic terms</h2><div className="kv"><span>Candidate payment</span><strong>{gen(o.candidate_payment)}</strong></div><div className="kv"><span>Referral reward</span><strong>{gen(o.referral_reward)}</strong></div><div className="kv"><span>Total committed</span><strong>{gen(o.funded_amount)}</strong></div><div className="kv"><span>Referral deadline</span><strong>{dateTime(o.referral_deadline)}</strong></div><div className="kv"><span>Completion deadline</span><strong>{dateTime(o.completion_deadline)}</strong></div><div className="kv"><span>GitHub identity</span><strong>{o.candidate_github||'locks at acceptance'}</strong></div><div className="kv"><span>Evidence</span><strong>{o.active_pr_number?`PR #${o.active_pr_number}`:'not submitted'}</strong></div><div className="kv"><span>Settlement released</span><strong>{o.settlement_released?'yes':'no'}</strong></div></aside>
  </div>

  {j&&<div className="judgment"><div className="judgment-head"><div><div className="eyebrow">Outcome Judge · attempt {j.attempt_id}</div><h3 style={{margin:'7px 0'}}>{j.outcome}</h3></div>{j.outcome==='COMPLETED'?<CheckCircle2 color="var(--mint)"/>:j.outcome==='INCONCLUSIVE'?<AlertCircle color="var(--gold)"/>:<ShieldCheck color="var(--blue)"/>}</div><p className="prose">{j.reason}</p><code>evidence digest · {j.evidence_digest||'none because evidence was unavailable'}</code><div className="audit">{j.audit}</div></div>}

  <div className="panel action-card">
   <h2>Your available protocol action</h2><p>Actions are role- and state-gated by the contract. The UI is only a convenience layer.</p>
   {!wallet.connected?<div className="notice warning">Connect a wallet to see the action available to that address.</div>:
    !wallet.correctNetwork?<div className="notice warning">Connected wallet is not on Studio Next / Studionet Dev chain 61997.</div>:
    action?<div><button className="button secondary small" onClick={()=>setAction('')} style={{marginBottom:12}}>← Back</button>
      {action==='refer'&&<TxBox method="create_referral" args={[id,o.candidate]} label="Lock referral attribution" verify={()=>verifyState(x=>x.state!=='OPEN'&&x.referrer.toLowerCase()===addr)} onDone={refresh}/>} 
      {action==='accept'&&<TxBox method="accept_referral" args={[id,github.trim()]} label="Accept referral + lock GitHub identity" verify={()=>verifyState(x=>['ACCEPTED','JUDGING','INCONCLUSIVE','PAID','REFUNDED'].includes(x.state)&&x.candidate_github===github.trim())} onDone={refresh}/>} 
      {action==='submit'&&<TxBox method="submit_work" args={[id,Number(pr)]} label="Submit merged PR for consensus" verify={()=>verifyState(x=>x.active_pr_number===Number(pr)&&x.attempt_count>=o.attempt_count+1)} onDone={refresh}/>} 
      {action==='retry'&&<TxBox method="retry_inconclusive" args={[id,Number(pr)]} label="Use bounded inconclusive retry" verify={()=>verifyState(x=>x.active_pr_number===Number(pr)&&x.attempt_count>=o.attempt_count+1)} onDone={refresh}/>} 
      {action==='resolve'&&<TxBox method="resolve_judgment" args={[id,o.active_attempt]} label="Materialize finalized judgment" verify={()=>verifyState(x=>x.state!=='JUDGING'&&x.last_outcome!=='NONE')} onDone={refresh}/>} 
      {action==='settle'&&<TxBox method="settle_opportunity" args={[id]} externalRecipients={settlementRecipients} label={o.state==='PAID'?'Release candidate + referrer payouts':'Release employer refund'} verify={()=>verifyState(x=>x.settlement_released===true&&Number(x.closed_at)>0)} onDone={refresh}/>} 
      {action==='cancel'&&<TxBox method="cancel_unreferred" args={[id]} externalRecipients={[o.employer]} label="Cancel before any referral is locked" verify={()=>verifyState(x=>x.state==='CANCELLED'&&x.settlement_released===true)} onDone={refresh}/>} 
      {action==='expire'&&<TxBox method="expire" args={[id]} externalRecipients={[o.employer]} label="Apply deterministic expiry" verify={()=>verifyState(x=>x.state==='EXPIRED'&&x.settlement_released===true)} onDone={refresh}/>} 
      {action==='recover'&&<TxBox method="recover" args={[id]} externalRecipients={[o.employer]} label="Recover funds from bounded stalled path" verify={()=>verifyState(x=>x.state==='REFUNDED'&&x.settlement_released===true)} onDone={refresh}/>} 
    </div>:
    <div>
      {o.state==='OPEN'&&!employer&&!candidate&&<button className="button primary" onClick={()=>setAction('refer')}><Handshake size={16}/> Refer the nominated candidate</button>}
      {o.state==='OPEN'&&employer&&<div className="hero-actions"><div className="notice info">Waiting for a third-party referrer. The employer cannot self-refer.</div><button className="button secondary" onClick={()=>setAction('cancel')}>Cancel & refund before referral</button></div>}
      {o.state==='OPEN'&&candidate&&<div className="notice info">A referrer must lock your referral before you can accept it. You cannot self-refer.</div>}
      {o.state==='REFERRED'&&candidate&&<div className="inline-form"><input value={github} onChange={e=>setGithub(e.target.value)} placeholder="Your GitHub username"/><button className="button mint" disabled={!github.trim()} onClick={()=>setAction('accept')}><ShieldCheck size={15}/> Accept referral</button></div>}
      {o.state==='REFERRED'&&!candidate&&<div className="notice info">Referral locked by {shortAddress(o.referrer)}. Only {shortAddress(o.candidate)} can accept it.</div>}
      {o.state==='ACCEPTED'&&candidate&&<div className="inline-form"><input type="number" min="1" value={pr} onChange={e=>setPr(e.target.value)} placeholder="Merged PR number"/><button className="button primary" disabled={!pr||Number(pr)<=0} onClick={()=>setAction('submit')}><GitPullRequest size={15}/> Submit work evidence</button></div>}
      {o.state==='ACCEPTED'&&!candidate&&<div className="notice info">Attribution is immutable. Waiting for candidate {o.candidate_github} to submit a merged PR.</div>}
      {o.state==='JUDGING'&&!j&&<div className="notice info"><Hourglass size={15}/> GenLayer is evaluating the GitHub evidence. This page checks the finalized OutcomeJudge result automatically.</div>}
      {o.state==='JUDGING'&&j&&<div className="hero-actions"><div className="notice info">OutcomeJudge finalized <strong>{j.outcome}</strong>. Materialize that result into ReferralRail before settlement.</div><button className="button primary" onClick={()=>setAction('resolve')}>Resolve finalized judgment</button></div>}
      {o.state==='INCONCLUSIVE'&&candidate&&o.attempt_count<2&&now<=o.retry_deadline&&<div><div className="notice warning" style={{marginBottom:10}}>Evidence was inconclusive. One bounded retry is available until {dateTime(o.retry_deadline)}.</div><div className="inline-form"><input type="number" min="1" value={pr} onChange={e=>setPr(e.target.value)} placeholder="PR number to retry"/><button className="button secondary" disabled={!pr} onClick={()=>setAction('retry')}><RotateCcw size={15}/> Retry evidence</button></div></div>}
      {o.state==='INCONCLUSIVE'&&!candidate&&!canRecover&&<div className="notice warning">The candidate has a bounded cure window. If it closes without a successful retry, recovery becomes permissionless.</div>}
      {canExpire&&<button className="button secondary" onClick={()=>setAction('expire')}>Expire & refund employer</button>}
      {canRecover&&<button className="button secondary" onClick={()=>setAction('recover')}><WalletCards size={15}/> Recover locked funds</button>}
      {['PAID','REFUNDED'].includes(o.state)&&!o.settlement_released&&<div className="hero-actions"><div className="notice warning">The outcome is decided, but funds remain locked until settlement is released.</div><button className="button mint" onClick={()=>setAction('settle')}><WalletCards size={15}/> Release settlement funds</button></div>}
      {(['PAID','REFUNDED'].includes(o.state)&&o.settlement_released||['EXPIRED','CANCELLED'].includes(o.state))&&<div className="notice info">This opportunity is fully settled. No settlement action can execute again.</div>}
    </div>}
  </div>
 </div>
}
