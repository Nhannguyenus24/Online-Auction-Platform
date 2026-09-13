#!/usr/bin/env bash
#
# Validate a commit message against the project convention documented in
# docs/COMMIT_RULES.md and backend/CONTRIBUTING.md:
#
#     <type>(<scope>): <subject>
#
#     <body>
#
#     <footer>
#
# Usage:
#   validate-commit-msg.sh --file <path>        # read message from a file (git commit-msg hook)
#   validate-commit-msg.sh --message "<text>"   # read message from an argument
#   validate-commit-msg.sh --rev <sha>          # read message from a git object
#   validate-commit-msg.sh --range <a>..<b>     # validate every non-merge commit in a range
#   cat msg | validate-commit-msg.sh            # read message from stdin
#
# Exit code: 0 when every message passes (warnings do not fail), 1 otherwise.

set -uo pipefail

# --- Rules (tune here) -------------------------------------------------------
# Types allowed by docs/COMMIT_RULES.md, plus `build` and `revert` which are
# part of the Conventional Commits spec and harmless to accept.
ALLOWED_TYPES='feat|fix|docs|chore|refactor|test|ci|perf|style|build|revert'
# Scope pattern. docs/COMMIT_RULES.md specifies [a-z0-9_-]+; `/` and `.` are also
# accepted because the existing history uses compound scopes (e.g. `api/rating`).
SCOPE_PATTERN='[a-z0-9][a-z0-9._/-]*'
# Whether a scope is mandatory. docs/COMMIT_RULES.md requires one.
SCOPE_REQUIRED=${SCOPE_REQUIRED:-1}
# Subject length: docs say "preferably < 50". We warn past SOFT and fail past HARD
# so the documented target is visible without blocking slightly longer subjects.
SUBJECT_SOFT_MAX=${SUBJECT_SOFT_MAX:-50}
SUBJECT_HARD_MAX=${SUBJECT_HARD_MAX:-72}
# Body lines should wrap at 72 columns (warning only).
BODY_SOFT_MAX=${BODY_SOFT_MAX:-72}
# Non-imperative openers that usually mean the subject is not in imperative mood.
NON_IMPERATIVE='added|adds|adding|fixed|fixes|fixing|updated|updates|updating|changed|changes|changing|removed|removes|removing|created|creates|creating|implemented|implements|implementing|refactored|refactors|refactoring|deleted|deletes|deleting|improved|improves|improving'
# -----------------------------------------------------------------------------

if [[ -t 1 && -z ${NO_COLOR:-} ]]; then
  RED=$'\033[0;31m'; YELLOW=$'\033[0;33m'; GREEN=$'\033[0;32m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  RED=''; YELLOW=''; GREEN=''; DIM=''; RESET=''
fi

ERRORS=0
WARNINGS=0

err() {
  ERRORS=$((ERRORS + 1))
  if [[ ${GITHUB_ACTIONS:-} == 'true' ]]; then
    echo "::error title=Commit message::$*"
  else
    echo "  ${RED}error${RESET}   $*" >&2
  fi
}

warn() {
  WARNINGS=$((WARNINGS + 1))
  if [[ ${GITHUB_ACTIONS:-} == 'true' ]]; then
    echo "::warning title=Commit message::$*"
  else
    echo "  ${YELLOW}warning${RESET} $*" >&2
  fi
}

print_convention() {
  cat >&2 <<'HELP'

  Expected format (see docs/COMMIT_RULES.md):

      <type>(<scope>): <subject>

      <optional body, wrapped at 72 columns>

      <optional footer, e.g. "Closes #123">

  type   : feat | fix | docs | chore | refactor | test | ci | perf | style | build | revert
  scope  : lowercase area touched, e.g. auth, product, user, gateway, common, frontend
  subject: imperative mood, lowercase, no trailing period, < 50 characters

  Examples:
      feat(auth): add jwt token refresh endpoint
      fix(product): prevent duplicate product listings
      docs(readme): update installation steps

HELP
}

