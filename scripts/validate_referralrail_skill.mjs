import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const skill = path.join(root, ".agents", "skills", "referralrail");
const main = fs.readFileSync(path.join(skill, "SKILL.md"), "utf8");
const frontmatter = main.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
if (!frontmatter || !/^name:\s*referralrail\s*$/m.test(frontmatter[1]) || !/^description:\s*\S/m.test(frontmatter[1])) throw new Error("invalid ReferralRail Skill frontmatter");
for (const file of ["protocol.md", "state-machine.md", "tools.md", "safety.md"]) if (!fs.existsSync(path.join(skill, "references", file))) throw new Error(`missing Skill reference ${file}`);
if (main.length > 5000) throw new Error("main SKILL.md is not concise");
const fixture = JSON.parse(fs.readFileSync(path.join(skill, "tests", "trigger-fixtures.json"), "utf8"));
const shouldActivate = prompt => /referralrail/i.test(prompt) && /(opportun|refer|merged PR|paid|judgment|settle)/i.test(prompt);
for (const prompt of fixture.activate) if (!shouldActivate(prompt)) throw new Error(`activation fixture failed: ${prompt}`);
for (const prompt of fixture.doNotActivate) if (shouldActivate(prompt)) throw new Error(`non-activation fixture failed: ${prompt}`);
const secretPattern = /(0x[a-fA-F0-9]{64}|PRIVATE_KEY\s*=\s*0x)/;
if (secretPattern.test(main) || secretPattern.test(JSON.stringify(fixture))) throw new Error("secret-like material found in Skill");
console.log(`ReferralRail Skill validation passed: ${fixture.activate.length} activation and ${fixture.doNotActivate.length} non-activation fixtures`);
