"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Coins, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { SubmitInput } from "@genlayer/transaction-kit-react";
import VerifiedTransaction from "@/components/VerifiedTransaction";
import { useWallet } from "@/lib/genlayer/wallet";
import { settlementAddress } from "@/lib/genlayer/client";
import { configured, listOpportunities } from "@/lib/contracts/referralRail";
import { fromGen } from "@/lib/format";
import { useInvalidateProtocol } from "@/lib/hooks/useProtocol";

const init={title:'',brief:'',criteria:'',owner:'',repo:'',candidate:'',candidatePay:'',referralPay:'',referralHours:'24',completionHours:'168'};
export default function NewOpportunity(){
 const router=useRouter(); const wallet=useWallet(); const invalidate=useInvalidateProtocol(); const [form,setForm]=useState(init); const [review,setReview]=useState(false); const [error,setError]=useState('');
 const update=(k:string,v:string)=>setForm(s=>({...s,[k]:v}));
 let cp=0n,rr=0n; try{cp=fromGen(form.candidatePay||'0');rr=fromGen(form.referralPay||'0')}catch{}
 const total=cp+rr;
 const tx=useMemo<SubmitInput>(()=>({kind:'write',address:settlementAddress() as `0x${string}`,method:'create_opportunity',args:[form.title.trim(),form.brief.trim(),form.criteria.trim(),form.owner.trim(),form.repo.trim(),form.candidate.trim(),cp,rr,BigInt(Number(form.referralHours||0)*3600),BigInt(Number(form.completionHours||0)*3600)]}),[form,cp,rr]);
 const validate=()=>{ if(!configured()) return 'Contracts are not configured.'; if(!wallet.connected||!wallet.correctNetwork) return 'Connect an employer wallet on Studio Next chain 61997.'; if(form.title.trim().length<3||form.brief.trim().length<20||form.criteria.trim().length<20) return 'Use a clear title and at least 20 characters for both brief and criteria.'; if(!/^0x[0-9a-fA-F]{40}$/.test(form.candidate)) return 'Candidate address is invalid.'; if(form.candidate.toLowerCase()===wallet.address?.toLowerCase()) return 'Employer and candidate must be different.'; if(cp<=0n||rr<=0n) return 'Both candidate payment and referral reward must be positive.'; if(Number(form.referralHours)<1||Number(form.completionHours)<=Number(form.referralHours)) return 'Completion window must be longer than referral window.'; if(!form.owner||!form.repo) return 'A GitHub owner and repository are required.'; return ''; };
 const openReview=()=>{const e=validate();setError(e);if(!e)setReview(true)};
 const findCreated=async()=>{const rows=await listOpportunities();return rows.find(o=>o.title===form.title.trim()&&o.candidate.toLowerCase()===form.candidate.toLowerCase()&&o.employer.toLowerCase()===wallet.address?.toLowerCase()&&o.repo_owner===form.owner.trim()&&o.repo_name===form.repo.trim()&&BigInt(o.funded_amount as any)===total)};
 const verify=async()=>!!(await findCreated());
 return <div className="container"><div className="form-shell">
  <div className="form-header"><Link href="/" className="meta">← Back to opportunities</Link><div className="eyebrow" style={{marginTop:18}}>Employer action · fully funded</div><h1>Create an opportunity</h1><p>Freeze the work, evidence source, candidate and payment split before anyone knows the outcome. Once a referral is locked, the employer cannot cancel it.</p></div>
  {!review?<div className="form-card"><div className="form-grid">
   <div className="field full"><label>Job / task title</label><input value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Implement CSV export with permission checks" maxLength={120}/></div>
   <div className="field full"><label>Immutable work brief</label><textarea value={form.brief} onChange={e=>update('brief',e.target.value)} placeholder="Describe exactly what the candidate must deliver. Keep the scope inspectable from one GitHub PR." maxLength={2600}/><span className="helper">ReferralRail is intentionally not a freelancer marketplace. One funded task maps to one registered candidate and one public GitHub repository.</span></div>
   <div className="field full"><label>Acceptance criteria</label><textarea value={form.criteria} onChange={e=>update('criteria',e.target.value)} placeholder="List mandatory, observable criteria. Example: export is available on the reports page; unauthorized users cannot call it; tests cover success and permission failure." maxLength={2600}/><span className="helper">These criteria become frozen policy data. GenLayer evaluates the actual merged diff against them.</span></div>
   <div className="field"><label>GitHub owner / org</label><input value={form.owner} onChange={e=>update('owner',e.target.value)} placeholder="acme"/></div><div className="field"><label>Repository</label><input value={form.repo} onChange={e=>update('repo',e.target.value)} placeholder="product"/></div>
   <div className="field full"><label>Candidate wallet</label><input value={form.candidate} onChange={e=>update('candidate',e.target.value)} placeholder="0x…"/><span className="helper">The referrer must later name this exact candidate, and the candidate must personally accept the attribution.</span></div>
   <div className="field"><label>Candidate payment · GEN</label><input inputMode="decimal" value={form.candidatePay} onChange={e=>update('candidatePay',e.target.value)} placeholder="1.00"/></div><div className="field"><label>Referral reward · GEN</label><input inputMode="decimal" value={form.referralPay} onChange={e=>update('referralPay',e.target.value)} placeholder="0.20"/></div>
   <div className="field"><label>Referral / acceptance window · hours</label><input type="number" min="1" value={form.referralHours} onChange={e=>update('referralHours',e.target.value)}/></div><div className="field"><label>Completion window · hours</label><input type="number" min="2" value={form.completionHours} onChange={e=>update('completionHours',e.target.value)}/></div>
   <div className="funding-box"><div><span className="ticket-label" style={{color:'#9fb2bd'}}>Candidate</span><strong>{form.candidatePay||'0'} GEN</strong></div><div><span className="ticket-label" style={{color:'#9fb2bd'}}>Referrer</span><strong>{form.referralPay||'0'} GEN</strong></div><div><span className="ticket-label" style={{color:'#9fb2bd'}}>Commit now</span><strong>{Number(form.candidatePay||0)+Number(form.referralPay||0)} GEN</strong></div></div>
  </div>{error&&<div className="notice error" style={{marginTop:16}}>{error}</div>}<div className="hero-actions"><button className="button primary" onClick={openReview}><Coins size={16}/> Review & fund</button></div></div>
  :<div><button className="button secondary small" onClick={()=>setReview(false)}><ArrowLeft size={15}/> Edit opportunity</button><div className="panel panel-pad" style={{marginTop:14}}><div className="eyebrow">Signing summary</div><h2>{form.title}</h2><p className="prose">You are committing {form.candidatePay||'0'} GEN to the candidate and {form.referralPay||'0'} GEN to the eventual accepted referrer. The repository, candidate, brief and criteria cannot be rewritten after creation.</p><div className="notice info"><ShieldCheck size={14}/> The value is separate from GenLayer protocol fees. Transaction Kit will quote the fee policy before your wallet signs.</div><VerifiedTransaction tx={tx} userValue={total} verify={verify} onVerified={async()=>{const created=await findCreated();await invalidate();router.push(created?`/opportunities/${created.id}`:'/opportunities')}}/></div></div>}
 </div></div>
}
