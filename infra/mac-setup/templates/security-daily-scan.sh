#!/bin/zsh
# Daily security scan — deployed by Ansible, run by LaunchDaemon at 06:00
# Logs to /var/log/security-scans/YYYY-MM-DD-<tool>.log
# scan.log = human-readable summary; verbose logs per tool for deep inspection

set -uo pipefail

DATE=$(date +%Y-%m-%d)
LOG_DIR=/var/log/security-scans
mkdir -p "$LOG_DIR"

# Rotate logs older than 30 days
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" >> "$LOG_DIR/scan.log"; }

log "=== Starting daily security scan ==="

# --- Lynis ---
# Run as the brew-owning user to avoid Lynis's ownership check (it refuses
# to run as root if its own files aren't owned by root — Homebrew owns them).
log "Running Lynis..."
_start=$SECONDS
su -l {{ brew_user }} -c \
  "/opt/homebrew/bin/lynis audit system --no-colors --quiet" \
  > "$LOG_DIR/${DATE}-lynis.log" 2>&1
_rc=$?
_elapsed=$(( SECONDS - _start ))
log "Lynis complete (exit=${_rc}, ${_elapsed}s)"
grep -E "Hardening index" "$LOG_DIR/${DATE}-lynis.log" >> "$LOG_DIR/scan.log" 2>/dev/null || true
_sug=$(grep -c "Suggestion" "$LOG_DIR/${DATE}-lynis.log" 2>/dev/null || echo 0)
_warn=$(grep -c "Warning" "$LOG_DIR/${DATE}-lynis.log" 2>/dev/null || echo 0)
log "Lynis: ${_warn} warnings, ${_sug} suggestions — see ${DATE}-lynis.log"

# --- rkhunter ---
log "Running rkhunter..."
_start=$SECONDS
/opt/homebrew/bin/rkhunter --update --nocolors --sk > /dev/null 2>&1 || true
/opt/homebrew/bin/rkhunter --check --skip-keypress --nocolors \
  > "$LOG_DIR/${DATE}-rkhunter.log" 2>&1
_rc=$?
_elapsed=$(( SECONDS - _start ))
# Make verbose log (LOGFILE in rkhunter.conf) world-readable for debugging
chmod 644 "$LOG_DIR/rkhunter-verbose.log" 2>/dev/null || true
log "rkhunter complete (exit=${_rc}, ${_elapsed}s)"
_warn=$(grep -c "Warning" "$LOG_DIR/${DATE}-rkhunter.log" 2>/dev/null || echo 0)
log "rkhunter: ${_warn} warnings — see ${DATE}-rkhunter.log and rkhunter-verbose.log"
grep "Warning" "$LOG_DIR/${DATE}-rkhunter.log" >> "$LOG_DIR/scan.log" 2>/dev/null || true

# --- mSCP CIS Level 1 ---
MSCP_SCRIPT="{{ user_home }}/tools/macos_security/build/cis_lvl1/cis_lvl1_compliance.sh"
if [[ -x "$MSCP_SCRIPT" ]]; then
  log "Running mSCP CIS Level 1..."
  _start=$SECONDS
  "$MSCP_SCRIPT" > "$LOG_DIR/${DATE}-mscp.log" 2>&1
  _rc=$?
  _elapsed=$(( SECONDS - _start ))
  log "mSCP complete (exit=${_rc}, ${_elapsed}s)"
  _pass=$(grep -ciE "^pass" "$LOG_DIR/${DATE}-mscp.log" 2>/dev/null || echo 0)
  _fail=$(grep -ciE "^fail" "$LOG_DIR/${DATE}-mscp.log" 2>/dev/null || echo 0)
  log "mSCP CIS L1: ${_pass} pass, ${_fail} fail — see ${DATE}-mscp.log"
else
  log "mSCP script not found at ${MSCP_SCRIPT} — skipping (run security-scan-setup.yml)"
fi

log "=== Daily security scan complete ==="
