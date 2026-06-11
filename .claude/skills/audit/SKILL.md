---
name: audit
description: Use when asked to "/audit", "run the audit", "do the weekly/Monday security audit", or "patch the security advisories" — the narrow, advisories-only pnpm security sweep for this repo. Runs `pnpm audit --fix`, and if it changed anything, verifies the overrides diff is purely additive, reinstalls, runs the test suite + `pnpm build`, commits to `dev`, pushes, and opens a `dev → main` PR. If nothing changed, stops. For bringing ALL dependencies up to date (`pnpm update` + range refresh), that's a different chore — don't do it here.
disable-model-invocation: true
---

# Dependency Security Audit

You are a **dependency maintenance engineer**. This is a recurring chore (typically Monday): pull in pnpm security-advisory fixes, prove the app still builds and passes, and ship a PR for review. **Advisories only** — no `pnpm update`, no version-range refresh.

> **The user explicitly invoked this skill**, so the normal "don't commit/push/PR without asking" rule is satisfied for the steps below. Still STOP and ask if anything is ambiguous (dirty tree, unexpected failures, large/surprising diff).

## This repo's specifics

- **Package manager: pnpm 10.x** (pinned via `packageManager`). On pnpm 10, `pnpm audit --fix` resolves advisories by writing pins into the `pnpm.overrides` block of `package.json` — this repo already carries a substantial hardening `overrides` block (lodash, minimatch, rollup, serialize-javascript, ajv, picomatch, …). (If pnpm is ever bumped to 11+, bare `--fix` errors with `ERR_PNPM_INVALID_FIX_OPTION` — use `--fix=update` first, then `--fix=override`.)
- **No lint/format/typecheck scripts.** There is no `pnpm fix` / `pnpm ready` gate. The proof a dep bump didn't break anything is the **test suite + production build** (`pnpm test:all` + `pnpm build`).
- **Real test suite exists:** `pnpm test` (unit, jsdom), `pnpm test:browser` (Chromium via Playwright), `pnpm test:all` (both), `pnpm test:e2e` (Playwright E2E). Always run at least `pnpm test:all` + `pnpm build`.
- **Work lands on `dev`**, commits go directly there (no feature branch). A `dev → main` PR ships *everything* on `dev`, not just the dep patch.
- If `pnpm install` aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`, prefix with `CI=true`.

## Ground rules

- **No changes → no commit, no PR.** If `pnpm audit` is already clean or `--fix` changes nothing, STOP and report. Never create empty commits or PRs.
- **Security patches are a `chore(deps)` — no version bump.** Don't touch `package.json` `version`.
- **Stage only the dependency files.** Never `git add -A` / `git add .` — a stray file must never ride along in a deps commit. (This repo has no formatter that rewrites other files, so the dep commit should contain *only* `package.json` + `pnpm-lock.yaml`.)
- **Before opening a dev → main PR**, check `git log --oneline origin/main..dev`. If `dev` has unfinished feature work, do NOT open the PR — commit + push the patch and report, leaving the release PR to whoever owns it.

## Step 1: Preconditions

Read-only (run both in parallel):

```bash
git status --porcelain
git branch --show-current
```

**Abort and ask the user if:**

- The working tree is **not clean** — uncommitted changes would get swept into the dep commit. Ask them to stash/commit first.
- The current branch is **not `dev`** — this workflow commits to `dev`. Confirm before switching.

Then get current with the remote:

```bash
git pull --ff-only
```

## Step 2: Run the audit fix

Check first, then fix:

```bash
pnpm audit                  # what's vulnerable right now?
```

- **`No known vulnerabilities found`** → **STOP HERE.** Report: nothing to patch this week, nothing committed or pushed. Done.
- **Advisories present** → fix them:

```bash
pnpm audit --fix            # writes pnpm.overrides pins into package.json
```

> ⚠️ **CRITICAL — `--fix` REWRITES the whole overrides block, it does not just append.** It prints a reassuring summary like `2 overrides were added to package.json`, but it actually regenerates the managed `overrides` from the *current* advisory feed and **silently drops manually-curated hardening overrides whose advisories have aged out, and weakens others to looser version bounds.** The summary line is a lie of omission — do NOT trust it. This repo's overrides block is load-bearing; losing entries silently re-opens patched vulnerabilities.
>
> **MANDATORY after `pnpm audit --fix`:** run `git diff package.json` and read the FULL overrides diff. Every `-` line is a guard that was removed. If anything other than pure additions appears (removed entries, or a pin moving to a *lower/weaker* version), the regenerated block is a regression. Restore the previous block (`git checkout HEAD -- package.json` to start over, or hand-merge) so the result is **old overrides + new advisory fixes**, never *replacement*.

```bash
git diff package.json        # READ the full overrides diff — additive only?
pnpm install                 # apply the overrides to the lockfile (CI=true if it aborts)
pnpm audit                   # confirm what remains
```

Note in the final summary any advisories `pnpm audit` reports it **could not** fix (no patched version yet) — don't block on them.

**While here, sanity-check the existing `pnpm.overrides` block:** if a pinned transitive dep has since moved past its advisory on its own, the override may be dead weight. Note redundant-looking ones for the user — don't prune aggressively; overrides are load-bearing.

**Did anything actually change?**

```bash
git status --porcelain package.json pnpm-lock.yaml
```

- **No changes** → **STOP HERE.** Report and finish.
- **Changes present** → continue.

## Step 3: Verify

Make sure the lockfile fully resolves, then prove the app still works:

```bash
pnpm install      # already run above, but re-run if package.json changed since
pnpm test:all     # unit (jsdom) + browser (Chromium) — the behavior proof
pnpm build        # production Vite build — the real smoke test for a dep bump
```

- **Both pass →** Step 4. (Optionally run `pnpm test:e2e` for extra confidence if Playwright browsers are installed.)
- A **real** failure (broken test, broken build) means an override changed behavior — beyond a clean security patch. **STOP**, report the failing output, and let the user decide (pin differently, fix the code, or skip). Do not commit a red tree.

> Re-read the `package.json` / `pnpm-lock.yaml` diff before committing — confirm it's only the advisory overrides and lockfile resolution, nothing unexpected.

## Step 4: Commit, push, PR

### 4a. Commit — stage ONLY the dependency files

```bash
git add package.json pnpm-lock.yaml
git status --porcelain      # verify NOTHING else is staged
git commit -m "chore(deps): patch security advisories via pnpm audit"
```

Describe the new overrides in the body. Keep the `chore(deps):` prefix; **no version bump.**

> **Verify the commit** — if any hook rewrote files or the title, check `git log -1` and `git show --stat HEAD`. If something was mangled, re-stage and create a NEW commit (never `--amend`).

### 4b. Push (rebase first in case the remote moved)

```bash
git pull --rebase origin dev
git push origin dev
```

### 4c. Open the dev → main PR

Only if `dev` is shippable (see Ground rules). Use the **create-pr** skill. PR body is a `## Summary` section with bullets covering: which advisories were patched, which overrides were added, any that couldn't be fixed, and that `pnpm test:all` + `pnpm build` pass.

