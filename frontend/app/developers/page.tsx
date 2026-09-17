import Link from "next/link";

const codeStyle = {
  margin: 0,
  padding: "14px 16px",
  borderRadius: 10,
  background: "#0b141a",
  border: "1px solid #243642",
  overflowX: "auto" as const,
  fontSize: 13,
  lineHeight: 1.6,
  color: "#d7e0e5",
};

const repo = "https://github.com/ometere123/referralrail";
const rail = "0x935A6fD995b4db5d64E1139D57a37a3f73BE2Ef8";
const judge = "0x7842393CeEAB5F053B3024673B5986fDdb95A4C9";

export default function DevelopersPage() {
  return <div className="container"><section className="section">
    <div className="eyebrow">Build with ReferralRail</div>
    <h1 style={{margin:"10px 0 12px"}}>Developer tools</h1>
    <p className="prose">ReferralRail ships a typed SDK for application integrations, a STDIO MCP server for agents, and a portable Agent Skill that teaches the protocol lifecycle and safety rules. The v1 SDK and MCP are publicly available on npm and target the canonical v1 deployment on GenLayer Studio Next.</p>

    <div className="detail-grid" style={{marginTop:24}}>
      <div className="panel brief-card">
        <h2>SDK</h2>
        <p className="prose">Install <code>@referralrail/sdk@0.1.0</code> from npm to read finalized protocol state and perform guarded writes. Writes wait for decision, finalization and post-write contract readback.</p>
        <pre style={codeStyle}><code>{`npm install @referralrail/sdk`}</code></pre>
        <pre style={{...codeStyle, marginTop:12}}><code>{`import { ReferralRailClient } from "@referralrail/sdk";\n\nconst rail = new ReferralRailClient();\nconst protocol = await rail.getProtocolConfig();\nconst opportunities = await rail.listOpportunities();\nconst actions = await rail.getAvailableActions(3, { address: "0x..." });`}</code></pre>
        <p className="meta" style={{marginTop:12}}>Public npm package: <code>@referralrail/sdk@0.1.0</code></p>
        <div className="hero-actions">
          <a className="button secondary" href="https://www.npmjs.com/package/@referralrail/sdk" target="_blank" rel="noreferrer">View on npm</a>
          <a className="button secondary" href={`${repo}/tree/main/integrations/sdk`} target="_blank" rel="noreferrer">Source &amp; README</a>
        </div>
      </div>

      <div className="panel brief-card">
        <h2>MCP server</h2>
        <p className="prose">Run <code>@referralrail/mcp@0.1.0</code> directly from npm. The MCP server is read-only by default; writes require both an explicit write flag and a configured signer.</p>
        <pre style={codeStyle}><code>{`npx @referralrail/mcp`}</code></pre>
        <pre style={{...codeStyle, marginTop:12}}><code>{`{\n  "command": "npx",\n  "args": ["-y", "@referralrail/mcp"],\n  "env": { "REFERRALRAIL_WRITE_ENABLED": "false" }\n}`}</code></pre>
        <p className="meta" style={{marginTop:12}}>Never pass private keys as tool arguments. The MCP server does not expose arbitrary contract calls or off-chain judgment.</p>
        <div className="hero-actions">
          <a className="button secondary" href="https://www.npmjs.com/package/@referralrail/mcp" target="_blank" rel="noreferrer">View on npm</a>
          <a className="button secondary" href={`${repo}/tree/main/integrations/mcp`} target="_blank" rel="noreferrer">Source &amp; setup</a>
        </div>
      </div>
    </div>

    <div className="detail-grid" style={{marginTop:18}}>
      <div className="panel brief-card">
        <h2>Agent Skill</h2>
        <p className="prose">The portable ReferralRail Skill teaches agents how to inspect roles, state and deadlines; use the SDK/MCP safely; respect <code>INCONCLUSIVE</code>; and distinguish a terminal outcome from actual settlement release.</p>
        <pre style={codeStyle}><code>{`.agents/skills/referralrail/SKILL.md`}</code></pre>
        <a className="button secondary" href={`${repo}/tree/main/.agents/skills/referralrail`} target="_blank" rel="noreferrer">Open Agent Skill</a>
      </div>

      <div className="panel brief-card">
        <h2>Canonical v1 deployment</h2>
        <div className="kv"><span>Network</span><strong>Studio Next · 61997</strong></div>
        <div className="kv"><span>RPC</span><strong>https://studio-dev.genlayer.com/api</strong></div>
        <div className="kv"><span>ReferralRail</span><strong style={{fontSize:12,whiteSpace:"nowrap",overflowX:"auto",maxWidth:"100%",display:"block"}}>{rail}</strong></div>
        <div className="kv"><span>OutcomeJudge</span><strong style={{fontSize:12,whiteSpace:"nowrap",overflowX:"auto",maxWidth:"100%",display:"block"}}>{judge}</strong></div>
        <Link className="button secondary" href="/protocol">Live protocol status</Link>
      </div>
    </div>

    <div className="panel panel-pad" style={{marginTop:18}}>
      <h2>Protocol semantics agents and integrations must preserve</h2>
      <ul className="prose">
        <li>GenLayer OutcomeJudge decides completion; the SDK, MCP server and agent do not independently judge the work.</li>
        <li>A transaction hash is not proof of successful execution. Use finalized state and readback.</li>
        <li><code>PAID</code> or <code>REFUNDED</code> describes the decided protocol outcome; funds are only released when <code>settlement_released</code> is true.</li>
        <li><code>INCONCLUSIVE</code> is a first-class outcome with bounded retry/recovery rules and must not be replaced by an agent opinion.</li>
        <li>Writes should only be attempted when the current finalized state, role and deadline make the action legal.</li>
      </ul>
    </div>

    <div className="hero-actions">
      <Link className="button primary" href="/docs">Read protocol docs</Link>
      <a className="button secondary" href={`${repo}/tree/main/docs/integrations`} target="_blank" rel="noreferrer">Integration documentation</a>
    </div>
  </section></div>;
}
