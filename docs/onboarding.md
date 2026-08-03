# Onboarding Checklist

Welcome to Arch Systems! Follow this checklist to set up your environment and understand our operational standards.

## 🚀 Setup Checklist

Complete these steps in order to ensure your environment is configured correctly and stays in sync with our architectural policies.

1.  **Clone & Install**
    - Clone the repository.
    - Ensure you have `pnpm` 9.15.9 and Node.js 24.15.0 installed (Volta-managed).
    - Run: `pnpm install --frozen-lockfile`

2.  **AI & Operational Policies**
    - Read `AGENTS.md` (Canonical policy, §20 Alignment Score).
    - Read `SOUL.md` (Evidence-based work contract).
    - Read `.cursor/rules/01-real-world-logic.mdc` (OBSERVE→VERIFY loop).

3.  **Validate Environment & Documentation**
    - Run: `pnpm agents:verify`
      _This script validates that `AGENTS.md` is in sync with the codebase. If it fails, please check the output and update `AGENTS.md` or the code accordingly._
    - Run: `pnpm ai init`

4.  **Know Your Tools**
    - Understand routing: `.cursor/rules/04-subagent-auto-routing.mdc`
    - Review `docs/README.md` for architectural patterns and domain maps.

5.  **Quality Gate & Deployment**
    - Run: `pnpm quality` (lint + type-check + test)
    - Build Check: `pnpm build`

## 🛡️ Operational Maintenance

- **Daily Status**: `pnpm ai status`
- **Fixing Issues**: `pnpm ai fix`
- **Before claiming "Done" (multi-file work)**:
  - Adversarial review via `sceptic`
  - Formal score via `agent-alignment-score`
  - Final Quality Gate: `pnpm quality`

## 🗓️ Monthly Maintenance

- **Repo Hygiene Review**: On the first Monday of each month, review `AGENTS.md` for architectural drift and update it to reflect the current codebase state.
