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
    || echo "$p" | tr '[:upper:]' '[:lower:]'
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
# Uses Python for brace expansion ({a,b} alternation) and fnmatch for
# wildcard matching (*, ?, []).  This is semantically equivalent to
# ripgrep's globset crate, covering all cases bash's [[ glob engine misses.
#
# Also handles globs with path separators (e.g. "apps/blog/exports.sh") by
# checking both the full pattern and its basename component.
#
# fnmatch argument order: fnmatch(sensitive_filename, user_glob_pattern)
# i.e. "does the sensitive file match the user's pattern?" — NOT reversed.
check_glob_filter() {
  local glob_filter="$1"
  [[ -z "$glob_filter" ]] && return 0
  local result
  result=$(python3 - "$glob_filter" 2>/dev/null <<'PYEOF'
import sys, os, re, fnmatch

SENSITIVE = [
    "exports.sh", ".env", "credentials",
    "id_ed25519", "id_rsa", "id_ecdsa", "id_dsa",
]

def expand_braces(s):
    """Recursively expand brace alternations: a.{b,c} -> ['a.b', 'a.c']"""
    m = re.search(r'\{([^{}]*)\}', s)
    if not m:
        return [s]
    pre, post = s[:m.start()], s[m.end():]
    return [e
            for alt in m.group(1).split(',')
            for e in expand_braces(pre + alt + post)]

pattern = sys.argv[1]
for expanded in expand_braces(pattern):
    # Check both full expanded pattern and its basename (handles path/to/exports.sh)
    candidates = {os.path.basename(expanded), expanded}
    for candidate in candidates:
        c_lower = candidate.lower()
        for sf in SENSITIVE:
            # fnmatch(filename, pattern): sf is the sensitive filename to test,
            # c_lower is the user's glob pattern.  This is the correct order:
            # "does exports.sh match the pattern e?ports.sh?" → True → block.
            if fnmatch.fnmatch(sf.lower(), c_lower):
                print(sf)
                sys.exit(0)
sys.exit(1)
PYEOF
  ) || true
  if [[ -n "$result" ]]; then
    echo "BLOCKED by protect-sensitive hook: glob filter '$glob_filter' targets sensitive file '$result'" >&2
    exit 2
  fi
}

# Expand glob filter in a search root dir via find and check each result via check_path.
# Handles brace alternations by expanding them in Python first, then running find
# for each expanded pattern (find -name uses fnmatch, no {} support).
check_glob_in_root() {
  local search_root="$1"
  local glob_filter="$2"
  [[ -z "$search_root" || -z "$glob_filter" ]] && return 0
  [[ ! -d "$search_root" ]] && return 0
  # Expand brace alternations; get one pattern per line
  local expanded_patterns
  expanded_patterns=$(python3 -c "
import sys, re
def expand_braces(s):
    m = re.search(r'\{([^{}]*)\}', s)
    if not m:
        return [s]
    pre, post = s[:m.start()], s[m.end():]
    return [e for alt in m.group(1).split(',') for e in expand_braces(pre + alt + post)]
for p in expand_braces(sys.argv[1]):
    print(p)
" "$glob_filter" 2>/dev/null || echo "$glob_filter")
  while IFS= read -r pat; do
    [[ -z "$pat" ]] && continue
    # Use basename so that "apps/blog/exports.sh" → find -name "exports.sh"
    local pat_base
    pat_base=$(basename "$pat")
    while IFS= read -r found_file; do
      [[ -z "$found_file" ]] && continue
      check_path "$found_file"
    done < <(find "$search_root" -name "$pat_base" 2>/dev/null || true)
  done <<< "$expanded_patterns"
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

  # Check Grep's glob file filter — Python handles brace expansion, fnmatch
  # handles *, ?, [], and basename extraction handles path-qualified globs.
  check_glob_filter "$GLOB_FILTER"

  # Expand Grep's glob filter in the normalized search root via filesystem —
  # catches indirect matches: e.g. path=/apps/blog, glob=e?ports.sh →
  # find resolves e?ports.sh → exports.sh → check_path → blocked.
  # When SEARCHROOT is empty (path omitted from Grep call), ripgrep defaults
  # to CWD — use CWD as the fallback so filesystem expansion still runs.
  EFFECTIVE_ROOT="${SEARCHROOT:-$(pwd)}"
  NORM_SEARCHROOT=$(norm_path "$EFFECTIVE_ROOT")
  check_glob_in_root "$NORM_SEARCHROOT" "$GLOB_FILTER"

  # For Glob tool: extract pattern's basename and check against sensitive names.
  # e.g. pattern="**/exports.sh" → basename="exports.sh" → blocked.
  if [[ -n "$GLOB_PATTERN" ]]; then
    check_glob_filter "$GLOB_PATTERN"
    PATTERN_DIR=$(dirname "$GLOB_PATTERN" 2>/dev/null || echo ".")
    if [[ "$PATTERN_DIR" != "." && "$PATTERN_DIR" != "$GLOB_PATTERN" ]]; then
      NORM_PATTERN_DIR=$(norm_path "$PATTERN_DIR")
      PATTERN_BASE=$(basename "$GLOB_PATTERN" 2>/dev/null || echo "$GLOB_PATTERN")
      check_glob_in_root "$NORM_PATTERN_DIR" "$PATTERN_BASE"
    fi
  fi
fi

exit 0
