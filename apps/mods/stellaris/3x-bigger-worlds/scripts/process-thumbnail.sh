#!/usr/bin/env bash
# Convert a source image into the canonical mod thumbnail.
#
# Why this exists: the first Multi-Megastructures Workshop upload showed a
# broken-image placeholder because mod/thumbnail.png was JPEG bytes inside a
# .png filename — browsers sniff content and rendered it fine, but Steam
# Workshop validated the magic bytes and rejected it. The file extension is
# *not* enough; the bytes have to be a real PNG.
#
# This script takes any source image (PNG / JPEG / WebP / TIFF / …) and
# produces mod/thumbnail.png as a real PNG, 512x512, 8-bit RGB, no alpha,
# well under 1 MB — i.e. exactly the shape preflight check C9 enforces.
#
# Usage:
#   1. Drop a source image at mod/thumbnail-src.<ext> (any common format)
#   2. ./scripts/process-thumbnail.sh
#   3. ./scripts/preflight.py   # C9 confirms format compliance
#
# Idempotent. macOS only (uses `sips`).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOD_DIR="$(cd "${SCRIPT_DIR}/../mod" && pwd)"

SRC=""
for candidate in "${MOD_DIR}"/thumbnail-src.*; do
  [ -e "${candidate}" ] || continue
  case "${candidate}" in
    *.png|*.PNG|*.jpg|*.JPG|*.jpeg|*.JPEG|*.webp|*.WEBP|*.tif|*.tiff|*.TIF|*.TIFF)
      SRC="${candidate}"
      break
      ;;
  esac
done

if [ -z "${SRC}" ]; then
  echo "ERROR: no thumbnail-src.<ext> found in ${MOD_DIR}/" >&2
  echo "       drop a source image at mod/thumbnail-src.png (or .jpg / .webp / …) and re-run" >&2
  exit 1
fi

DEST="${MOD_DIR}/thumbnail.png"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "${TMPDIR}"' EXIT
STAGED="${TMPDIR}/thumbnail.png"

# 1. Resize to fit 512x512 (preserves aspect ratio; preflight C9 wants exactly
#    512x512 so we pad afterwards if needed).
# 2. Pad to exact 512x512 with black so Workshop renders a square preview.
# 3. Force PNG re-encode (this is what fixes the "JPEG bytes in a .png file"
#    bug class).
# Force PNG re-encode first so subsequent `sips` calls don't warn about
# extension/encoding mismatch on JPEG / WebP / etc. inputs.
sips --setProperty format png "${SRC}" --out "${STAGED}" >/dev/null 2>&1
sips --resampleHeightWidthMax 512 "${STAGED}" --out "${STAGED}" >/dev/null 2>&1
sips --padToHeightWidth 512 512 --padColor 000000 "${STAGED}" --out "${STAGED}" >/dev/null 2>&1

# Strip alpha (Workshop preview composites poorly with transparency; preflight
# C9 rejects alpha channels).
sips --setProperty hasAlpha no "${STAGED}" --out "${STAGED}" >/dev/null 2>&1 || true

# Verify size and bail if absurd. The hard launcher limit is 1 MB; warn at 900
# KB so there's no edge-of-cliff surprise after a future patch.
SIZE=$(stat -f%z "${STAGED}")
if [ "${SIZE}" -ge 1048576 ]; then
  echo "ERROR: produced thumbnail is ${SIZE} bytes (>= 1 MB Workshop limit)" >&2
  exit 1
fi
if [ "${SIZE}" -ge 921600 ]; then
  echo "WARN: produced thumbnail is ${SIZE} bytes — close to 1 MB Workshop limit"
fi

mv "${STAGED}" "${DEST}"

# Also copy to the blog public/images/ so the wiki page renders the same art.
# Resolve the blog image dir from the repo root (via git) rather than a fixed
# ../../../../ hop count, so a future monorepo reorganization doesn't silently
# drop the wiki sync.
REPO_ROOT="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel 2>/dev/null || true)"
BLOG_IMG_DIR=""
if [ -n "${REPO_ROOT}" ] && [ -d "${REPO_ROOT}/apps/blog/blog/public/images" ]; then
  BLOG_IMG_DIR="${REPO_ROOT}/apps/blog/blog/public/images"
fi
if [ -n "${BLOG_IMG_DIR}" ]; then
  cp "${DEST}" "${BLOG_IMG_DIR}/stellaris-3x-bigger-worlds-thumbnail.png"
  echo "Wrote:"
  echo "  ${DEST}"
  echo "  ${BLOG_IMG_DIR}/stellaris-3x-bigger-worlds-thumbnail.png"
else
  echo "Wrote: ${DEST}"
  echo "WARN: apps/blog/blog/public/images not found from repo root; wiki image not synced"
fi
