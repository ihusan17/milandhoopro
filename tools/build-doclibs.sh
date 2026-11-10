#!/usr/bin/env bash
# Rebuilds src/pcc/doclibs.min.js from npm packages (MIT / Apache-2.0):
# docxtemplater, pizzip, jszip, docx-preview, qrcode-generator. Run from the repository root.
set -euo pipefail
tmp=$(mktemp -d)
cp src/pcc/vendor-entry.js "$tmp/entry.js"
( cd "$tmp" && npm init -y >/dev/null && npm i -q docxtemplater pizzip jszip docx-preview qrcode-generator esbuild >/dev/null \
  && npx esbuild entry.js --bundle --minify --format=iife --target=es2019 --legal-comments=none --outfile=doclibs.min.js )
cp "$tmp/doclibs.min.js" src/pcc/doclibs.min.js
rm -rf "$tmp"
echo "src/pcc/doclibs.min.js rebuilt"
