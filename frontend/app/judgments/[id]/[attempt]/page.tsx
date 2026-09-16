"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useJudgment } from "@/lib/hooks/useProtocol";

export default function JudgmentPage(){const params=useParams<{id:string;attempt:string}>(); const id=Number(params.id), attempt=Number(params.attempt); const {data,isLoading,error}=useJudgment(id,attempt); return <div className="container"><section className="section"><div className="eyebrow">OutcomeJudge · attempt {attempt}</div><h1 style={{margin:'10px 0 12px'}}>Judgment record</h1>{isLoading?<div className="skeleton"/>:error?<div className="notice error">Could not read this finalized judgment.</div>:!data?<div className="empty">No finalized judgment exists for this opportunity and attempt.</div>:<div className="panel panel-pad"><h2>{data.outcome}</h2><p className="prose">{data.reason}</p><div className="kv"><span>Evidence digest</span><code>{data.evidence_digest||'none'}</code></div><div className="audit">{data.audit}</div><div className="hero-actions"><Link className="button secondary" href={`/opportunities/${id}`}>Back to opportunity</Link></div></div>}</section></div>}
