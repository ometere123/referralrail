"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WalletProvider } from "@/lib/genlayer/wallet";
export default function Providers({children}:{children:React.ReactNode}){
  const [client]=useState(()=>new QueryClient({defaultOptions:{queries:{retry:2,staleTime:3_000}}}));
  return <QueryClientProvider client={client}><WalletProvider>{children}</WalletProvider></QueryClientProvider>;
}
