#!/usr/bin/env bash
#
# Work out which components of the monorepo a change touches, so the rest of the
# pipeline only compiles and tests what is affected.
#
# Usage: detect-changes.sh <base-ref> <head-ref>
#
# Writes `key=value` lines to $GITHUB_OUTPUT when running on GitHub Actions and
# always prints a human readable report on stdout.
#
# Outputs:
#   changed_files    number of files in the diff
#   backend          true when any backend module must be built
#   frontend         true when the frontend must be built
#   modules          JSON array of maven modules to build, e.g. ["gateway","user"]
#   common_libs      true when the shared libraries must be built and tested
#   components       comma separated list of components touched
#   build_all        true when a shared change forces every backend module
#
# Kept compatible with bash 3.2 so it also runs on a stock macOS shell.

set -euo pipefail

BASE=${1:?usage: detect-changes.sh <base-ref> <head-ref>}
HEAD=${2:-HEAD}

# Every maven module under backend/ that produces a deployable service.
ALL_MODULES="gateway user products notification chat"

COMPONENTS=""
MODULES=""
BUILD_ALL=false

# add_unique <list-variable-name> <value>
add_unique() {
  local var=$1 value=$2 current
  eval "current=\${$var}"
  case " $current " in
    *" $value "*) ;;
    *) eval "$var=\"\${$var} \$value\"" ;;
  esac
}

mark_all_modules() {
  local m
  for m in $ALL_MODULES; do add_unique MODULES "$m"; done
  BUILD_ALL=true
}

changed_files=$(git diff --name-only "$BASE" "$HEAD")
file_count=$(printf '%s\n' "$changed_files" | grep -c . || true)

while IFS= read -r file; do
  [ -z "$file" ] && continue
  case $file in
    backend/common_libs/*)
      # Shared libraries are compiled into every service, so rebuild all of them.
      add_unique COMPONENTS common_libs
      mark_all_modules
      ;;
    backend/pom.xml|backend/Dockerfile|backend/.mvn/*|backend/mvnw*)
      add_unique COMPONENTS backend-build
      mark_all_modules
      ;;
    .github/workflows/*|.github/scripts/*)
      # Validate the pipeline itself against the full build.
      add_unique COMPONENTS ci
      mark_all_modules
      ;;
    backend/*)
      module=${file#backend/}
      module=${module%%/*}
      case " $ALL_MODULES " in
        *" $module "*)
          add_unique COMPONENTS "$module"
          add_unique MODULES "$module"
          ;;
        *) add_unique COMPONENTS backend-docs ;;
      esac
      ;;
    frontend/*)     add_unique COMPONENTS frontend ;;
    docs/*|*.md|LICENSE) add_unique COMPONENTS docs ;;
    monitoring/*|docker-compose.yml) add_unique COMPONENTS infra ;;
    *)              add_unique COMPONENTS misc ;;
  esac
done <<< "$changed_files"

# Emit modules in a stable order regardless of the order files appeared in.
selected=""
for m in $ALL_MODULES; do
  case " $MODULES " in *" $m "*) selected="$selected $m" ;; esac
done

modules_json='[]'
if [ -n "${selected// /}" ]; then
  modules_json=$(printf '%s\n' $selected | awk 'BEGIN{printf "["} {printf "%s\"%s\"", (NR>1 ? "," : ""), $0} END{printf "]"}')
fi

backend=false
[ -n "${selected// /}" ] && backend=true

frontend=false
case " $COMPONENTS " in *" frontend "*) frontend=true ;; esac

# The shared libraries are also rebuilt whenever something forces a full build.
common_libs=false
case " $COMPONENTS " in *" common_libs "*) common_libs=true ;; esac
if [ "$BUILD_ALL" = true ]; then
  common_libs=true
fi

component_list=$(printf '%s\n' $COMPONENTS | sort -u | paste -sd',' -)
[ -z "$component_list" ] && component_list='none'

echo "Diff range      : ${BASE}..${HEAD}"
echo "Changed files   : ${file_count}"
echo "Components      : ${component_list}"
echo "Backend modules : ${modules_json}"
echo "Common libs     : ${common_libs}"
echo "Frontend        : ${frontend}"
echo "Full backend    : ${BUILD_ALL}"
echo
echo "Files:"
printf '%s\n' "$changed_files" | sed 's/^/  /'

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  {
    echo "changed_files=${file_count}"
    echo "backend=${backend}"
    echo "frontend=${frontend}"
    echo "common_libs=${common_libs}"
    echo "modules=${modules_json}"
    echo "components=${component_list}"
    echo "build_all=${BUILD_ALL}"
  } >> "$GITHUB_OUTPUT"
fi

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Affected components"
    echo
    echo "| Item | Value |"
    echo "| --- | --- |"
    echo "| Changed files | ${file_count} |"
    echo "| Components | \`${component_list}\` |"
    echo "| Backend modules | \`${modules_json}\` |"
    echo "| Common libraries | ${common_libs} |"
    echo "| Frontend build | ${frontend} |"
  } >> "$GITHUB_STEP_SUMMARY"
fi
