# CI/CD Workflow for Password Generator

This document explains the Continuous Integration and Continuous Deployment (CI/CD) workflows set up for the Password Generator project.

## CI/CD Overview

Two GitHub Actions workflows run in CI:

1. **Unit Tests** (`.github/workflows/unit-tests.yml`): Runs on every push and pull request to main/dev
2. **Guard main source branch** (`.github/workflows/guard-main-source.yml`): Required check on PRs targeting main — rejects any PR whose source is not this repository's `dev` branch

Browser and E2E tests are **not** run in CI by policy — they are long-running and expensive in cloud compute, so they run locally instead (see below).

Deployment is handled automatically by Vercel.

## Workflow Details

### Unit Tests Workflow

**File**: `.github/workflows/unit-tests.yml`

This workflow runs on every push to main/dev branches and on all pull requests. It:

- Sets up Node.js and pnpm
- Installs dependencies
- Runs unit tests with Vitest (jsdom)

### Guard Workflow

**File**: `.github/workflows/guard-main-source.yml`

Enforces the branching policy: only `dev` (from this repository, not a fork) may open a PR into `main`. Runs as a required status check on every PR targeting main.

### Local Pre-PR Gate

Browser tests (Vitest + Playwright Chromium) and E2E tests (Playwright Chromium/Firefox/WebKit) run locally. Before opening a PR into main, run:

```bash
pnpm ready   # unit + browser + E2E tests, then a production build
```

### Deployment

Deployment is handled automatically by Vercel. When changes are pushed to the main branch, Vercel automatically:

- Detects the changes
- Builds the application
- Deploys to production at [passwords.roga.dev](https://passwords.roga.dev)

No additional GitHub Actions workflow is needed for deployment.

## Pull Request Flow

1. Run `pnpm ready` locally and make sure it passes
2. Open a PR from `dev` into `main`
3. The **Unit Tests** and **Guard** workflows run as required checks
4. Once merged, Vercel automatically deploys the changes
