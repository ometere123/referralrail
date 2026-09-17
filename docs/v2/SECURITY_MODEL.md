# Security model

The employer cannot self-refer, rewrite terms, or choose the judgment. A candidate cannot accept another wallet's referral. A referrer cannot exceed its pending reservation bound. GitHub identity reuse is blocked within a campaign.

Payouts are gated by finalized contract state. Every write must be finalized and read back. The SDK and MCP reject missing signers, wrong chain, and unsupported methods. Evidence fields are treated as untrusted data by the judge.
