import { createAccount, createClient, isSuccessful } from "genlayer-js";
import { TransactionHashVariant } from "genlayer-js/types";
import type { Account, Address } from "viem";
import { quoteFees } from "./fees.js";
import { ConfigurationError, TransactionError, ValidationError, redactError } from "./errors.js";
import { CANONICAL, NETWORK, explorerTx } from "./constants.js";
import type { Campaign, CampaignAccounting, CreateCampaignInput, Position, ReferralRailV2Config, WriteResult } from "./types.js";

const normalize = (raw: unknown): any => raw instanceof Map ? Object.fromEntries([...raw.entries()].map(([k, v]) => [String(k), normalize(v)])) : Array.isArray(raw) ? raw.map(normalize) : raw && typeof raw === "object" ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, normalize(v)])) : raw;
const number = (v: unknown) => Number(v ?? 0);
const bigint = (v: unknown) => BigInt(v as string | number | bigint);
function campaign(raw: unknown): Campaign { const c = normalize(raw); return { ...c, id: number(c.id), max_positions: number(c.max_positions), successful: number(c.successful), occupied: number(c.occupied), open_positions: number(c.open_positions), failed: number(c.failed), candidate_reward: bigint(c.candidate_reward), referral_reward: bigint(c.referral_reward), unit_funding: bigint(c.unit_funding), initial_funding: bigint(c.initial_funding), paid_total: bigint(c.paid_total), refunded_total: bigint(c.refunded_total), locked_total: bigint(c.locked_total), participation_deadline: number(c.participation_deadline), state_code: number(c.state_code), created_at: number(c.created_at), closed_at: number(c.closed_at) } as Campaign; }
function position(raw: unknown): Position { const p = normalize(raw); return { ...p, campaign_id: number(p.campaign_id), position_id: number(p.position_id), state_code: number(p.state_code), reserved_at: number(p.reserved_at), reservation_deadline: number(p.reservation_deadline), accepted_at: number(p.accepted_at), work_deadline: number(p.work_deadline), pr_number: number(p.pr_number), attempts: number(p.attempts), active_attempt: number(p.active_attempt), judgment_timeout: number(p.judgment_timeout), retry_deadline: number(p.retry_deadline), outcome_code: number(p.outcome_code), candidate_paid: Boolean(p.candidate_paid), referrer_paid: Boolean(p.referrer_paid), settlement_released: Boolean(p.settlement_released) } as Position; }

