#!/usr/bin/env bash
# Deploy the 3x Bigger Worlds mod into the local Stellaris user dir.
#
# Creates two artifacts in `~/Documents/Paradox Interactive/Stellaris/mod/`:
#   1. A symlink from `3x-bigger-worlds/` to this repo's `mod/` folder, so
#      `scripts/build.py` re-runs are picked up by the launcher without re-deploy.
#   2. A `3x-bigger-worlds.mod` launcher descriptor with an absolute `path=`
#      pointing at the symlink target.
#
# Idempotent — re-running replaces both artifacts.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_MOD_DIR="$(cd "${SCRIPT_DIR}/../mod" && pwd)"
MOD_NAME="3x-bigger-worlds"

STELLARIS_USER_DIR="${HOME}/Documents/Paradox Interactive/Stellaris/mod"

mkdir -p "${STELLARIS_USER_DIR}"

LINK_TARGET="${STELLARIS_USER_DIR}/${MOD_NAME}"
LAUNCHER_DESCRIPTOR="${STELLARIS_USER_DIR}/${MOD_NAME}.mod"

# Replace any existing link/dir.
if [ -L "${LINK_TARGET}" ] || [ -e "${LINK_TARGET}" ]; then
  rm -rf "${LINK_TARGET}"
fi
ln -s "${REPO_MOD_DIR}" "${LINK_TARGET}"

# Write the outer launcher descriptor. The `path=` line is the only difference
# from the inner descriptor.mod and must be absolute.
{
  cat "${REPO_MOD_DIR}/descriptor.mod"
  echo "path=\"${LINK_TARGET}\""
} > "${LAUNCHER_DESCRIPTOR}"

echo "Deployed:"
echo "  symlink:    ${LINK_TARGET} -> ${REPO_MOD_DIR}"
echo "  descriptor: ${LAUNCHER_DESCRIPTOR}"
echo
echo "Next: launch Stellaris -> Paradox Launcher -> Mods -> enable '3x Bigger Worlds'"
