import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: process.execPath, args: ["dist/index.js"], env: { ...process.env, REFERRALRAIL_WRITE_ENABLED: "false", REFERRALRAIL_PRIVATE_KEY: "" } });
const client = new Client({ name: "referralrail-e2e", version: "0.1.0" });
await client.connect(transport);
const tools = await client.listTools();
assert.ok(tools.tools.some(tool => tool.name === "referralrail_get_protocol"));
const result = await client.callTool({ name: "referralrail_get_protocol", arguments: {} });
assert.ok(result.content?.length);
await transport.close();
console.log("STDIO MCP discovery and read call passed");
