#!/usr/bin/env bash
#
# "Validate code latest": make sure the branch being pushed is built on top of
# the newest base branch, and that it merges cleanly.
#
# Usage: check-up-to-date.sh <base-ref> [head-ref]
#
# Checks:
#   1. the branch is not behind the base branch (rebase / merge required)
#   2. the branch merges into the base without conflicts
#   3. no leftover conflict markers were committed
#
# Set ALLOW_BEHIND=<n> to tolerate being up to n commits behind the base.

set -uo pipefail

BASE=${1:?usage: check-up-to-date.sh <base-ref> [head-ref]}
HEAD_REF=${2:-HEAD}
ALLOW_BEHIND=${ALLOW_BEHIND:-0}

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; RESET=$'\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; RESET=''
fi

ERRORS=0
fail() {
  ERRORS=$((ERRORS + 1))
  if [ "${GITHUB_ACTIONS:-}" = 'true' ]; then
    echo "::error title=Branch is not up to date::$*"
  else
    echo "${RED}error${RESET} $*" >&2
  fi
}

base_sha=$(git rev-parse --verify "$BASE^{commit}") || { fail "cannot resolve base ref '$BASE'"; exit 1; }
head_sha=$(git rev-parse --verify "$HEAD_REF^{commit}")
merge_base=$(git merge-base "$base_sha" "$head_sha")

behind=$(git rev-list --count "${head_sha}..${base_sha}")
ahead=$(git rev-list --count "${base_sha}..${head_sha}")

echo "Base            : ${BASE} (${base_sha:0:8})"
echo "Head            : ${HEAD_REF} (${head_sha:0:8})"
echo "Merge base      : ${merge_base:0:8}"
echo "Ahead / behind  : ${ahead} / ${behind}"
echo

# 1. Freshness ---------------------------------------------------------------
if [ "$behind" -gt "$ALLOW_BEHIND" ]; then
  fail "branch is ${behind} commit(s) behind ${BASE}. Rebase onto the latest base before pushing: git fetch origin && git rebase origin/${BASE##*/}"
else
  echo "${GREEN}✔${RESET} branch contains the latest ${BASE}"
fi

# 2. Clean merge -------------------------------------------------------------
# `git merge-tree --write-tree` performs the merge in memory: exit code 1 means
# conflicts, and the conflicted paths are listed in the output.
if merge_output=$(git merge-tree --write-tree --name-only "$base_sha" "$head_sha" 2>/dev/null); then
  echo "${GREEN}✔${RESET} merges into ${BASE} without conflicts"
else
  conflicts=$(printf '%s\n' "$merge_output" | tail -n +2 | sed 's/^/  /')
  fail "merging into ${BASE} produces conflicts in:"
  printf '%s\n' "$conflicts" >&2
fi

# 3. Committed conflict markers ----------------------------------------------
marker_hits=''
while IFS= read -r file; do
  [ -z "$file" ] && continue
  [ -f "$file" ] || continue
  case $file in *.png|*.jpg|*.jpeg|*.gif|*.pdf|*.jar|*.zip) continue ;; esac
  if grep -nE '^(<{7}|={7}|>{7})( |$)' -- "$file" >/dev/null 2>&1; then
    marker_hits="${marker_hits}${file}"$'\n'
  fi
done <<< "$(git diff --name-only --diff-filter=d "$merge_base" "$head_sha")"

if [ -n "${marker_hits//[$'\n' ]/}" ]; then
  fail "unresolved conflict markers committed in:"
  printf '%s' "$marker_hits" | sed 's/^/  /' >&2
else
  echo "${GREEN}✔${RESET} no conflict markers in the diff"
fi

echo
if [ "$ERRORS" -gt 0 ]; then
  echo "${RED}✖ branch is not up to date with ${BASE}${RESET}"
  exit 1
fi
echo "${GREEN}✔ branch is up to date with ${BASE}${RESET}"
