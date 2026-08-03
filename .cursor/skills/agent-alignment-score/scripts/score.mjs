#!/usr/bin/env node
/**
 * Alignment score helper for Arch Systems agents.
 * Rubric mirrors .cursor/rules/02-agent-scoring.mdc
 *
 * Usage:
 *   node score.mjs --spec 20 --stack 15 --boundaries 15 --security 20 --quality 15 --verify 15
 *   node score.mjs --interactive
 *   node score.mjs --json ...
 *   node score.mjs ... --code-quality 8 --catalog 12 --activated 2 \
 *     --action "Add kiro specs" --action "Harden goose" --action "LLM smoke" \
 *     --adaptive "distill — skill-self-improve"
 */

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const MAX = {
  spec: 20,
  stack: 15,
  boundaries: 15,
  security: 20,
  quality: 15,
  verify: 15,
};

const PASS = 80;
const CODE_QUALITY_MAX = 10;

function parseArgs(argv) {
  const out = {
    interactive: false,
    json: false,
    hardFail: false,
    hardFailReasons: [],
    scores: { ...Object.fromEntries(Object.keys(MAX).map((k) => [k, null])) },
    codeQuality: null,
    codeQualityNote: "",
    catalog: 12,
    activated: 2,
    actions: [],
    adaptive: "",
    evidence: {},
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--interactive" || a === "-i") out.interactive = true;
    else if (a === "--json") out.json = true;
    else if (a === "--hard-fail") {
      const v = argv[++i];
      out.hardFail = v === "true" || v === "1";
    } else if (a === "--hard-fail-reason") {
      out.hardFailReasons.push(argv[++i] ?? "");
    } else if (a === "--code-quality") {
      out.codeQuality = clamp(Number(argv[++i]), 0, CODE_QUALITY_MAX);
    } else if (a === "--code-quality-note") {
      out.codeQualityNote = argv[++i] ?? "";
    } else if (a === "--catalog") {
      out.catalog = Math.max(0, Number(argv[++i]) || 0);
    } else if (a === "--activated") {
      out.activated = Math.max(0, Number(argv[++i]) || 0);
    } else if (a === "--action") {
      out.actions.push(argv[++i] ?? "");
    } else if (a === "--adaptive") {
      out.adaptive = argv[++i] ?? "";
    } else if (a.startsWith("--") && a.slice(2) in MAX) {
      const key = a.slice(2);
      const n = Number(argv[++i]);
      if (Number.isNaN(n)) throw new Error(`Invalid number for ${a}`);
      out.scores[key] = clamp(n, 0, MAX[key]);
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function printHelp() {
  console.log(`Alignment score (pass >= ${PASS})

Dimensions (max):
  --spec ${MAX.spec}  --stack ${MAX.stack}  --boundaries ${MAX.boundaries}
  --security ${MAX.security}  --quality ${MAX.quality}  --verify ${MAX.verify}

Extended (not part of /100):
  --code-quality 0-${CODE_QUALITY_MAX}
  --code-quality-note "..."
  --catalog N --activated N   # token savings heuristic
  --action "..."              # repeat up to 3
  --adaptive "observe|distill|patch|reuse — target"

Flags:
  --interactive / -i
  --hard-fail true|false
  --hard-fail-reason "..."
  --json
`);
}

function proBar(total) {
  if (total >= 95) return { pct: total, band: "Staff+ shipping bar" };
  if (total >= 90) return { pct: total, band: "Senior clean merge" };
  if (total >= 80) return { pct: total, band: "Senior mergeable with nits" };
  if (total >= 70) return { pct: total, band: "Mid — needs rework" };
  return { pct: total, band: "Below bar" };
}

function tokensSaved(catalog, activated) {
  const eager = catalog * 3000;
  const progressive = catalog * 75 + activated * 3000;
  const saved = Math.max(0, eager - progressive);
  const pct = eager === 0 ? 0 : Math.round((saved / eager) * 100);
  return { saved, pct, eager, progressive, catalog, activated };
}

async function promptScores(scores, meta) {
  const rl = readline.createInterface({ input, output });
  try {
    console.log("Score each dimension (or press Enter for max). Extended fields after.\n");
    for (const [key, max] of Object.entries(MAX)) {
      const ans = await rl.question(`${key} (0-${max}) [${max}]: `);
      if (ans.trim() === "") scores[key] = max;
      else scores[key] = clamp(Number(ans), 0, max);
    }
    const cq = await rl.question(`code-quality (0-${CODE_QUALITY_MAX}) [8]: `);
    meta.codeQuality = cq.trim() === "" ? 8 : clamp(Number(cq), 0, CODE_QUALITY_MAX);
    meta.codeQualityNote =
      (await rl.question("code-quality note [clean/minimal]: ")).trim() ||
      "clean/minimal";
    const cat = await rl.question(`catalog skills [${meta.catalog}]: `);
    if (cat.trim()) meta.catalog = Math.max(0, Number(cat) || meta.catalog);
    const act = await rl.question(`activated skills [${meta.activated}]: `);
    if (act.trim()) meta.activated = Math.max(0, Number(act) || meta.activated);
    for (let i = 0; i < 3; i++) {
      const a = await rl.question(`recommended action ${i + 1}: `);
      if (a.trim()) meta.actions.push(a.trim());
    }
    while (meta.actions.length < 3) {
      meta.actions.push("(none)");
    }
    meta.adaptive =
      (
        await rl.question(
          "Adaptive next (observe|distill|patch|reuse — target) [observe — none]: ",
        )
      ).trim() || "observe — none";
    const hf = await rl.question("Any AGENTS.md §18 never-do violation? (y/N): ");
    return hf.trim().toLowerCase().startsWith("y");
  } finally {
    rl.close();
  }
}

function compute(scores, hardFail) {
  if (hardFail) {
    return { total: 0, pass: false, hardFail: true, scores };
  }
  const total = Object.values(scores).reduce((a, b) => a + (b ?? 0), 0);
  const level = Math.ceil(total / 10);
  return { total, level, pass: total >= PASS, hardFail: false, scores };
}

function formatReport(result, reasons, meta) {
  const label = result.pass ? "PASS" : "FAIL";
  const pb = proBar(result.total);
  const tok = tokensSaved(meta.catalog, meta.activated);
  const cq = meta.codeQuality ?? 8;
  const cqNote = meta.codeQualityNote || "see change";
  const actions = [...(meta.actions || [])];
  while (actions.length < 3) actions.push("(none)");
  const adaptive = meta.adaptive || "observe — none";

  return [
    `Alignment: ${result.total}/100 (Level ${result.level}) [${label}]`,
    `- Spec: ${result.scores.spec}/${MAX.spec} — ${reasons.spec || "N/A"}`,
    `- Stack: ${result.scores.stack}/${MAX.stack} — ${reasons.stack || "N/A"}`,
    `- Boundaries: ${result.scores.boundaries}/${MAX.boundaries} — ${reasons.boundaries || "N/A"}`,
    `- Security: ${result.scores.security}/${MAX.security} — ${reasons.security || "N/A"}`,
    `- Quality: ${result.scores.quality}/${MAX.quality} — ${reasons.quality || "N/A"}`,
    `- Verify: ${result.scores.verify}/${MAX.verify} — ${reasons.verify || "N/A"}`,
    `Hard fails: ${result.hardFail ? (reasons.hardFail || "§18 violation") : "none"}`,
    `Code quality: ${cq}/${CODE_QUALITY_MAX} — ${cqNote}`,
    `Pro bar: ${pb.pct}% — ${pb.band}`,
    `Tokens saved: ~${tok.saved} (~${tok.pct}%) — progressive disclosure catalog=${tok.catalog} activated=${tok.activated}`,
    `Recommended actions:`,
    `1. ${actions[0]}`,
    `2. ${actions[1]}`,
    `3. ${actions[2]}`,
    `Adaptive next: ${adaptive}`,
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let hardFail = args.hardFail;
  const meta = {
    codeQuality: args.codeQuality,
    codeQualityNote: args.codeQualityNote,
    catalog: args.catalog,
    activated: args.activated,
    actions: [...args.actions],
    adaptive: args.adaptive,
  };

  if (args.interactive) {
    hardFail = await promptScores(args.scores, meta);
  } else {
    for (const key of Object.keys(MAX)) {
      if (args.scores[key] === null) {
        console.error(`Missing --${key}. Use --interactive or pass all dimensions.`);
        process.exit(2);
      }
    }
    if (meta.codeQuality === null) meta.codeQuality = 8;
    if (!meta.codeQualityNote) meta.codeQualityNote = "see change";
    while (meta.actions.length < 3) meta.actions.push("(none)");
    if (!meta.adaptive) meta.adaptive = "observe — none";
  }

  const result = compute(args.scores, hardFail);
  const report = formatReport(result, args.hardFailReasons, meta);
  const pb = proBar(result.total);
  const tok = tokensSaved(meta.catalog, meta.activated);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          ...result,
          report,
          passThreshold: PASS,
          codeQuality: meta.codeQuality,
          codeQualityNote: meta.codeQualityNote,
          proBar: pb,
          tokensSaved: tok,
          recommendedActions: meta.actions.slice(0, 3),
          adaptiveNext: meta.adaptive,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(report);
  }

  process.exit(result.pass ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});