# Messages that git or tooling generates and that the convention does not cover.
is_exempt() {
  local subject=$1
  [[ $subject =~ ^Merge\ (branch|remote-tracking\ branch|pull\ request|tag)\  ]] && return 0
  [[ $subject =~ ^Revert\ \" ]] && return 0
  [[ $subject =~ ^(fixup|squash|amend)! ]] && return 0
  [[ $subject == 'Initial commit' ]] && return 0
  [[ $subject =~ ^Bump\  ]] && return 0
  return 1
}

validate_message() {
  local message=$1 label=${2:-commit message}
  local before=$ERRORS

  # Strip comment lines (git commit template) and trailing blank lines.
  message=$(printf '%s\n' "$message" | grep -v '^#' | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}')

  local subject
  subject=$(printf '%s\n' "$message" | head -n 1)

  echo "${DIM}» ${label}:${RESET} ${subject}"

  if [[ -z ${subject//[[:space:]]/} ]]; then
    err "${label}: message is empty"
    return 1
  fi

  if is_exempt "$subject"; then
    echo "  ${DIM}skipped (generated commit)${RESET}"
    return 0
  fi

  local header_re="^(${ALLOWED_TYPES})(\(${SCOPE_PATTERN}\))?(!)?: .+"
  if [[ ! $subject =~ $header_re ]]; then
    # Give a targeted reason instead of only "does not match".
    if [[ $subject != *:* ]]; then
      err "${label}: missing \"<type>(<scope>): \" prefix -> ${subject}"
    else
      local claimed_type=${subject%%[(:]*}
      if [[ ! $claimed_type =~ ^(${ALLOWED_TYPES})$ ]]; then
        err "${label}: unknown type \"${claimed_type}\" (allowed: ${ALLOWED_TYPES//|/, })"
      else
        err "${label}: malformed header, expected \"${claimed_type}(<scope>): <subject>\" -> ${subject}"
      fi
    fi
    return 1
  fi

  local type=${BASH_REMATCH[1]}
  local scope=${BASH_REMATCH[2]}
  scope=${scope#(}; scope=${scope%)}
  local subject_text=${subject#*: }

  if [[ $SCOPE_REQUIRED == 1 && -z $scope ]]; then
    err "${label}: scope is required, use \"${type}(<scope>): ...\" (e.g. ${type}(gateway): ...)"
  fi

  local len=${#subject_text}
  if (( len > SUBJECT_HARD_MAX )); then
    err "${label}: subject is ${len} characters, the limit is ${SUBJECT_HARD_MAX}"
  elif (( len > SUBJECT_SOFT_MAX )); then
    warn "${label}: subject is ${len} characters, the convention prefers under ${SUBJECT_SOFT_MAX}"
  fi

  if [[ $subject_text == *. ]]; then
    err "${label}: subject must not end with a period"
  fi

  if [[ $subject_text =~ ^[A-Z][a-z] ]]; then
    err "${label}: subject must not start with a capital letter -> ${subject_text}"
  fi

  local first_word
  first_word=$(printf '%s' "$subject_text" | awk '{print tolower($1)}')
  if [[ $first_word =~ ^(${NON_IMPERATIVE})$ ]]; then
    warn "${label}: use imperative mood in the subject (\"add\", not \"${first_word}\")"
  fi

  # Body rules: line 2 must be blank, body lines should wrap at 72 columns.
  local line_no=0
  while IFS= read -r line; do
    line_no=$((line_no + 1))
    if (( line_no == 2 )) && [[ -n ${line//[[:space:]]/} ]]; then
      err "${label}: line 2 must be blank, separating subject from body"
    fi
    # Long URLs and trailers cannot always be wrapped; skip them.
    if (( line_no > 2 )) && (( ${#line} > BODY_SOFT_MAX )) \
       && [[ ! $line =~ (https?://|^[A-Za-z-]+:\ ) ]]; then
      warn "${label}: body line ${line_no} is ${#line} characters, wrap at ${BODY_SOFT_MAX}"
    fi
  done <<< "$message"

  (( ERRORS == before ))
}

main() {
  local mode='' value='' message=''

  case ${1:-} in
    --file)    mode=file;    value=${2:?--file needs a path} ;;
    --message) mode=message; value=${2:?--message needs a string} ;;
    --rev)     mode=rev;     value=${2:?--rev needs a revision} ;;
    --range)   mode=range;   value=${2:?--range needs a revision range} ;;
    -h|--help) print_convention; exit 0 ;;
    '')        mode=stdin ;;
    *)         echo "unknown argument: $1" >&2; exit 2 ;;
  esac

  case $mode in
    file)
      [[ -f $value ]] || { echo "no such file: $value" >&2; exit 2; }
      message=$(cat "$value")
      validate_message "$message" "$(basename "$value")"
      ;;
    message) validate_message "$value" 'commit message' ;;
    rev)     validate_message "$(git log -1 --format=%B "$value")" "$(git log -1 --format=%h "$value")" ;;
    stdin)   validate_message "$(cat)" 'commit message' ;;
    range)
      local revs count=0
      revs=$(git rev-list --no-merges "$value") || { echo "invalid range: $value" >&2; exit 2; }
      if [[ -z $revs ]]; then
        echo "${YELLOW}No commits to validate in range ${value}${RESET}"
        exit 0
      fi
      while IFS= read -r sha; do
        count=$((count + 1))
        validate_message "$(git log -1 --format=%B "$sha")" "$(git log -1 --format=%h "$sha")"
      done <<< "$revs"
      echo
      echo "${DIM}Validated ${count} commit(s) in ${value}${RESET}"
      ;;
  esac

  echo
  if (( ERRORS > 0 )); then
    echo "${RED}✖ ${ERRORS} error(s), ${WARNINGS} warning(s)${RESET}"
    print_convention
    exit 1
  fi
  if (( WARNINGS > 0 )); then
    echo "${YELLOW}✔ passed with ${WARNINGS} warning(s)${RESET}"
  else
    echo "${GREEN}✔ commit message convention OK${RESET}"
  fi
  exit 0
}

main "$@"
