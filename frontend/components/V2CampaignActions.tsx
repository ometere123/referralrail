"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { SubmitInput } from "@genlayer/transaction-kit-react";
import VerifiedTransaction from "@/components/VerifiedTransaction";
import { useWallet } from "@/lib/genlayer/wallet";
import { v2Address, v2Campaign, v2Positions } from "@/lib/genlayer/v2";
import { shortAddress } from "@/lib/format";
import { validAddress, validPublicEvidenceUrl } from "@/lib/v2Validation";

type Props = { campaign: any; positions: any[] };
const same = (a: unknown, b: unknown) => String(a || "").toLowerCase() === String(b || "").toLowerCase();

function Write({ campaign, method, args, label, verify }: { campaign: any; method: string; args: unknown[]; label: string; verify: (campaign: any, positions: any[]) => boolean }) {
  const tx = { kind: "write", address: v2Address() as `0x${string}`, method, args } as SubmitInput;
  return <div className="panel panel-pad" style={{ marginTop: 12 }}><strong>{label}</strong><VerifiedTransaction tx={tx} verify={async () => { const [nextCampaign, nextPositions] = await Promise.all([v2Campaign(campaign.id), v2Positions(campaign.id)]); return verify(nextCampaign, nextPositions); }} onVerified={async () => { window.location.reload(); }} /></div>;
}

function PositionActions({ campaign, position, wallet }: { campaign: any; position: any; wallet: any }) {
  const [login, setLogin] = useState("");
  const [pr, setPr] = useState("");
  const [evidence, setEvidence] = useState("");
  const verifyState = (states: string[]) => (_next: any, nextPositions: any[]) => nextPositions.some((item) => item.position_id === position.position_id && states.includes(item.state));
  const mine = same(wallet.address, position.candidate);
  const referrer = same(wallet.address, position.referrer);
  const evidenceOk = validPublicEvidenceUrl(evidence, campaign.allowed_host || "");
  const retryEvidenceOk = validPublicEvidenceUrl(evidence, campaign.allowed_host || "");

  return <div className="panel panel-pad" style={{ marginTop: 12 }}>
    <div className="section-heading"><strong>Position #{position.position_id}</strong><span className={`status ${String(position.state).toLowerCase()}`}>{position.state}</span></div>
    {mine && position.state === "RESERVED" && <div className="field">
      {campaign.evidence_profile === "GITHUB_PR" ? <><label>Required GitHub identity</label><input value={login} onChange={(event) => setLogin(event.target.value)} placeholder="github-login" />{login.trim() && <Write campaign={campaign} method="accept_referral" args={[campaign.id, position.position_id, login.trim()]} label="Accept referral" verify={verifyState(["ACCEPTED"])} />}</> : <><p className="helper">No platform identity required for public web.</p><Write campaign={campaign} method="accept_referral" args={[campaign.id, position.position_id, ""]} label="Accept referral" verify={verifyState(["ACCEPTED"])} /></>}
    </div>}
    {(mine || referrer) && position.state === "RESERVED" && <Write campaign={campaign} method={referrer ? "release_referral" : "decline_referral"} args={[campaign.id, position.position_id]} label="Release this reservation" verify={verifyState(["EXPIRED", "DECLINED"])} />}
    {mine && position.state === "ACCEPTED" && campaign.evidence_profile === "GITHUB_PR" && <div className="field"><label>Pull request number</label><input type="number" min="1" value={pr} onChange={(event) => setPr(event.target.value)} placeholder="1" />{Number(pr) > 0 && Number.isInteger(Number(pr)) && <Write campaign={campaign} method="submit_work" args={[campaign.id, position.position_id, Number(pr)]} label="Submit work for judgment" verify={verifyState(["JUDGING"])} />}</div>}
    {mine && position.state === "ACCEPTED" && campaign.evidence_profile === "PUBLIC_WEB" && <div className="field"><label>Public HTTPS evidence URL</label><input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="https://..." />{evidence && <p className="helper">{evidenceOk ? "URL is valid for this campaign." : "Enter a public HTTPS URL matching the allowed-host policy."}</p>}{evidenceOk && <Write campaign={campaign} method="submit_evidence" args={[campaign.id, position.position_id, evidence.trim()]} label="Submit public evidence for judgment" verify={verifyState(["JUDGING"])} />}</div>}
    {mine && position.state === "INCONCLUSIVE" && <div className="field"><label>{campaign.evidence_profile === "GITHUB_PR" ? "Replacement pull request number" : "Replacement public evidence URL"}</label><input type={campaign.evidence_profile === "GITHUB_PR" ? "number" : "url"} min="1" value={campaign.evidence_profile === "GITHUB_PR" ? pr : evidence} onChange={(event) => campaign.evidence_profile === "GITHUB_PR" ? setPr(event.target.value) : setEvidence(event.target.value)} placeholder={campaign.evidence_profile === "GITHUB_PR" ? "1" : "https://..."} />{campaign.evidence_profile === "GITHUB_PR" ? (Number(pr) > 0 && Number.isInteger(Number(pr))) : retryEvidenceOk ? <Write campaign={campaign} method="retry_inconclusive" args={[campaign.id, position.position_id, campaign.evidence_profile === "GITHUB_PR" ? String(pr) : evidence.trim()]} label="Retry inconclusive judgment" verify={verifyState(["JUDGING"])} /> : null}</div>}
    {position.state === "JUDGING" && <Write campaign={campaign} method="resolve_judgment" args={[campaign.id, position.position_id, position.active_attempt]} label="Resolve finalized judgment" verify={verifyState(["COMPLETED", "FAILED", "INCONCLUSIVE"])} />}
    {position.state === "COMPLETED" && <Write campaign={campaign} method="settle_position" args={[campaign.id, position.position_id]} label="Settle candidate and referrer payouts" verify={(_next, nextPositions) => nextPositions.some((item) => item.position_id === position.position_id && item.state === "PAID" && item.settlement_released)} />}
    {["RESERVED", "ACCEPTED", "JUDGING", "INCONCLUSIVE"].includes(position.state) && <Write campaign={campaign} method="recover_position" args={[campaign.id, position.position_id]} label="Recover an expired or stalled position" verify={verifyState(["FAILED", "EXPIRED"])} />}
  </div>;
}

