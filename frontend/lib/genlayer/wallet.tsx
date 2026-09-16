"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ensureStudioNext, provider } from "./client";
import { GENLAYER_CHAIN } from "./network";

type WalletState = {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  correctNetwork: boolean;
  busy: boolean;
  error: string;
  connect(): Promise<void>;
  switchNetwork(): Promise<void>;
  disconnect(): Promise<void>;
};
const Context = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address,setAddress]=useState<string|null>(null);
  const [chainId,setChainId]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [hidden,setHidden]=useState(false);

  const refresh=useCallback(async()=>{
    const p=provider(); if(!p){ setAddress(null); setChainId(null); return; }
    const accounts=(await p.request({method:"eth_accounts"})) as string[];
    const chain=String(await p.request({method:"eth_chainId"}));
    if(!hidden){ setAddress(accounts?.[0] || null); setChainId(parseInt(chain,16)); }
  },[hidden]);

  useEffect(()=>{ void refresh(); const p=provider(); if(!p?.on) return;
    const handler=()=>void refresh(); p.on("accountsChanged",handler); p.on("chainChanged",handler);
    return()=>{ p.removeListener?.("accountsChanged",handler); p.removeListener?.("chainChanged",handler); };
  },[refresh]);

  const connect=useCallback(async()=>{ setBusy(true); setError(""); try{
    const p=provider(); if(!p) throw new Error("Install a compatible browser wallet first.");
    await p.request({method:"eth_requestAccounts"}); setHidden(false); await ensureStudioNext(); await refresh();
  }catch(e:any){ setError(e?.message || "Wallet connection failed"); }finally{ setBusy(false); } },[refresh]);

  const switchNetwork=useCallback(async()=>{ setBusy(true); setError(""); try{ await ensureStudioNext(); await refresh(); }
    catch(e:any){ setError(e?.message || "Network switch failed"); } finally{ setBusy(false); } },[refresh]);
  const disconnect=useCallback(async()=>{ setBusy(true); setError(""); try{
    const p=provider();
    try{ await p?.request({method:"wallet_revokePermissions",params:[{eth_accounts:{}}]}); }catch{}
    setHidden(true); setAddress(null); setChainId(null);
  }finally{setBusy(false);} },[]);

  const value=useMemo(()=>({address,chainId,connected:!!address,correctNetwork:chainId===GENLAYER_CHAIN.id,busy,error,connect,switchNetwork,disconnect}),[address,chainId,busy,error,connect,switchNetwork,disconnect]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useWallet(){ const v=useContext(Context); if(!v) throw new Error("WalletProvider missing"); return v; }