## Step 5: Report

- Which advisories were patched (and any that couldn't be), plus any new `pnpm.overrides` entries.
- Confirmation that the overrides diff was **additive only** (no silently-dropped guards).
- Any existing overrides that look stale/redundant.
- Confirmation that `pnpm test:all` and `pnpm build` passed.
- The PR URL — or, if `dev` wasn't shippable, that you committed + pushed the patch and deferred the PR.

## Quick reference

| Situation                                  | Action                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| `pnpm audit` already clean                 | STOP — "nothing to patch", no commit/PR                       |
| `--fix` + install changed nothing          | STOP — report, no commit/PR                                   |
| `--fix` diff REMOVES/weakens an override   | Regression — restore old block, keep old overrides + new fix  |
| Working tree dirty at start                | STOP — ask user to stash/commit first                         |
| Not on `dev`                               | Confirm with user before proceeding                           |
| `pnpm test:all` / `pnpm build` fails       | STOP — report, let user decide                                |
| `dev` has unfinished feature work          | Commit + push patch, SKIP the dev→main PR, report             |
| Advisory has no patched version            | Note it in the summary; don't block                           |
| Existing override looks stale              | Note it for the user; don't auto-prune                        |
| Staging                                    | `git add package.json pnpm-lock.yaml` only — never `-A` / `.` |
| Version bump                               | Never — security patches are `chore(deps)`, no bump           |
