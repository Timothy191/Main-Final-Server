#!/usr/bin/env node
/**
 * Block npm/yarn and force-push to main/master (mirrors AGENTS.md §18).
 * Only inspects the actual shell command, not arbitrary substrings in scripts.
 */
import { stdin as input } from "node:process";

async function readStdin() {
   const chunks = [];
  for await (const chunk of input) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const raw = await readStdin();
let cmd = "";
try {
  const j = JSON.parse(raw || "{}");
  cmd = j.command || j.tool_input?.command || "";
} catch {
  cmd = "";
}

/** Split compound shell into simple statements for scanning. */
function statements(command) {
  return command
    .split(/(?:&&|\|\||;|\n)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isForbidden(statement) {
  // Strip leading env assignments: FOO=bar npm install
  const cleaned = statement.replace(/^(?:\w+=\S+\s+)+/, "").trim();
  if (/^(?:sudo\s+)?npm\s+(?:install|i)(?:\s|$)/.test(cleaned)) return true;
  if (/^(?:sudo\s+)?yarn\s+(?:add|install)(?:\s|$)/.test(cleaned)) return true;
  if (/^git\s+push\b/.test(cleaned) && /--force|--force-with-lease/.test(cleaned) && /\b(main|master)\b/.test(cleaned)) {
    return true;
  }
  if (/^rm\s+-rf\s+\/(?:\s|$)/.test(cleaned)) return true;
  return false;
}

if (statements(cmd).some(isForbidden)) {
  console.log(
    JSON.stringify({
      permission: "deny",
      user_message: `Blocked by alignment gate (AGENTS.md): ${cmd}`,
      agent_message:
        "Use pnpm instead of npm/yarn. Never force-push to main/master. Re-plan with AGENTS.md §18.",
    }),
  );
  process.exit(0);
}

console.log(JSON.stringify({ permission: "allow" }));
process.exit(0);
