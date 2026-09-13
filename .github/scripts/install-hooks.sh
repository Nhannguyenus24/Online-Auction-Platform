#!/usr/bin/env bash
#
# Point git at the hooks tracked in .github/hooks so the same commit message
# rules the CI enforces also run locally.
#
# Usage: .github/scripts/install-hooks.sh
set -euo pipefail
repo_root=$(git rev-parse --show-toplevel)
git -C "$repo_root" config core.hooksPath .github/hooks
chmod +x "$repo_root"/.github/hooks/* 2>/dev/null || true
echo "core.hooksPath -> .github/hooks"
echo "Installed hooks:"
ls -1 "$repo_root/.github/hooks" | sed 's/^/  /'
echo
echo "Run 'git config --unset core.hooksPath' to disable them again."
