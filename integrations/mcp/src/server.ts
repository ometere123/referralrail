import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { configuredClient, requireWrite } from "./config.js";

const id = z.number().int().positive(); const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/); const amount = z.string().regex(/^[0-9]+$/).transform(BigInt);
const state = (value: unknown) => JSON.parse(JSON.stringify(value, (_key, v) => typeof v === "bigint" ? v.toString() : v));
const text = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(state(value)) }], structuredContent: state(value) as Record<string, unknown> });

export function createReferralRailServer(): McpServer {
  const server = new McpServer({ name: "referralrail", version: "0.1.0" }); const { client, account, writeEnabled } = configuredClient();
  server.registerTool("referralrail_get_protocol", { description: "Read canonical ReferralRail protocol configuration.", inputSchema: {} }, async () => text(await client.getProtocolConfig()));
  server.registerTool("referralrail_list_opportunities", { description: "List finalized ReferralRail opportunities.", inputSchema: { offset: z.number().int().nonnegative().optional(), limit: z.number().int().min(1).max(40).optional() } }, async ({ offset, limit }) => text(await client.listOpportunities({ offset, limit })));
  server.registerTool("referralrail_get_opportunity", { description: "Read one finalized opportunity.", inputSchema: { opportunityId: id } }, async ({ opportunityId }) => text(await client.getOpportunity(opportunityId)));
  server.registerTool("referralrail_get_judgment", { description: "Read a finalized OutcomeJudge record.", inputSchema: { opportunityId: id, attemptId: id } }, async ({ opportunityId, attemptId }) => text(await client.getJudgment(opportunityId, attemptId)));
  server.registerTool("referralrail_get_accounting", { description: "Read finalized accounting conservation totals.", inputSchema: {} }, async () => text(await client.getAccounting()));
  server.registerTool("referralrail_get_available_actions", { description: "Determine legal actions from finalized state and an optional wallet address.", inputSchema: { opportunityId: id, address: address.optional() } }, async ({ opportunityId, address: actor }) => text(await client.getAvailableActions(opportunityId, { address: actor as `0x${string}` | undefined })));
  const write = (name: string, description: string, schema: Record<string, z.ZodTypeAny>, fn: (input: any) => Promise<unknown>) => server.registerTool(name, { description, inputSchema: schema }, async (input) => { requireWrite(writeEnabled, account); return text(await fn(input)); });
  write("referralrail_create_opportunity", "Create and fully fund an opportunity. Payable value is checked by the SDK.", { title: z.string().min(3), brief: z.string().min(20), acceptanceCriteria: z.string().min(20), repoOwner: z.string().min(1), repoName: z.string().min(1), candidateAddress: address, candidatePayment: amount, referralReward: amount, referralWindowSeconds: z.number().int().min(60), completionWindowSeconds: z.number().int().positive() }, x => client.createOpportunity({ ...x, candidateAddress: x.candidateAddress, candidatePayment: x.candidatePayment, referralReward: x.referralReward }));
  write("referralrail_create_referral", "Lock a third-party referral for the nominated candidate.", { opportunityId: id, candidateAddress: address }, x => client.createReferral(x.opportunityId, x.candidateAddress));
  write("referralrail_accept_referral", "Candidate accepts attribution and binds a GitHub login.", { opportunityId: id, githubLogin: z.string().min(1) }, x => client.acceptReferral(x.opportunityId, x.githubLogin));
  write("referralrail_submit_work", "Candidate submits a pull request number for consensus judgment.", { opportunityId: id, prNumber: id }, x => client.submitWork(x.opportunityId, x.prNumber));
  write("referralrail_retry_inconclusive", "Candidate uses a remaining bounded retry after an inconclusive judgment.", { opportunityId: id, prNumber: id }, x => client.retryInconclusive(x.opportunityId, x.prNumber));
  write("referralrail_resolve_judgment", "Pull a finalized OutcomeJudge result into ReferralRail state.", { opportunityId: id, attemptId: id }, x => client.resolveJudgment(x.opportunityId, x.attemptId));
  write("referralrail_settle_opportunity", "Release terminal funds after PAID or REFUNDED state is finalized.", { opportunityId: id }, x => client.settleOpportunity(x.opportunityId));
  write("referralrail_cancel_unreferred", "Employer cancels an unreferred opportunity and refunds it.", { opportunityId: id }, x => client.cancelUnreferred(x.opportunityId));
  write("referralrail_expire", "Apply a permitted pre-judgment timeout refund.", { opportunityId: id }, x => client.expire(x.opportunityId));
  write("referralrail_recover", "Apply bounded stalled-judgment or exhausted-inconclusive recovery.", { opportunityId: id }, x => client.recover(x.opportunityId));
  server.registerResource("referralrail-deployment", "referralrail://deployment", { description: "Canonical ReferralRail deployment.", mimeType: "application/json" }, async () => ({ contents: [{ uri: "referralrail://deployment", mimeType: "application/json", text: JSON.stringify({ chainId: 61997, rpc: "https://studio-dev.genlayer.com/api", referralRail: "0x935A6fD995b4db5d64E1139D57a37a3f73BE2Ef8", outcomeJudge: "0x7842393CeEAB5F053B3024673B5986fDdb95A4C9" }) }] }));
  server.registerResource("referralrail-protocol", "referralrail://protocol", { description: "Protocol safety rules.", mimeType: "text/plain" }, async () => ({ contents: [{ uri: "referralrail://protocol", mimeType: "text/plain", text: "Use finalized state as authority. A PAID or REFUNDED state is not proof of released funds until settlement_released is true. OutcomeJudge owns completion judgment." }] }));
  return server;
}
