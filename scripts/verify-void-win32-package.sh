#!/usr/bin/env bash
# Cross-check a packaged/installed Void win32 tree for AI IDE feature markers.
# Useful when inspecting an install under Wine from a Linux host.
#
# Usage:
#   ./scripts/verify-void-win32-package.sh "/path/to/Program Files/Void"

set -euo pipefail

APP_DIR="${1:-}"
if [[ -z "$APP_DIR" || ! -d "$APP_DIR" ]]; then
	echo "Usage: $0 <Void-app-dir>" >&2
	exit 2
fi

exe="$APP_DIR/Void.exe"
product="$APP_DIR/resources/app/product.json"
workbench="$APP_DIR/resources/app/out/vs/workbench/workbench.desktop.main.js"

for p in "$exe" "$product" "$workbench"; do
	if [[ ! -f "$p" ]]; then
		echo "Missing: $p" >&2
		exit 1
	fi
	echo "OK  $p"
done

python3 - "$product" <<'PY'
import json, sys
path = sys.argv[1]
product = json.load(open(path, encoding="utf-8"))
required = [
	"nameShort", "nameLong", "voidVersion", "voidRelease",
	"applicationName", "win32DirName", "urlProtocol",
]
for field in required:
	if not product.get(field):
		raise SystemExit(f"product.json missing {field}")
	print(f"OK  product.{field} = {product[field]}")
if product.get("nameShort") != "Void" or product.get("nameLong") != "Void":
	raise SystemExit("Unexpected branding in product.json")
PY

needles=(
	voidOnboarding
	void-settings
	sendLLMMessage
	EditCodeService
	"Welcome to Void"
	"Fast Apply"
	void-onboarding
	ModelDropdown
	toolsService
	mcpService
	chatThread
	QuickEdit
	ollama
	Anthropic
)

for needle in "${needles[@]}"; do
	if ! grep -a -F -q -- "$needle" "$workbench"; then
		echo "Workbench missing feature marker: $needle" >&2
		exit 1
	fi
	echo "OK  workbench contains '$needle'"
done

echo
echo "Void win32 package verification passed."
