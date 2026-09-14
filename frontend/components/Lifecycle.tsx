import { Check, Circle, LoaderCircle } from "lucide-react";
const steps=[['OPEN','Funded'],['REFERRED','Referral locked'],['ACCEPTED','Candidate accepted'],['JUDGING','Evidence + consensus'],['PAID','Split paid']];
const rank:Record<string,number>={OPEN:0,REFERRED:1,ACCEPTED:2,JUDGING:3,INCONCLUSIVE:3,PAID:4,REFUNDED:4,EXPIRED:4,CANCELLED:4};
export function Lifecycle({state}:{state:string}){
 const current=rank[state]??0; const abnormal=['INCONCLUSIVE','REFUNDED','EXPIRED','CANCELLED'].includes(state);
 return <div className="lifecycle" aria-label={`Protocol state ${state}`}>
  {steps.map(([key,label],i)=>{const done=i<current||state==='PAID';const active=i===current&&!abnormal;return <div className={`life-step ${done?'done':''} ${active?'active':''}`} key={key}>
    <span className="life-node">{done?<Check size={14}/>:active?<LoaderCircle size={14}/>:<Circle size={12}/>}</span>
    <span><strong>{label}</strong><small>{i===0?'Employer commits funds':i===1?'Attribution becomes visible':i===2?'Attribution becomes immutable':i===3?'GitHub facts + substantive review':'Candidate + referrer paid'}</small></span>
  </div>})}
  {abnormal&&<div className={`branch-state ${state.toLowerCase()}`}>{state.replace('_',' ')}</div>}
 </div>
}
