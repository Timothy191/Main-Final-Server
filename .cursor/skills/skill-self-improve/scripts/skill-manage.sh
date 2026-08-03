#!/usr/bin/env bash
# Thin skill_manage: list | create | patch under .cursor/skills/ only.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SKILLS="${ROOT}/.cursor/skills"
CMD="${1:-}"
shift || true

usage() {
  echo "usage: $0 list" >&2
  echo "       $0 create <name>" >&2
  echo "       $0 patch <name> <old_string> <new_string>" >&2
  exit 2
}

[[ -d "$SKILLS" ]] || { echo "missing $SKILLS" >&2; exit 1; }

case "$CMD" in
  list)
    find "$SKILLS" -mindepth 1 -maxdepth 1 -type d ! -name '.*' -printf '%f\n' | sort
    ;;
  create)
    NAME="${1:-}"
    [[ -n "$NAME" ]] || usage
    if [[ ! "$NAME" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
      echo "create: name must be kebab-case" >&2
      exit 2
    fi
    DEST="${SKILLS}/${NAME}"
    if [[ -e "$DEST" ]]; then
      echo "create: already exists: $DEST" >&2
      exit 1
    fi
    mkdir -p "$DEST/references" "$DEST/scripts" "$DEST/assets"
    cat >"$DEST/SKILL.md" <<EOF
---
name: ${NAME}
description: >-
  TODO: when to use. Anti-trigger: TODO.
---

# ${NAME}

TODO: purpose.

## When to use

- TODO

## Workflow

1. TODO

## References

- See \`skill-self-improve/assets/SKILL-DISTILL-TEMPLATE.md\` to fill this out.
EOF
    echo "created $DEST/SKILL.md"
    ;;
  patch)
    NAME="${1:-}"
    OLD="${2:-}"
    NEW="${3:-}"
    [[ -n "$NAME" && -n "$OLD" ]] || usage
    FILE="${SKILLS}/${NAME}/SKILL.md"
    [[ -f "$FILE" ]] || { echo "patch: missing $FILE" >&2; exit 1; }
    if ! grep -qF -- "$OLD" "$FILE"; then
      echo "patch: old_string not found in $FILE" >&2
      exit 1
    fi
    # Portable in-place replace via python for literal strings
    python3 - "$FILE" "$OLD" "$NEW" <<'PY'
import pathlib, sys
path, old, new = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
text = path.read_text(encoding="utf-8")
if old not in text:
    raise SystemExit("old_string not found")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print(f"patched {path}")
PY
    ;;
  *)
    usage
    ;;
esac
