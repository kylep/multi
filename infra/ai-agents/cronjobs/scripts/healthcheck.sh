#!/bin/sh
# Cluster health check — runs as a CronJob, posts state changes to Discord.
# Runs in ~10 seconds. No Claude agent needed.

DISCORD_CHANNEL="${DISCORD_LOG_CHANNEL_ID:-1484017412306239578}"
STATE_FILE="${STATE_FILE:-/cache/last-state}"

# --- Checks (each prints OK or FAIL:detail) ---
check_pods() {
  BAD=$(kubectl get pods -A --no-headers 2>/dev/null \
    | grep -v -E 'Running|Completed' \
    | grep -v -E '\bdebug\b' || true)
  if [ -n "$BAD" ]; then
    DETAIL=$(echo "$BAD" | head -3 | awk '{print $1"/"$2":"$4}' | tr '\n' ' ')
    echo "FAIL:${DETAIL}"
  else
    echo "OK"
  fi
}

check_argocd() {
  BAD=$(kubectl get applications -n argocd --no-headers 2>/dev/null \
    | grep -v -E 'Synced\s+(Healthy|Progressing)' || true)
  if [ -n "$BAD" ]; then
    DETAIL=$(echo "$BAD" | awk '{print $1":"$2"/"$3}' | tr '\n' ' ')
    echo "FAIL:${DETAIL}"
  else
    echo "OK"
  fi
}

check_vault() {
  HEALTH=$(curl -sf --connect-timeout 5 http://vault.vault.svc.cluster.local:8200/v1/sys/health 2>/dev/null) || {
    echo "FAIL:unreachable"; return
  }
  SEALED=$(echo "$HEALTH" | jq -r '.sealed' 2>/dev/null)
  if [ "$SEALED" = "true" ]; then
    echo "FAIL:sealed"
  else
    echo "OK"
  fi
}

check_cronjobs() {
  FAILED=$(kubectl get jobs -n ai-agents --no-headers 2>/dev/null \
    | grep -v -E 'debug|manual|test|-v[0-9]|healthcheck-' \
    | grep '0/1' \
    | awk '{print $1}' || true)
  if [ -n "$FAILED" ]; then
    DETAIL=$(echo "$FAILED" | head -3 | tr '\n' ' ')
    echo "FAIL:${DETAIL}"
  else
    echo "OK"
  fi
}

# --- Run all checks ---
R_PODS=$(check_pods)
R_ARGO=$(check_argocd)
R_VAULT=$(check_vault)
R_CRON=$(check_cronjobs)

CURRENT="pods=${R_PODS};argo=${R_ARGO};vault=${R_VAULT};cron=${R_CRON}"
echo "Current: $CURRENT"

# --- Compare with previous state ---
PREV=""
if [ -f "$STATE_FILE" ]; then
  PREV=$(cat "$STATE_FILE")
  echo "Previous: $PREV"
fi

# Save state now (even if no changes)
mkdir -p "$(dirname "$STATE_FILE")" 2>/dev/null || true
echo "$CURRENT" > "$STATE_FILE" 2>/dev/null || true

if [ "$CURRENT" = "$PREV" ]; then
  echo "No state change."
  exit 0
fi

# --- Detect transitions ---
get_status() {
  echo "$1" | tr ';' '\n' | grep "^$2=" | sed "s/^$2=//" | cut -d: -f1
}
get_detail() {
  echo "$1" | tr ';' '\n' | grep "^$2=" | sed "s/^$2=[^:]*://"
}

MSG="Health check — $(date -u '+%Y-%m-%d %H:%M UTC')"
HAS_CHANGES=false

for CHECK in pods argo vault cron; do
  CUR_S=$(get_status "$CURRENT" "$CHECK")
  PREV_S=$(get_status "$PREV" "$CHECK")
  DETAIL=$(get_detail "$CURRENT" "$CHECK")

  if [ "$CUR_S" != "$PREV_S" ] || [ -z "$PREV" ]; then
    HAS_CHANGES=true
    if [ "$CUR_S" = "FAIL" ]; then
      MSG="${MSG}
🔴 ${CHECK}: ${DETAIL}"
    else
      MSG="${MSG}
🟢 ${CHECK} recovered"
    fi
  fi
done

if [ "$HAS_CHANGES" = false ]; then
  echo "No state change."
  exit 0
fi

echo "$MSG"

# --- Post to Discord ---
if [ -n "$DISCORD_BOT_TOKEN" ]; then
  PAYLOAD=$(jq -n --arg content "$MSG" '{content: $content}')
  curl -sf -X POST \
    "https://discord.com/api/v10/channels/${DISCORD_CHANNEL}/messages" \
    -H "Authorization: Bot ${DISCORD_BOT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" > /dev/null || echo "Discord post failed"
fi
