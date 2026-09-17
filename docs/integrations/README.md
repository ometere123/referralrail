# ReferralRail integrations

ReferralRail contracts remain the authority. The SDK lets applications use the protocol, the MCP server lets agents call the SDK through STDIO, and the portable Skill teaches agents the correct lifecycle and safety rules. The existing frontend remains an independent client.

The frozen v1 packages are publicly available on npm:

```sh
npm install @referralrail/sdk
npx @referralrail/mcp
```

Current public versions:

- `@referralrail/sdk@0.1.0`
- `@referralrail/mcp@0.1.0`

See `integrations/sdk/README.md`, `integrations/mcp/README.md`, and `.agents/skills/referralrail/SKILL.md` for source-level details.

Dependency review: production dependencies report zero advisories. The full development install currently reports five moderate transitive advisories through the pinned GenLayer test toolchain (`vitest` and `dockerode`/`uuid`). The available remediation requires a breaking GenLayer toolchain change, so no blind upgrade was applied to the finished deployment-compatible stack.
