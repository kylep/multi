#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Normalize a path to its canonical, lowercase form.
# os.path.realpath resolves .., ., //, and symlinks.
# .lower() handles macOS case-insensitive filesystem.
norm_path() {
  local p="$1"
  [[ -z "$p" ]] && echo "" && return 0
  python3 -c "import os,sys; print(os.path.realpath(sys.argv[1]).lower())" "$p" 2>/dev/null \
    || echo "${p,,}"
}

check_path() {
  local filepath="$1"
  [[ -z "$filepath" ]] && return 0
  local norm
  norm=$(norm_path "$filepath")
  [[ -z "$norm" ]] && return 0
  case "$norm" in
    */.env|*/.env.*|*.env)
      echo "BLOCKED by protect-sensitive hook: .env file" >&2; exit 2 ;;
    */.ssh/id_*)
      echo "BLOCKED by protect-sensitive hook: SSH key" >&2; exit 2 ;;
    */.aws/credentials*)
      echo "BLOCKED by protect-sensitive hook: AWS creds" >&2; exit 2 ;;
    */.kube/config*)
      echo "BLOCKED by protect-sensitive hook: kubeconfig" >&2; exit 2 ;;
    */exports.sh)
      echo "BLOCKED by protect-sensitive hook: exports.sh credential file" >&2; exit 2 ;;
    */secrets/*)
      echo "BLOCKED by protect-sensitive hook: secrets directory" >&2; exit 2 ;;
  esac
}

# Check a glob filter pattern against known-sensitive filenames.
# Uses bash native glob engine (unquoted RHS in [[) so *, ?, [] are evaluated correctly.
# This correctly handles e?ports.sh, exports*, EXPORTS.SH, etc.
check_glob_filter() {
  local glob_filter="$1"
  [[ -z "$glob_filter" ]] && return 0
  local gf_lower="${glob_filter,,}"
  for sfbase in "exports.sh" ".env" "credentials" "id_ed25519" "id_rsa" "id_ecdsa" "id_dsa"; do
    # Native bash glob: does sfbase (constant) match the glob filter pattern (variable)?
    # Unquoted RHS causes bash to evaluate gf_lower as a glob pattern.
    if [[ "$sfbase" == $gf_lower ]]; then
      echo "BLOCKED by protect-sensitive hook: glob filter '$glob_filter' targets sensitive file '$sfbase'" >&2
      exit 2
    fi
  done
}

# Expand glob filter in a search root dir via find and check each result via check_path.
# find's -name supports *, ?, [] — same wildcards as ripgrep's --glob.
# No -maxdepth limit so depth cannot be used as a bypass vector.
check_glob_in_root() {
  local search_root="$1"
  local glob_filter="$2"
  [[ -z "$search_root" || -z "$glob_filter" ]] && return 0
  [[ ! -d "$search_root" ]] && return 0
  while IFS= read -r found_file; do
    [[ -z "$found_file" ]] && continue
    check_path "$found_file"
  done < <(find "$search_root" -name "$glob_filter" 2>/dev/null || true)
}

if [[ "$TOOL" == "Bash" ]]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
  if echo "$COMMAND" | grep -qE '(cat|less|head|tail|curl -d @|base64|scp)\s+\.env'; then
    echo "BLOCKED by protect-sensitive hook: .env access via bash" >&2; exit 2
  fi
  if echo "$COMMAND" | grep -qE '(cat|less|head|tail)\s+.*(\.ssh/id_|\.aws/credentials|\.kube/config)'; then
    echo "BLOCKED by protect-sensitive hook: sensitive file access via bash" >&2; exit 2
  fi
  if echo "$COMMAND" | grep -qE '(cat|less|head|tail|base64|strings|xxd|grep)\s+.*exports\.sh'; then
    echo "BLOCKED by protect-sensitive hook: exports.sh access via bash" >&2; exit 2
  fi
  if echo "$COMMAND" | grep -qE '(cat|less|head|tail|base64|strings|xxd|grep)\s+.*/secrets/'; then
    echo "BLOCKED by protect-sensitive hook: secrets directory access via bash" >&2; exit 2
  fi
  if echo "$COMMAND" | grep -qE '(source|\. ).*exports\.sh'; then
    echo "BLOCKED by protect-sensitive hook: source exports.sh" >&2; exit 2
  fi
  if echo "$COMMAND" | grep -qE '(source|\. ).*\.env'; then
    echo "BLOCKED by protect-sensitive hook: source .env" >&2; exit 2
  fi
else
  # Extract fields for different tool types:
  # Read/Edit/Write: .tool_input.file_path
  # Grep:           .tool_input.path (search root), .tool_input.glob (file filter)
  # Glob:           .tool_input.path (base dir),    .tool_input.pattern (glob pattern)
  FILEPATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
  SEARCHROOT=$(echo "$INPUT" | jq -r '.tool_input.path // empty')
  GLOB_FILTER=$(echo "$INPUT" | jq -r '.tool_input.glob // empty')
  GLOB_PATTERN=$(echo "$INPUT" | jq -r '.tool_input.pattern // empty')

  # Check direct file path (Read/Edit/Write tools)
  check_path "$FILEPATH"

  # Check Grep's search root (catches case where path is exactly a sensitive file)
  check_path "$SEARCHROOT"

  # Check Grep's glob file filter against known-sensitive basenames (bash native glob)
  check_glob_filter "$GLOB_FILTER"

  # Expand Grep's glob filter in the normalized search root via filesystem —
  # catches indirect matches: e.g. path=/apps/blog, glob=e?ports.sh →
  # find resolves e?ports.sh → exports.sh → check_path → blocked.
  if [[ -n "$SEARCHROOT" ]]; then
    NORM_SEARCHROOT=$(norm_path "$SEARCHROOT")
    check_glob_in_root "$NORM_SEARCHROOT" "$GLOB_FILTER"
  fi

  # For Glob tool: extract pattern's basename and check against sensitive names.
  # e.g. pattern="**/exports.sh" → basename="exports.sh" → blocked.
  if [[ -n "$GLOB_PATTERN" ]]; then
    PATTERN_BASE=$(basename "$GLOB_PATTERN" 2>/dev/null || echo "$GLOB_PATTERN")
    check_glob_filter "$PATTERN_BASE"
    PATTERN_DIR=$(dirname "$GLOB_PATTERN" 2>/dev/null || echo ".")
    if [[ "$PATTERN_DIR" != "." && "$PATTERN_DIR" != "$GLOB_PATTERN" ]]; then
      NORM_PATTERN_DIR=$(norm_path "$PATTERN_DIR")
      check_glob_in_root "$NORM_PATTERN_DIR" "$PATTERN_BASE"
    fi
  fi
fi

exit 0
