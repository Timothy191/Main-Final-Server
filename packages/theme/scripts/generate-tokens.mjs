#!/usr/bin/env node
/**
 * generate-tokens.mjs
 * Arch System — Token Generation Script
 *
 * Parses packages/theme/src/css/variables.css and emits a typed TypeScript
 * token map at packages/theme/src/tokens/generated.ts.
 *
 * Run: node packages/theme/scripts/generate-tokens.mjs
 * Turbo task: "codegen" → runs before build
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSS_SRC = resolve(ROOT, "src/css/variables.css");
const OUT = resolve(ROOT, "src/tokens/generated.ts");

const css = readFileSync(CSS_SRC, "utf8");

/** Extract all --token: value; pairs from the :root block */
function extractTokens(cssText) {
  const tokens = {
    primitives: {},
    hsl: {},
    color: { bg: {}, border: {}, text: {}, accent: {}, mac: {}, glass: {}, vibrancy: {} },
    shadow: {},
    radius: {},
    wave: {},
  };

  const lines = cssText.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/);
    if (!match) continue;
    const [, name, rawValue] = match;
    const value = rawValue.trim();

    // Skip @deprecated comment lines but still capture the token
    
    // Handle arch primitives (--arch0 through --arch15)
    if (name.startsWith("--arch")) {
      const key = name.replace("--arch", "arch").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.primitives[key] = `var(${name})`;
      continue;
    }
    
    // Handle HSL variables (shadcn/ui HSL tokens like --background, --foreground, etc.)
    // These are pure HSL values (e.g., "240 5% 96%") without var() references
    if (name.match(/^--(background|foreground|card|popover|primary|secondary|muted|accent|destructive|border|input|ring|chart-\d+|tremor-)/)) {
      const key = name.replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      // Check if value is a pure HSL value (numbers and percentages/spaces)
      if (value.match(/^[\d%\s]+$/)) {
        tokens.hsl[key] = value;
        continue;
      }
    }
    
    // Categorise by name prefix
    if (name.startsWith("--bg-")) {
      const key = name.replace("--bg-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.color.bg[key] = `var(${name})`;
    } else if (name.startsWith("--border-")) {
      const key = name.replace("--border-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.color.border[key] = `var(${name})`;
    } else if (name.startsWith("--text-")) {
      const key = name.replace("--text-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.color.text[key] = `var(${name})`;
    } else if (name.startsWith("--accent-")) {
      const key = name.replace("--accent-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.color.accent[key] = `var(${name})`;
    } else if (name.startsWith("--mac-")) {
      const key = name.replace("--mac-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.color.mac[key] = `var(${name})`;
    } else if (name.startsWith("--glass-")) {
      const key = name.replace("--glass-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.color.glass[key] = `var(${name})`;
    } else if (name === "--vibrancy-surface" || name === "--vibrancy-border") {
      const key = name.replace("--vibrancy-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.color.vibrancy[key] = `var(${name})`;
    } else if (name.startsWith("--shadow-")) {
      const key = name.replace("--shadow-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.shadow[key] = `var(${name})`;
    } else if (name.startsWith("--radius-")) {
      const key = name.replace("--radius-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.radius[key] = `var(${name})`;
    } else if (name.startsWith("--wave-")) {
      const key = name.replace("--wave-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      tokens.wave[key] = value; // wave tokens are numbers, keep raw value
    }
  }
  return tokens;
}

function needsQuotes(key) {
  // Keys that contain special characters or start with numbers need quotes
  return /[-\s\d]/.test(key[0]) || /[-\s]/.test(key);
}

function quoteKey(key) {
  return needsQuotes(key) ? `"${key}"` : key;
}

function renderObject(obj, indent = 2) {
  const pad = " ".repeat(indent);
  const innerPad = " ".repeat(indent + 2);
  const entries = Object.entries(obj);
  if (entries.length === 0) return "{}";
  const lines = entries.map(([k, v]) => {
    const safeKey = quoteKey(k);
    if (typeof v === "object") {
      return `${innerPad}${safeKey}: ${renderObject(v, indent + 2)},`;
    }
    return `${innerPad}${safeKey}: ${JSON.stringify(v)},`;
  });
  return `{\n${lines.join("\n")}\n${pad}}`;
}

const tokens = extractTokens(css);

const output = `/**
 * generated.ts — AUTO-GENERATED. DO NOT EDIT.
 *
 * Generated by: packages/theme/scripts/generate-tokens.mjs
 * Source:       packages/theme/src/css/variables.css
 *
 * Re-run with: node packages/theme/scripts/generate-tokens.mjs
 * Or via Turbo: pnpm --filter @repo/theme codegen
 *
 * This file provides typed \`var(--token)\` references for use in:
 * - Framer Motion style props
 * - Canvas/WebGL drawing
 * - Runtime style injection
 *
 * For static Tailwind usage, use the className utilities instead
 * (e.g. \`text-[var(--text-heading)]\` or \`shadow-card\`).
 */

export const tokens = ${renderObject(tokens, 0)} as const;

export type Tokens = typeof tokens;
export type PrimitiveTokens = typeof tokens.primitives;
export type HslTokens = typeof tokens.hsl;
export type ColorTokens = typeof tokens.color;
export type ShadowTokens = typeof tokens.shadow;
export type RadiusTokens = typeof tokens.radius;
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, output, "utf8");
console.log(`✅  Token map generated → ${OUT.replace(process.cwd(), ".")}`);
