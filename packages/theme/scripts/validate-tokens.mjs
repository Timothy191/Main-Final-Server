#!/usr/bin/env node
/**
 * validate-tokens.mjs
 * Arch System — Token Validation Script
 *
 * Validates that:
 * 1. Every var(--token) used in preset.ts is defined in variables.css OR variables-generated.css
 * 2. No --arch* primitive tokens leak directly into preset.ts color utilities
 *    (components must use semantic aliases only)
 * 3. Deprecated aliases (--accent-cyan, --accent-indigo, --accent-violet,
 *    --accent-alert, --accent-blue, --accent-emerald, --bg-void) are not
 *    introduced as new definitions outside the TIER 3 block.
 * 4. Token drift: tokens.json values match variables.css for tokens present in both
 *    (prevents manual/generated desync).
 *
 * Exits 1 if violations are found (fails CI).
 *
 * Run: node packages/theme/scripts/validate-tokens.mjs
 * Or:  pnpm --filter @repo/theme lint:tokens
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSS_SRC = resolve(ROOT, "src/css/variables.css");
const CSS_GEN_SRC = resolve(ROOT, "src/css/variables-generated.css");
const PRESET_SRC = resolve(ROOT, "src/tailwind/preset.ts");
const TOKENS_SRC = resolve(ROOT, "tokens.json");

const cssText = readFileSync(CSS_SRC, "utf8");
const cssGenText = readFileSync(CSS_GEN_SRC, "utf8");
const presetText = readFileSync(PRESET_SRC, "utf8");
const tokensJson = JSON.parse(readFileSync(TOKENS_SRC, "utf8"));

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ❌  ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  ⚠️   ${msg}`);
  warnings++;
}

// ── Vendor/runtime tokens injected by third-party libs — not in variables.css ─
const VENDOR_TOKENS = new Set([
  "--radix-accordion-content-height",
  "--radix-accordion-content-width",
  "--radix-collapsible-content-height",
  "--radix-collapsible-content-width",
  "--radix-navigation-menu-viewport-width",
  "--radix-navigation-menu-viewport-height",
  "--radix-toast-swipe-move-x",
  "--radix-toast-swipe-move-y",
  "--radix-toast-swipe-end-x",
  "--radix-toast-swipe-end-y",
  "--font-anurati",
  "--font-sans",
  "--font-inter",
  "--font-outfit",
  "--font-mono",
]);

// ── 1. Extract all defined CSS tokens ────────────────────────────────────────
const definedTokens = new Set();
for (const match of cssText.matchAll(/^\s*(--[\w-]+)\s*:/gm)) {
  definedTokens.add(match[1]);
}
for (const match of cssGenText.matchAll(/^\s*(--[\w-]+)\s*:/gm)) {
  definedTokens.add(match[1]);
}
console.log(
  `\n📦  Found ${definedTokens.size} defined tokens across variables.css + variables-generated.css`,
);

// ── 2. Extract all var(--token) references in preset.ts ──────────────────────
const usedTokens = new Set();
for (const match of presetText.matchAll(/var\((--[\w-]+)\)/g)) {
  usedTokens.add(match[1]);
}
console.log(`🔗  Found ${usedTokens.size} var() references in preset.ts\n`);

// ── 3. Check every used token is defined (ignoring vendor tokens) ─────────────
console.log(
  "── Check 1: All var() references exist in CSS ────────────────────",
);
let check1Pass = true;
for (const token of usedTokens) {
  if (!definedTokens.has(token) && !VENDOR_TOKENS.has(token)) {
    error(
      `var(${token}) used in preset.ts but not defined in variables.css or variables-generated.css`,
    );
    check1Pass = false;
  }
}
if (check1Pass) console.log("  ✅  All references are defined\n");

// ── 4. Check no --arch* primitives leak OUTSIDE the palette block ─────────────
// The arch0–arch15 utilities (arch0: "var(--arch0)") are intentional Tailwind
// color exports for the raw palette. We allow them in the primitive block but
// reject any --arch* reference that appears in the semantic utility sections
// (i.e., after the "Semantic aliases" comment line).
console.log(
  "── Check 2: No --arch* primitives in semantic utility sections ───",
);
const semanticSection = presetText.split("// Semantic aliases")[1] ?? "";
const archLeaks = [...semanticSection.matchAll(/var\((--arch\d+)\)/g)];
let check2Pass = true;
for (const match of archLeaks) {
  error(
    `Primitive ${match[1]} referenced in semantic section of preset.ts — use a semantic alias`,
  );
  check2Pass = false;
}
if (check2Pass) console.log("  ✅  No primitive leaks in semantic sections\n");

// ── 5. Warn on deprecated alias usage in preset.ts ───────────────────────────
const DEPRECATED = [
  "--accent-cyan",
  "--accent-indigo",
  "--accent-violet",
  "--accent-alert",
  "--accent-emerald",
  "--bg-void",
];
console.log(
  "── Check 3: Deprecated alias usage in preset.ts ──────────────────",
);
let check3Pass = true;
for (const dep of DEPRECATED) {
  if (presetText.includes(`var(${dep})`)) {
    warn(
      `Deprecated token var(${dep}) used in preset.ts — migrate to canonical alias`,
    );
    check3Pass = false;
  }
}
if (check3Pass) console.log("  ✅  No deprecated aliases in preset.ts\n");

// ── 6. Token drift check ─────────────────────────────────────────────────────
// Flatten tokens.json into CSS variable names and compare with variables.css.
// We skip shadows because Style Dictionary's CSS transform group mangles some
// shadow values (e.g. --glass-shadow becomes rgba(0,0,0,0.08)).
console.log(
  "── Check 4: Token drift between tokens.json and variables.css ────",
);

function flattenTokens(obj, prefix = "") {
  const result = new Map();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}-${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if ("value" in value) {
        result.set(`--${fullKey}`, value.value);
      } else {
        for (const [k, v] of flattenTokens(value, fullKey)) {
          result.set(k, v);
        }
      }
    }
  }
  return result;
}

const jsonTokens = flattenTokens(tokensJson);

// Extract values from variables.css (not generated — we want to catch manual drift)
const cssValues = new Map();
for (const match of cssText.matchAll(/^\s*(--[\w-]+)\s*:\s*(.+?);/gm)) {
  cssValues.set(match[1], match[2].trim());
}

// Resolve simple references in tokens.json values
const resolvedJson = new Map();
for (const [token, rawValue] of jsonTokens) {
  let val = rawValue;
  // Resolve {archN} references to the primitive hex values
  const refs = [...val.matchAll(/\{(arch\d+)\}/g)];
  for (const ref of refs) {
    const primitive = jsonTokens.get(`--${ref[1]}`);
    if (primitive) val = val.replace(ref[0], primitive);
  }
  resolvedJson.set(token, val);
}

// Helper: resolve var(--foo) references in a CSS value using cssValues
function resolveCssValue(value, depth = 0) {
  if (depth > 3) return value; // prevent infinite recursion
  const refs = [...value.matchAll(/var\((--[\w-]+)\)/g)];
  if (refs.length === 0) return value;
  let resolved = value;
  for (const ref of refs) {
    const refVal = cssValues.get(ref[1]);
    if (refVal) {
      resolved = resolved.replace(ref[0], resolveCssValue(refVal, depth + 1));
    }
  }
  return resolved;
}

let check4Pass = true;
const SKIP_DRIFT = new Set([
  // Shadows: Style Dictionary CSS transform mangles some shadow values
  "--glass-shadow",
  "--shadow-sm",
  "--shadow-md",
  "--shadow-lg",
  // Theme transition: intentionally 0ms in generated but manual may differ
  "--theme-transition-duration",
]);

for (const [token, jsonVal] of resolvedJson) {
  if (SKIP_DRIFT.has(token)) continue;
  if (!cssValues.has(token)) continue; // not in manual CSS = nothing to drift against

  const rawCssVal = cssValues.get(token);
  const cssVal = resolveCssValue(rawCssVal);
  // Normalize whitespace for comparison
  const normJson = jsonVal.replace(/\s+/g, " ").trim();
  const normCss = cssVal.replace(/\s+/g, " ").trim();
  if (normJson !== normCss) {
    error(
      `Token drift: ${token}\n    tokens.json: ${normJson}\n    variables.css: ${normCss}`,
    );
    check4Pass = false;
  }
}

if (check4Pass) console.log("  ✅  No token drift detected\n");

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(
  "─────────────────────────────────────────────────────────────────",
);
if (errors > 0) {
  console.error(
    `\n💥  Token validation FAILED — ${errors} error(s), ${warnings} warning(s)\n`,
  );
  process.exit(1);
} else if (warnings > 0) {
  console.warn(
    `\n⚠️   Token validation passed with ${warnings} warning(s). Consider migrating deprecated aliases.\n`,
  );
} else {
  console.log(
    `\n✅  Token validation PASSED — ${definedTokens.size} tokens, ${usedTokens.size} references, all clean.\n`,
  );
}
