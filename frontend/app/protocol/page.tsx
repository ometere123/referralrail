"use client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useAccounting } from "@/lib/hooks/useProtocol";
import { judgeAddress, settlementAddress } from "@/lib/genlayer/client";
import { EXPLORER_URL, REFERRALRAIL_NETWORK } from "@/lib/genlayer/network";
import { gen } from "@/lib/format";

const row={display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"12px 0",borderBottom:"1px solid #243642"} as const;
const address={display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",fontSize:12,color:"#acbbc4"} as const;
export default function ProtocolPage(){
 const {data:accounting}=useAccounting(); const explorer=EXPLORER_URL.replace(/\/$/,"");
 return <div className="container"><section className="section"><div className="eyebrow">Public protocol status</div><h1 style={{margin:"10px 0 12px"}}>ReferralRail on GenLayer</h1><p className="prose">The contract is the authority for funding, attribution, evidence, judgment, and settlement. This page exposes the network and live accounting readback.</p><div className="detail-grid" style={{marginTop:24}}><div className="panel brief-card"><h2>Network</h2><div className="kv"><span>Chain</span><strong>{REFERRALRAIL_NETWORK.chainName} · {REFERRALRAIL_NETWORK.chainId}</strong></div><div className="kv"><span>RPC</span><strong>{REFERRALRAIL_NETWORK.rpcUrl}</strong></div><div className="kv"><span>Explorer</span><a className="meta" href={explorer} target="_blank" rel="noreferrer">Open explorer <ExternalLink size={13}/></a></div></div><div className="panel brief-card"><h2>Contracts</h2><div style={row}><span>ReferralRail</span><a style={address} href={`${explorer}/address/${settlementAddress()}`} target="_blank" rel="noreferrer">{settlementAddress()} <ExternalLink size={13}/></a></div><div style={{...row,borderBottom:0}}><span>OutcomeJudge</span><a style={address} href={`${explorer}/address/${judgeAddress()}`} target="_blank" rel="noreferrer">{judgeAddress()} <ExternalLink size={13}/></a></div></div></div>{accounting&&<div className="panel panel-pad" style={{marginTop:18}}><h2>Accounting readback</h2><div className="role-strip"><div className="role-card"><small>Total funded</small><strong>{gen(accounting.total_funded)}</strong></div><div className="role-card"><small>Total paid</small><strong>{gen(accounting.total_paid)}</strong></div><div className="role-card"><small>Total refunded</small><strong>{gen(accounting.total_refunded)}</strong></div><div className="role-card"><small>Conservation delta</small><strong>{String(accounting.conservation_delta)} wei</strong></div></div></div>}<div className="hero-actions"><Link className="button secondary" href="/opportunities">Browse opportunities</Link></div></section></div>;
}
