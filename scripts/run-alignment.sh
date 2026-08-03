#!/bin/bash
# scripts/run-alignment.sh
# Run pre-flight, then alignment scoring.

./scripts/pre-flight.sh
if [ $? -ne 0 ]; then
    echo "Pre-flight failed. Alignment Score not calculated."
    exit 1
fi

node .cursor/skills/agent-alignment-score/scripts/score.mjs --interactive
