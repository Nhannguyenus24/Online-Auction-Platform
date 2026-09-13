# CI — Phase 1

Every push and pull request runs [`.github/workflows/ci.yml`](workflows/ci.yml).
Phase 1 answers four questions before any code is merged:

| # | Stage | Question | Script |
| - | ----- | -------- | ------ |
| 1 | `commit-lint` | Do the commit messages follow the convention? | [`validate-commit-msg.sh`](scripts/validate-commit-msg.sh) |
| 2 | `up-to-date` | Is the branch built on the latest base and conflict free? | [`check-up-to-date.sh`](scripts/check-up-to-date.sh) |
| 3 | `detect-changes` | Which components does the change touch? | [`detect-changes.sh`](scripts/detect-changes.sh) |
| 4 | `backend` | Does the affected backend code compile and do its tests pass? | maven |
| 5 | `frontend` | Does the SPA lint and build? | npm |
| 6 | `ci-status` | Aggregated result — use this as the required status check. | — |

Every script is plain bash and can be run locally, exactly as CI runs it.

## 1. Commit messages

The rules come from [`docs/COMMIT_RULES.md`](../docs/COMMIT_RULES.md) and
[`backend/CONTRIBUTING.md`](../backend/CONTRIBUTING.md):

```
<type>(<scope>): <subject>

<optional body, wrapped at 72 columns>

<optional footer, e.g. Closes #123>
```

Errors (the build fails):

- unknown or missing `type` — allowed: `feat fix docs chore refactor test ci perf style build revert`
- missing `scope`, or a scope that is not lowercase `[a-z0-9._/-]`
- subject longer than 72 characters, ending with a period, or starting with a capital letter
- a non-blank second line (subject and body must be separated)

Warnings (visible, but the build stays green):

- subject longer than the 50 characters the convention prefers
- a subject that is not in imperative mood ("added" instead of "add")
- body lines wider than 72 columns

Merge, revert, `fixup!` and `Bump …` commits are skipped.

Which commits are checked: on a pull request every commit in
`origin/<base>..HEAD`; on a push the commits the push actually added
(`github.event.before..HEAD`), falling back to the merge base with `main` for
new branches.

The very first push after the pipeline lands also carries whatever history
was not pushed yet, so older commits get checked once. That is a one-off:
each later push only sees the commits it actually adds.

Run it yourself:

```bash
.github/scripts/validate-commit-msg.sh --message "feat(gateway): add rate limit filter"
.github/scripts/validate-commit-msg.sh --range origin/main..HEAD
.github/scripts/validate-commit-msg.sh --rev HEAD
```

Install the same check as a local git hook so a bad message never reaches CI:

```bash
.github/scripts/install-hooks.sh    # sets core.hooksPath to .github/hooks
```

## 2. Branch freshness

`check-up-to-date.sh` fails when the branch is **behind** its base branch, when
it would **conflict** on merge, or when **conflict markers** were committed.

```bash
git fetch origin
.github/scripts/check-up-to-date.sh origin/main HEAD
```

To fix a "behind" failure: `git fetch origin && git rebase origin/main`.
Set `ALLOW_BEHIND=<n>` to tolerate a few commits of drift.

## 3. Affected components

`detect-changes.sh` maps changed paths to components and to the maven modules
that must be rebuilt, so a frontend-only change never waits for a backend build.

| Changed path | Effect |
| --- | --- |
| `backend/<service>/**` | build and test that service only |
| `backend/common_libs/**` | shared code — build and test **all** services |
| `backend/pom.xml`, `backend/Dockerfile` | build and test **all** services |
| `.github/workflows/**`, `.github/scripts/**` | full backend build, to validate the pipeline itself |
| `frontend/**` | lint and build the SPA |
| `docs/**`, `*.md`, `monitoring/**`, `docker-compose.yml` | no build |

```bash
.github/scripts/detect-changes.sh origin/main HEAD
```

## 4. Compile and test

The backend job runs once per affected module, in parallel:

```bash
mvn -B -ntp -pl <module> -am -DskipTests clean install   # compile module + its dependencies
mvn -B -ntp -pl <module> test                            # run its tests
```

`@SpringBootTest` context tests need real infrastructure, so the job starts
MySQL 8.0, Redis 7.2 and RabbitMQ 3.13 service containers with the same
credentials as [`docker-compose.yml`](../docker-compose.yml), and loads
[`docs/mysqldb.sql`](../docs/mysqldb.sql) before the tests run. Surefire reports
are uploaded as artifacts and summarised in the job summary.

The frontend job runs `npm ci --legacy-peer-deps`, `npm run lint` and
`npm run build`. `--legacy-peer-deps` is required because `react-helmet-async`
still declares a React 18 peer range while the app is on React 19.

`npm run lint` is **advisory in phase 1**: the current sources report 35 eslint
errors (mostly unused variables), so failing on them would block every change.
Remove `continue-on-error: true` from the Lint step once they are fixed to turn
it into a real gate.

## Branch protection

Require the **`CI status`** check on `main`. It is the only check that always
runs, and it fails if any stage failed while tolerating the stages that were
legitimately skipped (`backend` and `frontend` are skipped when nothing they
cover changed).

Note that the freshness stage reports success rather than skipping on a push to
`main`: a skipped job makes GitHub skip everything downstream of it, which would
silently cancel the build.

## Next phases

Phase 1 deliberately stops at "does it build and do the tests pass". Later
phases can add static analysis and coverage gates, container image builds, and
deployment.
