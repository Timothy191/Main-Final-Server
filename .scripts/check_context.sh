#!/bin/bash
# Context-Efficiency Enforcement Script
# Checks CLAUDE.md compliance and agent state hygiene

set -e

echo "=== Context-Efficiency Checks ==="
echo ""

# Check 1: CLAUDE.md length (should be < 300 lines)
CLAUDE_LEN=$(wc -l < CLAUDE.md)
echo "CLAUDE.md line count: $CLAUDE_LEN"
if [ "$CLAUDE_LEN" -gt 300 ]; then
  echo "  ❌ FAIL: CLAUDE.md exceeds 300-line limit (context bloat risk)"
  exit 1
else
  echo "  ✓ PASS: CLAUDE.md within 300-line limit"
fi

# Check 2: No inline test commands in CLAUDE.md
if grep -qE '(pytest|jest|mvn|gradle|xcodebuild|cargo test)' CLAUDE.md 2>/dev/null; then
  echo "  ❌ FAIL: CLAUDE.md contains inline test commands (should use progressive disclosure)"
  exit 1
else
  echo "  ✓ PASS: No inline test commands in CLAUDE.md"
fi

# Check 3: AGENT_TRACER.md exists
if [ ! -f .agents/AGENT_TRACER.md ]; then
  echo "  ❌ FAIL: .agents/AGENT_TRACER.md missing"
  exit 1
else
  echo "  ✓ PASS: AGENT_TRACER.md exists"
fi

# Check 4: No unsafe agent state (allow .agents/knowledge/** and .agents/AGENT_TRACER.md)
AGENT_KNOWLEDGE_DIR=".agents/knowledge"
if [ ! -d "$AGENT_KNOWLEDGE_DIR" ]; then
  echo "  ❌ FAIL: Knowledge directory $AGENT_KNOWLEDGE_DIR missing"
  exit 1
fi

# Allow specific agent files outside knowledge dir
ALLOWED_FILES=(
  "$AGENT_KNOWLEDGE_DIR/README.md"
  "$AGENT_KNOWLEDGE_DIR/index.md"
  ".agents/AGENT_TRACER.md"
)

# Capture all *.md files in .agents excluding allowed files
AGENT_STATE_FILES=$(find .agents -type f -name "*.md" -not -path "$AGENT_KNOWLEDGE_DIR/*" -a -not -name "AGENT_TRACER.md" -a -not -name "README*" -a -not -path "*/venv/*" 2>/dev/null | wc -l)

if [ "$AGENT_STATE_FILES" -gt 0 ]; then
  echo "  ❌ FAIL: Found $AGENT_STATE_FILES non-allowed agent files (potential state leakage)"
  echo "  Detected: $(find .agents -type f -name "*.md" -not -path "$AGENT_KNOWLEDGE_DIR/*" -a -not -name "AGENT_TRACER.md" -a -not -name "README*" -a -not -path "*/venv/*" -exec echo "- {}" \;) "
else
  echo "  ✓ PASS: No agent runtime state files detected"
fi

# Check 5: Token integrity (theme package)
echo "  Checking token integrity..."
if ! pnpm --filter @repo/theme lint:tokens 2>/dev/null; then
  echo "  ❌ FAIL: Token lint failed for @repo/theme"
  exit 1
else
  echo "  ✓ PASS: Token integrity check passed"
fi

# Check 6: ACL consistency - check that proxy.ts and dept-access.ts import from @repo/acl
echo "  Checking ACL consistency..."
for file in "apps/portal/src/proxy.ts" "apps/portal/src/lib/dept-access.ts"; do
  if [ ! -f "$file" ]; then
    echo "  ❌ FAIL: $file not found"
    exit 1
  fi
  if ! grep -q "@repo/acl" "$file"; then
    echo "  ❌ FAIL: $file does not import from @repo/acl"
    exit 1
  fi
done
echo "  ✓ PASS: Both proxy.ts and dept-access.ts import from @repo/acl"

# Check 7: Generated file check - variables-generated.css should not be empty and contain tokens
echo "  Checking generated CSS file..."
GEN_CSS="packages/theme/src/css/variables-generated.css"
if [ ! -f "$GEN_CSS" ]; then
  echo "  ❌ FAIL: $GEN_CSS not found"
  exit 1
fi
if [ ! -s "$GEN_CSS" ]; then
  echo "  ❌ FAIL: $GEN_CSS is empty"
  exit 1
fi
# Check that the file contains at least one CSS token (line starting with --)
if ! grep -qE "^ *--" "$GEN_CSS"; then
  echo "  ❌ FAIL: $GEN_CSS does not contain any CSS tokens (lines starting with --)"
  exit 1
fi
echo "  ✓ PASS: Generated CSS file is non-empty and contains tokens"

# Check 8: REPO-CHANGE-INDEX.md exists
if [ ! -f docs/REPO-CHANGE-INDEX.md ]; then
  echo "  ❌ FAIL: docs/REPO-CHANGE-INDEX.md missing"
  exit 1
else
  echo "  ✓ PASS: REPO-CHANGE-INDEX.md exists"
fi

# Check 9: context_efficiency.md exists
if [ ! -f docs/context_efficiency.md ]; then
  echo "  ❌ FAIL: docs/context_efficiency.md missing"
  exit 1
else
  echo "  ✓ PASS: context_efficiency.md exists"
fi

echo ""
echo "=== All checks passed ==="