export default function V2CampaignActions({ campaign, positions }: Props) {
  const wallet = useWallet();
  const searchParams = useSearchParams();
  const linkRef = searchParams.get("ref") || "";
  const [candidate, setCandidate] = useState("");
  const [copied, setCopied] = useState(false);
  const referralLink = typeof window === "undefined" ? "" : `${window.location.origin}/v2/campaigns/${campaign.id}?ref=${wallet.address || ""}`;
  const copyReferralLink = async () => { if (!referralLink) return; await navigator.clipboard.writeText(referralLink); setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
  const show = (content: ReactNode) => content;
  if (!wallet.connected || !wallet.correctNetwork) return <div className="notice warning" style={{ marginTop: 18 }}>Connect a wallet on Studio chain 61997 to see role actions.</div>;
  const validRef = validAddress(linkRef) && !same(linkRef, campaign.employer) && !same(linkRef, wallet.address);
  const validCandidate = validAddress(candidate) && !same(candidate, campaign.employer) && !same(candidate, wallet.address);
  return <section className="panel panel-pad" style={{ marginTop: 18 }}>
    <div className="section-heading"><div><div className="eyebrow">Wallet actions</div><h2>Advance finalized protocol state</h2></div><span className="helper">Writes require a final readback.</span></div>
    {campaign.state === "ACTIVE" && !same(wallet.address, campaign.employer) && <div className="panel panel-pad" style={{ marginTop: 12 }}><strong>Referral link</strong><p className="helper">Share this link so a candidate can join without pre-registering their wallet.</p><button className="button secondary small" onClick={() => void copyReferralLink()}>{copied ? "Copied" : "Copy referral link"}</button></div>}
    {campaign.state === "ACTIVE" && linkRef && !same(wallet.address, campaign.employer) && <div className="panel panel-pad" style={{ marginTop: 12 }}><strong>Join via referral link</strong><p className="helper">{validRef ? `Referrer: ${shortAddress(linkRef)}` : "This referral link contains an invalid referrer address."}</p>{validRef && show(<Write campaign={campaign} method="join_via_referral" args={[campaign.id, linkRef]} label="Join this campaign" verify={(_next, nextPositions) => nextPositions.some((item) => same(item.candidate, wallet.address) && same(item.referrer, linkRef) && item.state === "RESERVED")} />)}</div>}
    {same(wallet.address, campaign.employer) && campaign.state === "ACTIVE" && campaign.occupied === 0 && <Write campaign={campaign} method="cancel_campaign" args={[campaign.id]} label="Cancel campaign and refund all unused escrow" verify={(next) => next.state === "CANCELLED"} />}
    {same(wallet.address, campaign.employer) && campaign.state === "ACTIVE" && <Write campaign={campaign} method="close_intake" args={[campaign.id]} label="Close campaign intake" verify={(next) => next.state === "RESOLVING"} />}
    {same(wallet.address, campaign.employer) && campaign.state === "RESOLVING" && <Write campaign={campaign} method="finalise_campaign" args={[campaign.id]} label="Finalise campaign and refund unused backing" verify={(next) => next.state === "REFUNDED"} />}
    {campaign.state === "ACTIVE" && <div className="field" style={{ marginTop: 12 }}><label>Candidate address for reservation</label><input value={candidate} onChange={(event) => setCandidate(event.target.value)} placeholder="0x..." />{candidate && <p className="helper">{validCandidate ? "Candidate address is valid." : "Enter a valid wallet address that is not the employer or connected wallet."}</p>}{validCandidate && <Write campaign={campaign} method="create_referral" args={[campaign.id, candidate.trim()]} label="Reserve candidate position" verify={(_next, nextPositions) => nextPositions.some((item) => same(item.candidate, candidate) && item.state === "RESERVED")} />}</div>}
    {positions.map((position) => <PositionActions key={position.position_id} campaign={campaign} position={position} wallet={wallet} />)}
  </section>;
}
