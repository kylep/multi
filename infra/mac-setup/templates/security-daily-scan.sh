#!/bin/zsh
# Daily security scan — deployed by Ansible, run by LaunchDaemon at 06:00
# Logs to /var/log/security-scans/YYYY-MM-DD-<tool>.log

set -euo pipefail

DATE=$(date +%Y-%m-%d)
LOG_DIR=/var/log/security-scans
mkdir -p "$LOG_DIR"

# Rotate logs older than 30 days
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting daily security scan" >> "$LOG_DIR/scan.log"

# --- Lynis ---
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Running Lynis..." >> "$LOG_DIR/scan.log"
/opt/homebrew/bin/lynis audit system --no-colors --quiet \
  > "$LOG_DIR/${DATE}-lynis.log" 2>&1 && \
  grep "Hardening index" "$LOG_DIR/${DATE}-lynis.log" >> "$LOG_DIR/scan.log" || true

# --- rkhunter ---
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Running rkhunter..." >> "$LOG_DIR/scan.log"
/opt/homebrew/bin/rkhunter --update --nocolors --sk > /dev/null 2>&1 || true
/opt/homebrew/bin/rkhunter --check --skip-keypress --nocolors \
  > "$LOG_DIR/${DATE}-rkhunter.log" 2>&1
grep -E "Warning|Infected|rootkit" "$LOG_DIR/${DATE}-rkhunter.log" \
  >> "$LOG_DIR/scan.log" 2>/dev/null || \
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] rkhunter: no warnings" >> "$LOG_DIR/scan.log"

# --- mSCP CIS Level 1 ---
MSCP_SCRIPT="{{ user_home }}/tools/macos_security/build/cis_lvl1/cis_lvl1_compliance.sh"
if [[ -x "$MSCP_SCRIPT" ]]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Running mSCP CIS Level 1..." >> "$LOG_DIR/scan.log"
  "$MSCP_SCRIPT" > "$LOG_DIR/${DATE}-mscp.log" 2>&1
  grep -E "pass|fail|PASS|FAIL" "$LOG_DIR/${DATE}-mscp.log" | tail -5 >> "$LOG_DIR/scan.log" || true
else
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] mSCP script not found, skipping" >> "$LOG_DIR/scan.log"
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Daily security scan complete" >> "$LOG_DIR/scan.log"
