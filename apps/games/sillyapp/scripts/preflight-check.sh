#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# preflight-check.sh — Verify all environment variables, config files,
# and CLI tools required to build and run Silly App.
#
# Usage:
#   ./scripts/preflight-check.sh
#
# Exit codes:
#   0  — All checks passed
#   1  — One or more checks failed
# ──────────────────────────────────────────────────────────────────────
set -uo pipefail

# ── Resolve project root (parent of scripts/) ───────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Formatting ───────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

pass_count=0
fail_count=0
warn_count=0

pass()  { echo -e "  ${GREEN}✔ PASS${RESET}  $1"; ((pass_count++)); }
fail()  { echo -e "  ${RED}✘ FAIL${RESET}  $1"; ((fail_count++)); }
warn()  { echo -e "  ${YELLOW}⚠ WARN${RESET}  $1"; ((warn_count++)); }
header(){ echo -e "\n${BOLD}${CYAN}── $1 ──${RESET}"; }

# ═════════════════════════════════════════════════════════════════════
echo -e "${BOLD}🔍 Silly App — Preflight Check${RESET}"
echo -e "   Project root: ${PROJECT_ROOT}"
echo -e "   Date: $(date '+%Y-%m-%d %H:%M:%S')"

# ── 1. CLI Tools ─────────────────────────────────────────────────────
header "CLI Tools"

if xcode-select -p &>/dev/null; then
  pass "Xcode CLI tools  → $(xcode-select -p)"
else
  fail "Xcode CLI tools  → not installed (run: xcode-select --install)"
fi

if command -v xcodebuild &>/dev/null; then
  xc_ver=$(xcodebuild -version 2>/dev/null | head -1)
  pass "xcodebuild       → ${xc_ver}"
else
  fail "xcodebuild       → not found"
fi

if command -v xcrun &>/dev/null; then
  pass "xcrun            → $(command -v xcrun)"
else
  fail "xcrun            → not found"
fi

if command -v curl &>/dev/null; then
  pass "curl             → $(curl --version 2>/dev/null | head -1 | cut -d' ' -f1-2)"
else
  fail "curl             → not found (needed for image generation pipeline)"
fi

if command -v jq &>/dev/null; then
  pass "jq               → $(jq --version 2>/dev/null)"
else
  fail "jq               → not found (needed for image generation pipeline; brew install jq)"
fi

if command -v sips &>/dev/null; then
  pass "sips             → $(command -v sips) (macOS built-in)"
else
  fail "sips             → not found (macOS built-in image tool)"
fi

# ── 2. Environment Variables ─────────────────────────────────────────
header "Environment Variables"

# NANO_BANANA_API_KEY — required, must not be empty or placeholder
if [[ -n "${NANO_BANANA_API_KEY:-}" ]]; then
  if [[ "$NANO_BANANA_API_KEY" == "your-key-here" || "$NANO_BANANA_API_KEY" == "CHANGEME" || "$NANO_BANANA_API_KEY" == "placeholder" ]]; then
    fail "NANO_BANANA_API_KEY  → set but looks like a placeholder (\"${NANO_BANANA_API_KEY}\")"
  else
    # Mask all but last 4 chars
    masked="${NANO_BANANA_API_KEY: -4}"
    pass "NANO_BANANA_API_KEY  → ****${masked}"
  fi
else
  fail "NANO_BANANA_API_KEY  → not set (required for image generation)"
fi

# NANO_BANANA_ENDPOINT — optional, defaults to https://api.nanobanana.com/v1
if [[ -n "${NANO_BANANA_ENDPOINT:-}" ]]; then
  pass "NANO_BANANA_ENDPOINT → ${NANO_BANANA_ENDPOINT}"
else
  warn "NANO_BANANA_ENDPOINT → not set (will default to https://api.nanobanana.com/v1)"
fi

# FIREBASE_PROJECT_ID — required for scripts
if [[ -n "${FIREBASE_PROJECT_ID:-}" ]]; then
  pass "FIREBASE_PROJECT_ID  → ${FIREBASE_PROJECT_ID}"
else
  fail "FIREBASE_PROJECT_ID  → not set (required for Firebase configuration)"
fi

