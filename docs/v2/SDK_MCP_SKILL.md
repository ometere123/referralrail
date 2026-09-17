# SDK, MCP, and Skill

The v2 SDK is exported as `@referralrail/sdk/v2` and provides typed campaign, position, accounting, and judgment reads plus named lifecycle writes. It locks chain 61997 and the canonical RPC, quotes message and external transfer fees, explicitly attempts finalisation, and verifies the resulting state.

MCP is read-only by default. V2 tools are registered only when both v2 addresses are configured. Writes additionally require `REFERRALRAIL_WRITE_ENABLED=true` and a process signer. Keys and arbitrary method names are never tool arguments.

The portable Skill in `.agents/skills/referralrail/SKILL.md` documents capacity, judgment, retry, recovery, settlement, and evidence rules.
