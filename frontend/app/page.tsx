"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle2, GitPullRequest, Handshake, LockKeyhole, SplitSquareHorizontal } from "lucide-react";
import { configured } from "@/lib/contracts/referralRail";
import { Lifecycle } from "@/components/Lifecycle";

export default function Home(){
 const ready=configured();
 return <>
  {!ready&&<div className="config-banner"><strong>Deployment not configured.</strong> The UI contains no simulated contract results. Set both deployed 61997 addresses in <code>frontend/.env</code> after deployment.</div>}
  <div className="container">
   <section className="hero">
    <div><div className="eyebrow">Future of Work · outcome-based referral payments</div><h1>Lock the referral <em>before</em> the outcome.</h1>
      <p className="hero-copy">ReferralRail turns “who introduced whom?” from a private spreadsheet into economic protocol state. The employer commits funds, the candidate accepts the referrer on-chain, and GenLayer verifies finished work before the payment split can happen.</p>
      <div className="hero-actions"><Link className="button primary" href="/opportunities/new">Fund an opportunity <ArrowRight size={17}/></Link><a className="button secondary" href="#live">View protocol state</a></div>
    </div>
    <div className="hero-card">
      <div className="ticket-label">Referral receipt · attribution locked first</div><div className="ticket-title">One job. Three parties. No private attribution ledger.</div>
      <div className="route"><div className="route-node"><Handshake size={19}/><strong>Referrer</strong><small>introduces</small></div><span className="route-arrow">→</span><div className="route-node"><LockKeyhole size={19}/><strong>Candidate</strong><small>accepts</small></div><span className="route-arrow">→</span><div className="route-node"><GitPullRequest size={19}/><strong>GenLayer</strong><small>verifies</small></div></div>
      <div className="split"><div><span className="ticket-label">Candidate</span><strong>work payment</strong></div><div><span className="ticket-label">Referrer</span><strong>referral reward</strong></div></div>
    </div>
   </section>

   <section className="section"><div className="grid-3">
    <div className="principle-card"><span className="num">01 / ATTRIBUTION</span><h3>A referral cannot be silently claimed.</h3><p>The referrer can nominate only the funded candidate, and the candidate must explicitly accept before any work evidence is eligible.</p></div>
    <div className="principle-card"><span className="num">02 / JUDGMENT</span><h3>Metadata is not the verdict.</h3><p>GitHub facts are checked deterministically. GenLayer then evaluates the merged changes against the frozen natural-language brief and validators independently reproduce the decision.</p></div>
    <div className="principle-card"><span className="num">03 / MONEY</span><h3>Consensus has a consequence.</h3><p>COMPLETED releases the exact candidate/referrer split. NOT_COMPLETED refunds. INCONCLUSIVE opens one bounded cure path instead of pretending missing evidence is failure.</p></div></div>
   </section>

   <section className="section" id="live"><div className="panel panel-pad"><div className="section-heading"><div><div className="eyebrow">Durable contract state</div><h2>Explore live opportunities</h2></div><p>Browse finalized ReferralRail state and take the action available to your wallet.</p></div><div className="hero-actions"><Link className="button primary" href="/opportunities">Open opportunity directory <ArrowRight size={17}/></Link><Link className="button secondary" href="/dashboard">View my dashboard</Link></div>{!ready&&<div className="notice warning" style={{marginTop:18}}>The directory needs deployed contract addresses before live reads can load.</div>}</div></section>

   <section className="section"><div className="section-heading"><div><div className="eyebrow">The protocol path</div><h2>Attribution first, judgment second.</h2></div><p>The order is the product. A referrer earns only if the candidate accepted that referral before evidence was submitted and the job is later verified.</p></div><div className="panel panel-pad"><Lifecycle state="PAID"/></div></section>

   <section className="section"><div className="panel panel-pad" style={{display:'grid',gridTemplateColumns:'1fr auto',gap:20,alignItems:'center'}}><div><div className="eyebrow">Why GenLayer</div><h2 style={{margin:'8px 0 8px',letterSpacing:'-.035em'}}>The employer cannot be the final judge of its own payout.</h2><p className="prose" style={{margin:0}}>The parties have conflicting incentives. ReferralRail fixes the money and attribution deterministically, restricts evidence to the registered GitHub repository, and uses validator consensus only for the part ordinary contracts cannot resolve: whether the actual merged work satisfies the frozen criteria.</p></div><CheckCircle2 size={42} color="var(--mint)"/></div></section>
  </div>
 </>
}
