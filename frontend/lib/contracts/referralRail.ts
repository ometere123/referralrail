import { readFinal, settlementAddress, judgeAddress } from "../genlayer/client";

export type OpportunityState = "OPEN"|"REFERRED"|"ACCEPTED"|"JUDGING"|"INCONCLUSIVE"|"PAID"|"REFUNDED"|"EXPIRED"|"CANCELLED";
export type Outcome = "NONE"|"COMPLETED"|"NOT_COMPLETED"|"INCONCLUSIVE";
export type Opportunity = {
  id:number; employer:string; candidate:string; title:string; brief:string; acceptance_criteria:string;
  repo_owner:string; repo_name:string; candidate_payment:number|string|bigint; referral_reward:number|string|bigint;
  funded_amount:number|string|bigint; created_at:number; referral_deadline:number; completion_deadline:number;
  state:OpportunityState; state_code:number; referrer:string; candidate_github:string; referred_at:number; accepted_at:number;
  active_attempt:number; attempt_count:number; active_pr_number:number; evidence_submitted_at:number; judgment_timeout_at:number;
  retry_deadline:number; last_outcome:Outcome; last_outcome_code:number; last_evidence_digest:string; last_reason:string; last_audit:string; closed_at:number;
};
export type Accounting={ total_funded:number|string|bigint; total_paid:number|string|bigint; total_refunded:number|string|bigint; locked_total:number|string|bigint; conservation_delta:number|string|bigint };
export type Judgment={ opportunity_id:number; attempt_id:number; outcome:string; evidence_digest:string; reason:string; audit:string; decided_at:number };

function normalise(value:any):any {
  if(value instanceof Map){ const obj:any={}; for(const [k,v] of value.entries()) obj[String(k)]=normalise(v); return obj; }
  if(Array.isArray(value)) return value.map(normalise);
  if(value && typeof value==='object'){ const out:any={}; for(const [k,v] of Object.entries(value)) out[k]=normalise(v); return out; }
  if(typeof value==='bigint') return value;
  return value;
}
function asOpportunity(raw:any):Opportunity { return normalise(raw) as Opportunity; }

export function configured(){ return !!settlementAddress() && !!judgeAddress(); }
export async function getOpportunity(id:number){ if(!settlementAddress()) throw new Error("Settlement contract not configured"); return asOpportunity(await readFinal(settlementAddress(),"get_opportunity",[id])); }
export async function listOpportunities(){ if(!settlementAddress()) return [] as Opportunity[]; const raw=normalise(await readFinal(settlementAddress(),"list_opportunities",[0,40])); return (Array.isArray(raw)?raw:Object.values(raw||{})).map(asOpportunity); }
export async function getAccounting(){ if(!settlementAddress()) return null; return normalise(await readFinal(settlementAddress(),"get_accounting",[])) as Accounting; }
export async function getJudgment(opportunityId:number,attemptId:number){ if(!judgeAddress()||!attemptId) return null; const raw=normalise(await readFinal(judgeAddress(),"get_judgment",[opportunityId,attemptId])); return Object.keys(raw||{}).length ? raw as Judgment : null; }
