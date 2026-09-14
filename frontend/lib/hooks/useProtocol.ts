"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccounting, getJudgment, getOpportunity, listOpportunities } from "../contracts/referralRail";
export function useOpportunities(){ return useQuery({queryKey:["opportunities"],queryFn:listOpportunities,refetchInterval:12_000}); }
export function useOpportunity(id:number){ return useQuery({queryKey:["opportunity",id],queryFn:()=>getOpportunity(id),enabled:id>0,refetchInterval:8_000}); }
export function useAccounting(){ return useQuery({queryKey:["accounting"],queryFn:getAccounting,refetchInterval:15_000}); }
export function useJudgment(id:number,attempt:number){ return useQuery({queryKey:["judgment",id,attempt],queryFn:()=>getJudgment(id,attempt),enabled:id>0&&attempt>0,refetchInterval:10_000}); }
export function useInvalidateProtocol(){ const q=useQueryClient(); return async(id?:number)=>{ await Promise.all([q.invalidateQueries({queryKey:["opportunities"]}),q.invalidateQueries({queryKey:["accounting"]}),id?q.invalidateQueries({queryKey:["opportunity",id]}):Promise.resolve()]); }; }
