# MCP

`@referralrail/mcp@0.1.0` is the public npm package for the frozen v1 ReferralRail STDIO MCP server. It is built on `@referralrail/sdk` and is read-only by default.

Run it directly from npm:

```sh
npx @referralrail/mcp
```

Example MCP client configuration:

```json
{
  "mcpServers": {
    "referralrail": {
      "command": "npx",
      "args": ["-y", "@referralrail/mcp"],
      "env": {
        "REFERRALRAIL_WRITE_ENABLED": "false"
      }
    }
  }
}
```

Writes require both `REFERRALRAIL_PRIVATE_KEY` and `REFERRALRAIL_WRITE_ENABLED=true`. Keep credentials in process environment only. Do not place secrets in tool arguments or configuration committed to Git. The server does not expose arbitrary contract calls or off-chain judgment.
