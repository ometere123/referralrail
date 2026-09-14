import { studioDevnet } from "genlayer-js/chains";

export const REFERRALRAIL_NETWORK = {
  chainId: 61997,
  chainName: "GenLayer Studio Next",
  rpcUrl: "https://studio-next.genlayer.com/api",
  explorerUrl: "https://explorer-studio-dev.genlayer.com",
  symbol: "GEN",
} as const;

const envChainId = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || REFERRALRAIL_NETWORK.chainId);
const envRpc = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || REFERRALRAIL_NETWORK.rpcUrl;
const envName = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || REFERRALRAIL_NETWORK.chainName;
const envExplorer = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL || REFERRALRAIL_NETWORK.explorerUrl;

if (envChainId !== REFERRALRAIL_NETWORK.chainId) {
  throw new Error(`ReferralRail is locked to chain 61997; configured ${envChainId}`);
}
if (envRpc !== REFERRALRAIL_NETWORK.rpcUrl) {
  throw new Error(`ReferralRail is locked to ${REFERRALRAIL_NETWORK.rpcUrl}`);
}

export const GENLAYER_CHAIN = {
  ...studioDevnet,
  id: REFERRALRAIL_NETWORK.chainId,
  name: envName,
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: [envRpc] } },
} satisfies typeof studioDevnet;

export const WALLET_NETWORK = {
  chainId: `0x${REFERRALRAIL_NETWORK.chainId.toString(16).toUpperCase()}`,
  chainName: envName,
  nativeCurrency: GENLAYER_CHAIN.nativeCurrency,
  rpcUrls: [envRpc],
  blockExplorerUrls: [envExplorer],
};

export const EXPLORER_URL = envExplorer;
