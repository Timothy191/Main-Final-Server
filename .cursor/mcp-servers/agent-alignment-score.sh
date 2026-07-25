#!/usr/bin/env bash
# Smithery POC: MCP server for agent-alignment-score
# Exposes alignment scoring tools via JSON-RPC over stdio.
# Reads rubric, scores, and anti-pattern data from .cursor/skills/agent-alignment-score/
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/../skills/agent-alignment-score" && pwd)"
RUBRIC_FILE="$SKILL_DIR/references/rubric.md"
NEVER_DOS_FILE="$SKILL_DIR/references/never-dos.md"
GOLD_CONTRACT_FILE="$SKILL_DIR/references/gold-contract.md"
SCORE_SCRIPT="$SKILL_DIR/scripts/score.mjs"

# Read stdin line by line for JSON-RPC messages
while IFS= read -r line; do
  if [ -z "$line" ]; then continue; fi

  # Extract method and id from JSON
  METHOD=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.method||'')" 2>/dev/null || echo "")
  ID=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.id||null)" 2>/dev/null || echo "null")
  if [ -z "$METHOD" ]; then continue; fi

  case "$METHOD" in
    "tools/list")
      echo "{\"jsonrpc\":\"2.0\",\"id\":$ID,\"result\":{\"tools\":[{\"name\":\"get_rubric\",\"description\":\"Get the alignment scoring rubric with all 6 dimensions and pass criteria\",\"inputSchema\":{\"type\":\"object\",\"properties\":{},\"required\":[]}},{\"name\":\"score_alignment\",\"description\":\"Score code changes against the AGENTS.md alignment rubric (0-100). Provide a description of what was done.\",\"inputSchema\":{\"type\":\"object\",\"properties\":{\"description\":{\"type\":\"string\",\"description\":\"Description of the changes to score\"}},\"required\":[\"description\"]}},{\"name\":\"check_anti_patterns\",\"description\":\"Check code against the AGENTS.md never-do list of anti-patterns and hard fails\",\"inputSchema\":{\"type\":\"object\",\"properties\":{\"code\":{\"type\":\"string\",\"description\":\"Code or description to check\"}},\"required\":[\"code\"]}}]}}"
      ;;
    "tools/call")
      TOOL_NAME=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.params?.name||'')" 2>/dev/null || echo "")
      case "$TOOL_NAME" in
        "get_rubric")
          RUBRIC=$(cat "$RUBRIC_FILE" 2>/dev/null || echo "Rubric file not found")
          echo "{\"jsonrpc\":\"2.0\",\"id\":$ID,\"result\":{\"content\":[{\"type\":\"text\",\"text\":$(echo "$RUBRIC" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('/dev/stdin','utf8')))" 2>/dev/null || echo '"Rubric not available"')}]}}"
          ;;
        "score_alignment")
          DESC=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.params?.arguments?.description||'No description provided')" 2>/dev/null || echo "No description")
          RUBRIC=$(cat "$RUBRIC_FILE" 2>/dev/null || echo "")
          NEVER_DOS=$(cat "$NEVER_DOS_FILE" 2>/dev/null || echo "")
          echo "{\"jsonrpc\":\"2.0\",\"id\":$ID,\"result\":{\"content\":[{\"type\":\"text\",\"text\":\"## Alignment Score — Smithery POC\\n\\n**Scored changes:** $DESC\\n\\n> **Note:** This is a POC Smithery MCP server. For a full score with evidence, run: node $SCORE_SCRIPT --interactive\\n\\n### Rubric Dimensions\\n$RUBRIC\\n\\n### Anti-pattern check\\n$NEVER_DOS\"}]}}"
          ;;
        "check_anti_patterns")
          CODE=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.params?.arguments?.code||'No code provided')" 2>/dev/null || echo "")
          NEVER_DOS=$(cat "$NEVER_DOS_FILE" 2>/dev/null || echo "No anti-patterns file found")
          echo "{\"jsonrpc\":\"2.0\",\"id\":$ID,\"result\":{\"content\":[{\"type\":\"text\",\"text\":$(echo "## Anti-pattern Check\\n\\n**Code checked:** $CODE\\n\\n### Never-Do List\\n$NEVER_DOS" | node -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('/dev/stdin','utf8')))" 2>/dev/null || echo '"Error processing"')}]}}"
          ;;
        *)
          echo "{\"jsonrpc\":\"2.0\",\"id\":$ID,\"error\":{\"code\":-32601,\"message\":\"Unknown tool: $TOOL_NAME\"}}"
          ;;
      esac
      ;;
    *)
      echo "{\"jsonrpc\":\"2.0\",\"id\":$ID,\"error\":{\"code\":-32601,\"message\":\"Unknown method: $METHOD\"}}"
      ;;
  esac
done