export class ReferralRailV2Client {
  readonly referralRailAddress: Address; readonly outcomeJudgeAddress: Address; readonly client: ReturnType<typeof createClient>; readonly account?: Account;
  constructor(config: ReferralRailV2Config) {
    if ((config.chainId ?? CANONICAL.chainId) !== CANONICAL.chainId) throw new ConfigurationError(`ReferralRail v2 is locked to chain ${CANONICAL.chainId}.`);
    if ((config.rpcUrl ?? CANONICAL.rpcUrl) !== CANONICAL.rpcUrl && config.rpcUrl !== "https://studio-next.genlayer.com/api") throw new ConfigurationError(`ReferralRail v2 is locked to ${CANONICAL.rpcUrl}.`);
    this.referralRailAddress = config.referralRailAddress; this.outcomeJudgeAddress = config.outcomeJudgeAddress; this.account = typeof config.account === "string" || !config.account ? undefined : config.account;
    this.client = createClient({ chain: NETWORK, endpoint: CANONICAL.rpcUrl, ...(config.account ? { account: config.account } : {}) });
  }
  static fromPrivateKey(key: `0x${string}`, config: Omit<ReferralRailV2Config, "account">) { return new ReferralRailV2Client({ ...config, account: createAccount(key) }); }
  private get signer(): Account { if (!this.account) throw new ConfigurationError("This operation requires a signing account."); return this.account; }
  private async read(address: Address, functionName: string, args: unknown[] = []) { return this.client.readContract({ address, functionName, args: args as never[], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }); }
  async getCampaign(id: number) { return campaign(await this.read(this.referralRailAddress, "get_campaign", [id])); }
  async listCampaigns(options: { offset?: number; limit?: number } = {}) { const raw = normalize(await this.read(this.referralRailAddress, "list_campaigns", [options.offset ?? 0, options.limit ?? 40])); return (Array.isArray(raw) ? raw : Object.values(raw ?? {})).map(campaign); }
  async getPosition(campaignId: number, positionId: number) { return position(await this.read(this.referralRailAddress, "get_position", [campaignId, positionId])); }
  async listPositions(campaignId: number, options: { offset?: number; limit?: number } = {}) { const raw = normalize(await this.read(this.referralRailAddress, "list_positions", [campaignId, options.offset ?? 0, options.limit ?? 100])); return (Array.isArray(raw) ? raw : Object.values(raw ?? {})).map(position); }
  async getCampaignAccounting(id: number) { const a = normalize(await this.read(this.referralRailAddress, "get_campaign_accounting", [id])); return { ...a, initial_funding: bigint(a.initial_funding), paid: bigint(a.paid), refunded: bigint(a.refunded), still_locked: bigint(a.still_locked), available_capacity: number(a.available_capacity), occupied_capacity: number(a.occupied_capacity), successful: number(a.successful) } as CampaignAccounting; }
  async getProtocolConfig() { return normalize(await this.read(this.referralRailAddress, "get_protocol_config")); }
  async getJudgment(campaignId: number, positionId: number, attemptId: number) { const raw = normalize(await this.read(this.outcomeJudgeAddress, "get_judgment", [campaignId, positionId, attemptId])); return Object.keys(raw ?? {}).length ? raw : null; }
  async createCampaign(input: CreateCampaignInput): Promise<WriteResult> { const args = [input.title, input.brief, input.criteria, input.repoOwner, input.repoName, input.baseBranch, input.maxPositions, input.candidateReward, input.referralReward, input.reservationWindowSeconds, input.workDurationSeconds, input.campaignDurationSeconds, input.maxPendingPerReferrer]; const result = await this.write("create_campaign", args, BigInt(input.maxPositions) * (input.candidateReward + input.referralReward)); return result; }
  async createReferral(campaignId: number, candidate: Address) { return this.write("create_referral", [campaignId, candidate], 0n); }
  async acceptReferral(campaignId: number, positionId: number, githubLogin: string) { return this.write("accept_referral", [campaignId, positionId, githubLogin], 0n); }
  async declineReferral(campaignId: number, positionId: number) { return this.write("decline_referral", [campaignId, positionId], 0n); }
  async releaseReferral(campaignId: number, positionId: number) { return this.write("release_referral", [campaignId, positionId], 0n); }
  async submitWork(campaignId: number, positionId: number, prNumber: number) { return this.write("submit_work", [campaignId, positionId, prNumber], 0n); }
  async retryInconclusive(campaignId: number, positionId: number, prNumber: number) { return this.write("retry_inconclusive", [campaignId, positionId, prNumber], 0n); }
  async resolveJudgment(campaignId: number, positionId: number, attemptId: number) { return this.write("resolve_judgment", [campaignId, positionId, attemptId], 0n); }
  async settlePosition(campaignId: number, positionId: number) { return this.write("settle_position", [campaignId, positionId], 0n); }
  async recoverPosition(campaignId: number, positionId: number) { return this.write("recover_position", [campaignId, positionId], 0n); }
  async closeIntake(campaignId: number) { return this.write("close_intake", [campaignId], 0n); }
  async finaliseCampaign(campaignId: number) { return this.write("finalise_campaign", [campaignId], 0n); }
  async cancelCampaign(campaignId: number) { return this.write("cancel_campaign", [campaignId], 0n); }
  private async write(method: string, args: unknown[], value: bigint): Promise<WriteResult> { try { const account = this.signer; let recipients: Address[] = []; if (method === "settle_position") { const p = await this.getPosition(Number(args[0]), Number(args[1])); recipients = [p.candidate, p.referrer]; } else if (method === "finalise_campaign") { const c = await this.getCampaign(Number(args[0])); recipients = [c.employer]; } const fees = await quoteFees(this.client, method, args, account, this.referralRailAddress, value, recipients); const hash = await this.client.writeContract({ account, address: this.referralRailAddress, functionName: method, args: args as never[], value, fees }); const txHash = hash as `0x${string}`; await this.client.waitForDecision({ hash: txHash as never, retries: 240, interval: 5000, fullTransaction: true }); try { await this.client.finalizeTransaction({ txId: txHash as never }); } catch { /* permissionless keeper may have finalized it */ } const tx = await this.client.waitForFinalization({ hash: txHash as never, retries: 240, interval: 5000, fullTransaction: true }); if (!isSuccessful(tx as never)) throw new TransactionError(`${method} finalized unsuccessfully.`, { transaction: tx }); return { txHash, successful: true, finalized: true, explorerUrl: explorerTx(txHash), transaction: tx }; } catch (error) { if (error instanceof TransactionError || error instanceof ConfigurationError || error instanceof ValidationError) throw error; throw new TransactionError(`${method} failed: ${redactError(error)}`, error); } }
}
