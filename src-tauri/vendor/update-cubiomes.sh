#!/usr/bin/env bash
# Re-vendors src-tauri/vendor/cubiomes/ from the upstream fork
# https://github.com/xpple/cubiomes, preserving our own rust_shim.c
# (not part of upstream) and regenerating VENDORED_COMMIT.txt.
#
# Usage: run from anywhere; paths below are relative to this script's dir.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENDOR_DIR="$SCRIPT_DIR/cubiomes"
UPSTREAM_URL="https://github.com/xpple/cubiomes"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Cloning $UPSTREAM_URL (shallow)..."
git clone --depth 1 "$UPSTREAM_URL" "$TMP_DIR/cubiomes"

COMMIT="$(git -C "$TMP_DIR/cubiomes" rev-parse HEAD)"
DATE="$(date +%Y-%m-%d)"

echo "Backing up our custom rust_shim.c..."
cp "$VENDOR_DIR/rust_shim.c" "$TMP_DIR/rust_shim.c"

echo "Removing old vendored files (except .git of the clone itself)..."
rm -rf "$TMP_DIR/cubiomes/.git"

echo "Syncing new upstream content into $VENDOR_DIR ..."
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"
cp -a "$TMP_DIR/cubiomes/." "$VENDOR_DIR/"

echo "Restoring rust_shim.c (our own file, not upstream)..."
cp "$TMP_DIR/rust_shim.c" "$VENDOR_DIR/rust_shim.c"

cat > "$VENDOR_DIR/VENDORED_COMMIT.txt" <<EOF
Vendored from: $UPSTREAM_URL
Commit:        $COMMIT
Date:          $DATE
EOF

echo "Done. Vendored $UPSTREAM_URL @ $COMMIT"
echo "Next steps: cargo check --all-targets (in src-tauri/), review git diff before committing."
