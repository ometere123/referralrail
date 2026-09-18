# v2 SDK, MCP and skill surface

The SDK exposes profile-aware campaign creation, generic identity fields, PUBLIC_WEB evidence submission, bounded retry, finalized reads, dynamic fee quoting, explorer URLs, and settlement readback.

The MCP surface exposes read-only v2 reads by default. Writes require explicit write enablement and a signer. v2 creation accepts GITHUB_PR or PUBLIC_WEB. The retry tool accepts a PR number or a replacement public HTTPS URL according to the frozen campaign mode.

The ReferralRail skill requires finalized transaction readback, candidate and referrer payout confirmation, exact accounting conservation, strict evidence ownership checks, and truthful redirect limitations.
