# @referralrail/mcp

STDIO MCP server for ReferralRail. It is built on `@referralrail/sdk`, so the SDK owns contract calls, fee policy, finalization, and readback.

```sh
npm install
npm run build
REFERRALRAIL_WRITE_ENABLED=false node dist/index.js
```

The default is read-only. Writes require both `REFERRALRAIL_PRIVATE_KEY` and `REFERRALRAIL_WRITE_ENABLED=true`. Credentials are process configuration only and are never tool arguments or results. The server never exposes arbitrary contract calls, `set_judge`, `record_outcome`, or an off-chain judgment tool.

Available read tools include protocol, accounting, opportunity, judgment, and available-action reads. Write tools cover the ordinary user lifecycle through settle, expire, cancel, and recover. Resources expose the canonical deployment and safety rules.

Example client configuration:

```json
{ "mcpServers": { "referralrail": { "command": "node", "args": ["/absolute/path/integrations/mcp/dist/index.js"], "env": { "REFERRALRAIL_WRITE_ENABLED": "false" } } } }
```
