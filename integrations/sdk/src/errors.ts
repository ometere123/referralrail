export class ReferralRailError extends Error { constructor(message: string, public readonly code = "REFERRALRAIL_ERROR", public readonly details?: unknown) { super(message); this.name = "ReferralRailError"; } }
export class ConfigurationError extends ReferralRailError { constructor(message: string, details?: unknown) { super(message, "CONFIGURATION_ERROR", details); } }
export class ValidationError extends ReferralRailError { constructor(message: string, details?: unknown) { super(message, "VALIDATION_ERROR", details); } }
export class TransactionError extends ReferralRailError { constructor(message: string, details?: unknown) { super(message, "TRANSACTION_ERROR", details); } }

export function redactError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/0x[a-fA-F0-9]{64}/g, "0x<redacted>").replace(/(private|secret|seed|mnemonic|key)[^\s:=]*[\s:=]+[^\s,;]+/gi, "$1=<redacted>");
}
