#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createReferralRailServer } from "./server.js";

const server = createReferralRailServer();
await server.connect(new StdioServerTransport());
