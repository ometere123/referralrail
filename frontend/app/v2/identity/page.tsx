"use client";

import { useEffect, useState } from "react";
import type { SubmitInput } from "@genlayer/transaction-kit-react";
import Link from "next/link";
import VerifiedTransaction from "@/components/VerifiedTransaction";
import { useWallet } from "@/lib/genlayer/wallet";
import { identityAddress, readIdentity } from "@/lib/genlayer/identity";

export default function V2IdentityPage() {
  const wallet = useWallet();
  const [github, setGithub] = useState("ometere123");
  const [xHandle, setXHandle] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const [githubIdentity, setGithubIdentity] = useState<any>();
  const [xIdentity, setXIdentity] = useState<any>();
  const [error, setError] = useState("");
  const refresh = async () => {
    if (!wallet.address || !identityAddress()) return;
    try {
      const [g, x] = await Promise.all([readIdentity(wallet.address, "GITHUB"), readIdentity(wallet.address, "X")]);
      setGithubIdentity(g);
      setXIdentity(x);
    } catch (e) { setError(String(e)); }
  };
  useEffect(() => { void refresh(); }, [wallet.address]);
  const tx = (method: string, args: unknown[], verify: () => Promise<boolean>) => <VerifiedTransaction tx={{ kind: "write", address: identityAddress() as any, method, args } as SubmitInput} verify={verify} onVerified={refresh} />;
  return <div className="container"><section className="section"><Link href="/v2" className="meta">← Back to v2 campaigns</Link><div className="eyebrow" style={{ marginTop: 18 }}>ReferralIdentityV2 · chain 61997</div><h1>Verify a public work identity</h1><p className="prose">Identity proofs are recorded on GenLayer. Temporary challenges are fetched from public GitHub or X surfaces by validators.</p>{!wallet.connected ? <div className="notice warning">Connect a wallet to request an identity challenge.</div> : !identityAddress() ? <div className="notice warning">Set NEXT_PUBLIC_REFERRAL_IDENTITY_V2_ADDRESS in the v2 preview environment.</div> : <div className="detail-grid" style={{ marginTop: 24 }}><div className="panel panel-pad"><h2>GitHub</h2><div className="field"><label>GitHub login</label><input value={github} onChange={(e) => setGithub(e.target.value)} /></div>{githubIdentity?.state === "PENDING" ? <><p className="helper">Place this exact challenge in your public GitHub bio, then complete verification.</p><code style={{ wordBreak: "break-all" }}>{githubIdentity.challenge}</code><div className="hero-actions">{tx("complete_github", [], async () => (await readIdentity(wallet.address || "", "GITHUB")).state === "ACTIVE")}</div></> : <div className="hero-actions">{tx("request_github", [github], async () => (await readIdentity(wallet.address || "", "GITHUB")).state === "PENDING")}</div>}{githubIdentity?.state === "ACTIVE" && <div className="notice success">Active canonical GitHub identity: {githubIdentity.canonical_id}</div>}</div><div className="panel panel-pad"><h2>X</h2><div className="field"><label>X handle</label><input value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@handle" /></div>{xIdentity?.state === "PENDING" ? <><p className="helper">Publish the exact challenge in a public X post, then paste its status URL.</p><code style={{ wordBreak: "break-all" }}>{xIdentity.challenge}</code><input value={statusUrl} onChange={(e) => setStatusUrl(e.target.value)} placeholder="https://x.com/handle/status/123" />{statusUrl && <div className="hero-actions">{tx("complete_x", [statusUrl], async () => (await readIdentity(wallet.address || "", "X")).state === "ACTIVE")}</div>}</> : <div className="hero-actions">{xHandle && tx("request_x", [xHandle], async () => (await readIdentity(wallet.address || "", "X")).state === "PENDING")}</div>}{xIdentity?.state === "ACTIVE" && <div className="notice success">Active X identity: @{xIdentity.handle}</div>}</div></div>}{error && <div className="notice error" style={{ marginTop: 18 }}>{error}</div>}</section></div>;
}


