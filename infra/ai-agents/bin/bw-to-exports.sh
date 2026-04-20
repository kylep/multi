#!/usr/bin/env bash
set -euo pipefail
umask 077
# Sync a declared set of secrets from Bitwarden → apps/blog/exports.sh.
#
# Only the lines between `# BW_SYNC_BEGIN` and `# BW_SYNC_END` in exports.sh
# are rewritten. Anything you hand-edit outside that block is preserved.
#
# Prerequisites:
#   - bw CLI installed and logged in
#   - Vault unlocked: export BW_SESSION="$(bw unlock --raw)"
#   - jq installed
#
# To add a new managed var: append to MANIFEST below.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
EXPORTS="$REPO_ROOT/apps/blog/exports.sh"

BEGIN_MARK="# BW_SYNC_BEGIN — managed by infra/ai-agents/bin/bw-to-exports.sh, do not edit"
END_MARK="# BW_SYNC_END"

# Manifest: "Bitwarden item name | shell env var | field"
# field is one of: password, username, or the name of a custom field on the item.
MANIFEST=(
  "Bluesky App Password (Blog Crosspost Bot)  | BLUESKY_APP_PASS       | password"
  "Bluesky App Password (Blog Crosspost Bot)  | BLUESKY_HANDLE         | username"
  "Mastodon Access Token (Blog Crosspost Bot) | MASTODON_ACCESS_TOKEN  | password"
)

# ---------------------------------------------------------------------------

command -v bw >/dev/null || { echo "bw CLI not found" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq not found" >&2; exit 1; }

status=$(bw status | jq -r '.status')
if [ "$status" != "unlocked" ]; then
  cat >&2 <<EOF
Bitwarden vault status: $status
Unlock first:
    export BW_SESSION=\$(bw unlock --raw)
EOF
  exit 1
fi

echo "Syncing vault…" >&2
bw sync >/dev/null

tmp_block=$(mktemp)
trap 'rm -f "$tmp_block"' EXIT

{
  echo "$BEGIN_MARK"
  echo "# Last synced: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$tmp_block"

synced_vars=()
missing_items=()

for entry in "${MANIFEST[@]}"; do
  # Trim whitespace around | separators.
  bw_name=$(echo "$entry" | awk -F'|' '{gsub(/^ +| +$/,"",$1); print $1}')
  env_var=$(echo "$entry" | awk -F'|' '{gsub(/^ +| +$/,"",$2); print $2}')
  field=$(  echo "$entry" | awk -F'|' '{gsub(/^ +| +$/,"",$3); print $3}')

  item_json=$(bw get item "$bw_name" 2>/dev/null || true)
  if [ -z "$item_json" ]; then
    echo "  skip: $env_var (item '$bw_name' not in Bitwarden)" >&2
    missing_items+=("$env_var ← $bw_name")
    continue
  fi

  case "$field" in
    password) val=$(echo "$item_json" | jq -r '.login.password // ""') ;;
    username) val=$(echo "$item_json" | jq -r '.login.username // ""') ;;
    *)        val=$(echo "$item_json" | jq -r --arg f "$field" '(.fields // []) | map(select(.name==$f)) | .[0].value // ""') ;;
  esac

  # Escape any " or $ or ` or \ so the value survives a double-quoted shell string.
  esc=$(printf '%s' "$val" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/`/\\`/g' -e 's/\$/\\$/g')
  printf 'export %s="%s"\n' "$env_var" "$esc" >> "$tmp_block"
  synced_vars+=("$env_var")
done

echo "$END_MARK" >> "$tmp_block"

# Merge into exports.sh.
if [ ! -f "$EXPORTS" ]; then
  echo "Creating $EXPORTS" >&2
  cp "$tmp_block" "$EXPORTS"
else
  # Strip any existing managed block, then append the new one.
  if grep -qF "$BEGIN_MARK" "$EXPORTS" && grep -qF "$END_MARK" "$EXPORTS"; then
    filtered=$(mktemp)
    # BSD awk — works on macOS and Linux.
    awk -v b="$BEGIN_MARK" -v e="$END_MARK" '
      $0 == b { inside = 1; next }
      $0 == e { inside = 0; next }
      !inside { print }
    ' "$EXPORTS" > "$filtered"
    mv "$filtered" "$EXPORTS"
  fi
  # Ensure trailing newline before appending.
  if [ -s "$EXPORTS" ] && [ "$(tail -c1 "$EXPORTS" | od -An -c | tr -d ' ')" != '\n' ]; then
    printf '\n' >> "$EXPORTS"
  fi
  cat "$tmp_block" >> "$EXPORTS"
fi

chmod 600 "$EXPORTS"

echo "" >&2
echo "Synced to $EXPORTS:" >&2
for v in "${synced_vars[@]}"; do
  echo "  $v" >&2
done
if [ "${#missing_items[@]}" -gt 0 ]; then
  echo "" >&2
  echo "Missing (not yet in Bitwarden):" >&2
  for m in "${missing_items[@]}"; do
    echo "  $m" >&2
  done
fi
