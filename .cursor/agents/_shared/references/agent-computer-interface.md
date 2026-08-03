# Agent-Computer Interface (ACI) Specification

Derived from Princeton SWE-agent (https://github.com/princeton-nlp/SWE-agent)

This specification defines the constraints, interface rules, and execution axioms for autonomous agents interacting with this monorepo. It replaces raw, open-ended shell execution with structured, token-efficient workspace operations.

---

## 1. Axioms of Agent-Computer Interfaces (ACI)

### A. Context-Pruning Reads

- **Rule:** Never read whole files (>150 lines) when searching for definitions or verifying changes.
- **Action:** Utilize line-selectors on the read tool (e.g., `path: "src/foo.ts:50-100"`) to isolate specific blocks.
- **Why:** Prevents prompt-buffer inflation, saving up to 80% of token count per turn.

### B. AST-Driven Edits (Structure over Text)

- **Rule:** Do not use broad regular expressions or text replace scripts (`sed`, `awk`) for structural edits.
- **Action:** Use AST-grep templates via `ast_edit` to ensure syntactical correctness and prevent bracket mismatch compilation failures.

### C. Isolated Compilation & Test Verification

- **Rule:** Do not execute repository-wide build tests after a localized change.
- **Action:** Focus compiler verification to the changed file or target sub-package (e.g., run `pnpm --filter @repo/redis type-check` rather than root checks).

---

## 2. Workspace Implementations (SOP)

### File Search

- **Standard:** Use `glob` with file suffix filtering to map directories.
- **Standard:** Use `grep` with strict regex patterns to find symbol declarations, never scanning raw directories.

### File Mutation Loop (Observe -> Edit -> Verify)

1. **Locate:** Find symbol references using `lsp references` or `grep`.
2. **Isolate:** Read the target block using a line-numbered `read`.
3. **Change:** Apply surgical edits using the Edit tool or `ast_edit`.
4. **Confirm:** Immediately run local test suite (e.g. `pnpm test`) to confirm zero regressions.
