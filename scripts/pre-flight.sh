#!/bin/bash
# scripts/pre-flight.sh
# Automated pre-flight validation and scope determination.

echo "=== Running Pre-flight ==="

# 1. Domain Detection & Validation
if [ -f "package.json" ] || [ -f "apps/portal/package.json" ]; then
    echo "Detected: Next.js/Portal context"
    if [ -f "package.json" ]; then
        pnpm type-check
    else
        pnpm --filter apps/portal type-check
    fi
fi

# 2. Scope Determination
changed_files=$(git diff --name-only --cached | wc -l)
if [ "$changed_files" -gt 1 ]; then
    echo "Scope: Multi-file (High Scrutiny)"
    export ALIGNMENT_SCOPE="high"
else
    echo "Scope: Single-file (Standard Scrutiny)"
    export ALIGNMENT_SCOPE="standard"
fi

echo "=== Pre-flight Passed ==="
exit 0
