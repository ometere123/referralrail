"use client";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import { useOpportunities } from "@/lib/hooks/useProtocol";
import { gen, shortAddress } from "@/lib/format";

export default function DashboardPage(){
 const wallet=useWallet(); const {data=[],isLoading,error}=useOpportunities(); const addr=(wallet.address||'').toLowerCase();
 const mine=data.filter(o=>[o.employer,o.candidate,o.referrer].some(x=>x.toLowerCase()===addr));
 return <div className="container"><section className="section"><div className="section-heading"><div><div className="eyebrow">Wallet workspace</div><h1 style={{margin:'10px 0 12px'}}>Dashboard</h1><p className="prose">Your employer, candidate, and referrer positions across finalized ReferralRail state.</p></div><Link className="button secondary" href="/protocol"><Wallet size={16}/> Protocol status</Link></div>
 {!wallet.connected?<div className="panel panel-pad"><h2>Connect a wallet</h2><p className="prose">Connect on Studio Next chain 61997 to see the opportunities associated with your address.</p></div>:isLoading?<div className="skeleton"/>:error?<div className="notice error">Could not read finalized opportunities.</div>:mine.length===0?<div className="empty">No opportunities are associated with {shortAddress(wallet.address)} yet. <Link href="/opportunities" className="meta">Browse the directory <ArrowRight size={13}/></Link></div>:<div className="opportunity-list">{mine.map(o=><Link className="opportunity-row" key={o.id} href={`/opportunities/${o.id}`}><div><h3>{o.title}</h3><div className="meta">#{o.id} · {o.repo_owner}/{o.repo_name}</div></div><div className="metric"><small>Your role</small><strong>{o.employer.toLowerCase()===addr?'Employer':o.candidate.toLowerCase()===addr?'Candidate':'Referrer'}</strong></div><div className="metric"><small>Candidate</small><strong>{gen(o.candidate_payment)}</strong></div><span className={`status ${o.state.toLowerCase()}`}>{o.state}</span></Link>)}</div>}
 </section></div>
}
