export type V2ValidationInput = {
  title: string;
  brief: string;
  criteria: string;
  evidenceProfile: "GITHUB_PR" | "PUBLIC_WEB";
  owner: string;
  repo: string;
  branch: string;
  allowedHost: string;
  maxPositions: string;
  pending: string;
  candidateReward: bigint;
  referralReward: bigint;
  reservationSeconds: number;
  workSeconds: number;
  campaignSeconds: number;
};

const HOST_LABEL = /^(?=.{1,63}$)(?!-)[a-z0-9-]+(?<!-)$/;
const GITHUB_OWNER = /^(?=.{1,39}$)(?!-)[A-Za-z0-9-]+(?<!-)$/;
const GITHUB_REPO = /^(?=.{1,100}$)(?![.]{1,2}$)[A-Za-z0-9][A-Za-z0-9._-]*$/;
const BRANCH = /^(?=.{1,120}$)[^\s\~^:?*\[\]]+$/;

export function validHost(value: string): boolean {
  const host = value.trim().toLowerCase();
  if (!host) return true;
  if (host.includes("://") || host.includes("/") || host.includes("@") || host.includes(":") || host.includes("?") || host.includes("#")) return false;
  const labels = host.split(".");
  return labels.length >= 2 && labels.every((label) => HOST_LABEL.test(label));
}

export function validAddress(value: string): value is `0x${string}` {
  const address = value.trim();
  return /^0x[0-9a-fA-F]{40}$/.test(address) && !/^0x0{40}$/i.test(address);
}

export function validPublicEvidenceUrl(value: string, allowedHost = ""): boolean {
  try {
    const parsed = new URL(value.trim());
    if (value.trim().length > 300 || value.includes("@") || parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "::1") return false;
    const parts = hostname.split(".");
    if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
      const octets = parts.map(Number);
      if (octets.some((part) => part > 255)) return false;
      const [a, b] = octets;
      if (a === 0 || a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) return false;
    }
    return !allowedHost.trim() || hostname === allowedHost.trim().toLowerCase();
  } catch {
    return false;
  }
}

export function validateV2Campaign(input: V2ValidationInput): string {
  const title = input.title.trim();
  const brief = input.brief.trim();
  const criteria = input.criteria.trim();
  if (title.length < 3 || title.length > 120) return "Title must be between 3 and 120 characters.";
  if (brief.length < 20 || brief.length > 2600) return "Brief must be between 20 and 2600 characters.";
  if (criteria.length < 20 || criteria.length > 2600) return "Criteria must be between 20 and 2600 characters.";
  const maxPositions = Number(input.maxPositions);
  const pending = Number(input.pending);
  if (!Number.isInteger(maxPositions) || maxPositions <= 0 || maxPositions > 1000) return "Max positions must be an integer from 1 to 1000.";
  if (!Number.isInteger(pending) || pending <= 0 || pending > maxPositions) return "Pending positions per referrer must be between 1 and max positions.";
  if (input.candidateReward <= 0n || input.referralReward <= 0n) return "Both rewards must be positive.";
  if (input.reservationSeconds < 60 || input.reservationSeconds > 3888000) return "Reservation window is outside the protocol bounds.";
  if (input.workSeconds < 60 || input.workSeconds > 3888000) return "Work duration is outside protocol bounds.";
  if (input.campaignSeconds <= input.workSeconds || input.campaignSeconds > 3888000) return "Campaign duration must exceed work duration and stay within protocol bounds.";
  if (input.evidenceProfile === "GITHUB_PR") {
    if (!GITHUB_OWNER.test(input.owner.trim())) return "GitHub owner must be a structured ASCII username, not a URL.";
    if (!GITHUB_REPO.test(input.repo.trim())) return "Repository must be a structured ASCII slug, not a URL.";
    if (!BRANCH.test(input.branch.trim())) return "Base branch must be a non-empty bounded branch name.";
  } else if (!validHost(input.allowedHost)) {
    return "Allowed host must be a hostname only, such as medium.com or docs.example.com.";
  }
  return "";
}