# ── 3. Config Files ──────────────────────────────────────────────────
header "Config Files"

PLIST_PATH="${PROJECT_ROOT}/sillyapp/GoogleService-Info.plist"
if [[ -f "$PLIST_PATH" ]]; then
  # Verify it's a real plist (not empty / not placeholder)
  if /usr/libexec/PlistBuddy -c "Print :PROJECT_ID" "$PLIST_PATH" &>/dev/null; then
    plist_project=$(/usr/libexec/PlistBuddy -c "Print :PROJECT_ID" "$PLIST_PATH" 2>/dev/null)
    pass "GoogleService-Info.plist → found (project: ${plist_project})"
  else
    fail "GoogleService-Info.plist → exists but missing PROJECT_ID key (corrupt or placeholder?)"
  fi
else
  fail "GoogleService-Info.plist → not found at sillyapp/GoogleService-Info.plist"
  echo -e "         ${YELLOW}↳ Download from Firebase Console → Project Settings → iOS app${RESET}"
fi

# Check for REVERSED_CLIENT_ID in the plist
if [[ -f "$PLIST_PATH" ]]; then
  if /usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" "$PLIST_PATH" &>/dev/null; then
    rev_id=$(/usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" "$PLIST_PATH" 2>/dev/null)
    pass "REVERSED_CLIENT_ID   → ${rev_id} (in plist)"
  else
    fail "REVERSED_CLIENT_ID   → not found in GoogleService-Info.plist"
  fi
else
  fail "REVERSED_CLIENT_ID   → cannot check (GoogleService-Info.plist missing)"
fi

# ── 4. Xcode Project ────────────────────────────────────────────────
header "Xcode Project"

XCODEPROJ="${PROJECT_ROOT}/sillyapp.xcodeproj"
if [[ -d "$XCODEPROJ" ]]; then
  pass "sillyapp.xcodeproj   → found"
else
  fail "sillyapp.xcodeproj   → not found at project root"
fi

# Check if the scheme exists
if xcodebuild -project "$XCODEPROJ" -list 2>/dev/null | grep -q "sillyapp"; then
  pass "Scheme 'sillyapp'    → found"
else
  fail "Scheme 'sillyapp'    → not found in project"
fi

# ── 5. Simulator ────────────────────────────────────────────────────
header "Simulator"

if xcrun simctl list devices 2>/dev/null | grep -q "iPhone 17 Pro"; then
  if xcrun simctl list devices 2>/dev/null | grep "iPhone 17 Pro" | grep -q "Booted"; then
    pass "iPhone 17 Pro        → available and booted"
  else
    warn "iPhone 17 Pro        → available but not booted (run: xcrun simctl boot 'iPhone 17 Pro')"
  fi
else
  fail "iPhone 17 Pro        → simulator not found (check Xcode → Settings → Platforms)"
fi

# ── 6. .env file (optional convenience) ──────────────────────────────
header "Optional: .env File"

DOTENV="${PROJECT_ROOT}/.env"
if [[ -f "$DOTENV" ]]; then
  pass ".env file            → found at project root"
  # Check it's in .gitignore
  if [[ -f "${PROJECT_ROOT}/.gitignore" ]] && grep -q "\.env" "${PROJECT_ROOT}/.gitignore"; then
    pass ".env in .gitignore   → yes (safe)"
  else
    warn ".env in .gitignore   → NOT FOUND — secrets may be committed!"
  fi
else
  warn ".env file            → not found (optional; set env vars directly or create .env)"
fi

# ═════════════════════════════════════════════════════════════════════
# Summary
# ═════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Summary${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}✔ Passed:  ${pass_count}${RESET}"
echo -e "  ${YELLOW}⚠ Warnings: ${warn_count}${RESET}"
echo -e "  ${RED}✘ Failed:  ${fail_count}${RESET}"
echo ""

if [[ $fail_count -gt 0 ]]; then
  echo -e "  ${RED}${BOLD}Preflight FAILED${RESET} — fix the ${fail_count} issue(s) above before building."
  echo ""
  exit 1
else
  echo -e "  ${GREEN}${BOLD}Preflight PASSED${RESET} — ready to build! 🎉"
  echo ""
  exit 0
fi
