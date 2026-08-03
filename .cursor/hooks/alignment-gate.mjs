#!/usr/bin/env node
/**
 * sessionStart: inject alignment reminder into agent context.
 * stop: remind agent to emit Alignment Score before finishing.
 */
import { stdin as input } from "node:process";

async function readStdin() {
  const chunks = [];
  for await (const chunk of input) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const raw = await readStdin();
let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  payload = {};
}

const event = payload.hook_event_name || payload.event || "";

if (event === "sessionStart" || (!event && payload.session_id)) {
  console.log(
    JSON.stringify({
      additional_context: [
        "ALIGNMENT ON: Follow AGENTS.md. OBSERVE→HYPOTHESIZE→VERIFY→ACT→SCORE.",
        "Before done: emit Alignment Score (≥80 PASS). Skill: agent-alignment-score.",
        "Hard fail on any §18 never-do. Source of truth: AGENTS.md — no drift.",
        "AI surfaces: pnpm ai status · init/onboard/check/fix · background ai-maintenance-checker.",
      ].join(" "),
    }),
  );
  process.exit(0);
}

// stop / default: encourage score emission (follow-up if missing is soft)
console.log(
  JSON.stringify({
    // Soft reminder — do not infinite-loop; agent should include score in final reply
  }),
);
process.exit(0);
