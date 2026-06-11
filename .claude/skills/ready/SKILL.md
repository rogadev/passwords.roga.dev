---
name: ready
description: Use when asked to "/ready", "run the ready checks", or "is this ready for a PR?" — and proactively before opening any dev → main PR or after finishing a session of work in this repo.
---

# Ready Gate

You are the **release gatekeeper**. `/ready` means: prove the project is shippable *right now*, in this session, and fix what isn't. Browser and E2E tests are local-only **by policy** (not in CI to save compute) — this gate is the ONLY place they run. Skipping a tier here means it runs nowhere.

> The user explicitly invoking `/ready` authorizes committing fixes to `dev`. It does NOT authorize pushing or opening a PR — those are separate requests.

## The Iron Rule

**The project is "ready" only if one uninterrupted `pnpm ready` run goes green after your last change.** Not before your last change. Not inferred from a previous run, CI, or a clean `git status`.

## Steps

1. **Preconditions:** confirm you're on `dev`; if `node_modules` is stale or missing, `pnpm install` (prefix `CI=true` if it aborts). Note what's uncommitted — you must know what you're gating.
2. **Run the gate:** `pnpm ready`. Its composition in `package.json` is the source of truth (tests + build; lint/format steps may be added over time — never bypass parts of the chain by running steps selectively and declaring victory).
3. **On failure — fix the root cause:**
   - Diagnose against documented invariants (CLAUDE.md) — they arbitrate "regression" vs "intended change".
   - While iterating, rerun just the failing tier/file (`pnpm vitest run tests/unit/x.test.js`, `pnpm test:e2e --project=chromium <file>`) for speed.
   - **Never make the gate green by weakening it:** no deleting/skipping tests, no loosening assertions, no `--reporter` tricks. If a test fails because behavior changed *intentionally*, update test + docs together and say so; if intent is ambiguous, STOP and ask the user.
   - Known environmental flake: the network-monitor E2E pings google.com and needs network. Re-run once; if it's genuinely environmental, report it — don't "fix" the test.
4. **Re-run the full gate** (`pnpm ready`, from the top) after the last fix. Any fix can break another tier.
5. **Commit fixes** (if any): stage only the files you changed — never `git add -A`. One commit per logical fix.
6. **Report:** what ran, what failed, what you fixed and why, and the final verdict backed by the clean run.

## Red Flags — you are rationalizing

| Excuse | Reality |
|--------|---------|
| "Unit tests passed, that's enough" | Browser/E2E/build run nowhere else. Run the full gate. |
| "Tree matches HEAD / this commit already passed" | Prove it now. Environments drift; deps changed; that's the point of `/ready`. |
| "It's late / user wants to wrap up quickly" | The gate IS the wrap-up. A broken PR costs more than 3 minutes of tests. |
| "I'll just update the failing test" | Only if the behavior change is documented and intentional — otherwise fix the code. |
| "E2E is slow, I'll skip WebKit/Firefox" | Local E2E covers all three engines because CI covers none. |
