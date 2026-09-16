"use client";
import { readFinal, settlementAddress } from "./client";

export function v2Address(): string { return process.env.NEXT_PUBLIC_REFERRALRAIL_V2_ADDRESS || ""; }
export function v2JudgeAddress(): string { return process.env.NEXT_PUBLIC_OUTCOME_JUDGE_V2_ADDRESS || ""; }
function normalise(value: any): any { if(value instanceof Map){ const out:any={}; for(const [k,v] of value.entries()) out[String(k)]=normalise(v); return out; } if(Array.isArray(value)) return value.map(normalise); if(value && typeof value==='object'){ const out:any={}; for(const [k,v] of Object.entries(value)) out[k]=normalise(v); return out; } return value; }
export function v2Configured(){ return Boolean(v2Address() && v2JudgeAddress()); }
export async function v2Campaigns(){ if(!v2Address()) return []; const raw=normalise(await readFinal(v2Address(),"list_campaigns",[0,50])); return Array.isArray(raw)?raw:Object.values(raw||{}); }
export async function v2Campaign(id:number){ if(!v2Address()) throw new Error("V2 contract is not configured"); return normalise(await readFinal(v2Address(),"get_campaign",[id])); }
export async function v2Positions(id:number){ if(!v2Address()) return []; const raw=normalise(await readFinal(v2Address(),"list_positions",[id,0,100])); return Array.isArray(raw)?raw:Object.values(raw||{}); }
