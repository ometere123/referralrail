# ReferralRail v2 security model

The protocol enforces exact funding, role separation, immutable referral attribution, one accepted wallet participation per campaign, identity replay protection, bounded attempts, stale callback checks, double-settlement guards, capacity bounds, strict URL parsing, exact host policy, bounded source size, source outage safety, prompt-injection resistance, and finalized payout readback.

PUBLIC_WEB host restrictions are exact against the submitted URL host. Redirect final-origin verification is not claimed because the current GenLayer web API does not expose the final redirect chain. Unrestricted PUBLIC_WEB is the universal path for public platforms and future sites.
