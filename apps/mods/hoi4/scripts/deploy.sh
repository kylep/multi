#!/bin/bash
# Deploy the Canada Overpowered mod to the HOI4 mod directory.
# Copies files directly (symlinks break launcher thumbnail detection).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOD_ROOT="$SCRIPT_DIR/.."
HOI4_DIR="$HOME/Documents/Paradox Interactive/Hearts of Iron IV"
HOI4_MOD_DIR="$HOI4_DIR/mod"
MOD_NAME="canada-overpowered"
DEST="$HOI4_MOD_DIR/$MOD_NAME"
LAUNCHER_DB="$HOI4_DIR/launcher-v2.sqlite"

if [ ! -d "$HOI4_MOD_DIR" ]; then
    echo "ERROR: HOI4 mod directory not found at: $HOI4_MOD_DIR"
    echo "Make sure Hearts of Iron IV has been launched at least once."
    exit 1
fi

# Write the outer .mod file with absolute path
cat > "$HOI4_MOD_DIR/$MOD_NAME.mod" <<EOF
version="1.0.0"
tags={
	"Alternative History"
	"Balance"
	"Gameplay"
}
name="Canada Overpowered"
picture="thumbnail.png"
supported_version="1.17.*"
path="$DEST"
EOF
echo "Wrote $MOD_NAME.mod"

# Remove existing symlink or directory
if [ -L "$DEST" ] || [ -d "$DEST" ]; then
    rm -rf "$DEST"
    echo "Removed existing $MOD_NAME"
fi

# Copy mod files (not symlink — launcher can't read thumbnails via symlinks)
cp -R "$MOD_ROOT/mod" "$DEST"
echo "Copied mod files to $DEST"

# Update launcher database thumbnail path if sqlite3 is available
if command -v sqlite3 &>/dev/null && [ -f "$LAUNCHER_DB" ]; then
    sqlite3 "$LAUNCHER_DB" "UPDATE mods SET thumbnailPath = '$DEST/thumbnail.png' WHERE displayName = 'Canada Overpowered';" 2>/dev/null
    echo "Updated launcher database thumbnail path"
fi

echo ""
echo "Done. Launch HOI4 and enable 'Canada Overpowered' in the mod launcher."
