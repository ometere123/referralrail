"use client";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { configured } from "@/lib/contracts/referralRail";
import { useAccounting, useOpportunities } from "@/lib/hooks/useProtocol";
import { gen, shortAddress } from "@/lib/format";

export default function OpportunitiesPage(){
 const ready=configured(); const {data=[],isLoading,error}=useOpportunities(); const {data:accounting}=useAccounting();
 return <div className="container"><section className="section"><div className="section-heading"><div><div className="eyebrow">Public directory · finalized state</div><h1 style={{margin:'10px 0 12px'}}>Opportunities</h1><p className="prose">Discover funded work, inspect the frozen agreement, and lock attribution before the outcome is known.</p></div><Link className="button primary" href="/opportunities/new"><Plus size={16}/> Fund an opportunity</Link></div>
  {accounting&&<div className="panel panel-pad" style={{marginBottom:14}}><div className="role-strip"><div className="role-card"><small>Total funded</small><strong>{gen(accounting.total_funded)}</strong></div><div className="role-card"><small>Currently locked</small><strong>{gen(accounting.locked_total)}</strong></div><div className="role-card"><small>Accounting delta</small><strong>{String(accounting.conservation_delta)} wei</strong></div></div></div>}
  {!ready?<div className="empty">The live directory is not configured.</div>:isLoading?<div className="skeleton"/>:error?<div className="notice error">Finalized contract read failed. No cached or mock opportunities are shown.</div>:data.length===0?<div className="empty">No finalized opportunities yet. <Link href="/opportunities/new" className="meta">Create the first one <ArrowRight size={13}/></Link></div>:<div className="opportunity-list">{data.map(o=><Link className="opportunity-row" key={o.id} href={`/opportunities/${o.id}`}><div><h3>{o.title}</h3><div className="meta">#{o.id} · {o.repo_owner}/{o.repo_name} · candidate {shortAddress(o.candidate)}</div></div><div className="metric"><small>Candidate</small><strong>{gen(o.candidate_payment)}</strong></div><div className="metric"><small>Referral</small><strong>{gen(o.referral_reward)}</strong></div><div className="metric"><small>Referrer</small><strong>{o.referrer.startsWith('0x0000')?'open':shortAddress(o.referrer)}</strong></div><span className={`status ${o.state.toLowerCase()}`}>{o.state}</span></Link>)}</div>}
 </section></div>
}
