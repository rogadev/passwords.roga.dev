# CI/CD Workflow for Password Generator

This document explains the Continuous Integration and Continuous Deployment (CI/CD) workflows set up for the Password Generator project.

## CI/CD Overview

We've implemented two GitHub Actions workflows for testing:

1. **Unit Tests**: Runs on every push and pull request
2. **End-to-End Tests**: Runs on pull requests to the main branch

Deployment is handled automatically by Vercel.

## Workflow Details

### Unit Tests Workflow

**File**: `.github/workflows/unit-tests.yml`

This workflow runs on every push to main/dev branches and on all pull requests. It:
- Sets up Node.js
- Installs dependencies
- Runs unit tests with Vitest
- Uploads test results as artifacts

### End-to-End Tests Workflow

**File**: `.github/workflows/e2e-tests.yml`

This workflow runs on pull requests to the main branch. It:
- Sets up Node.js
- Installs dependencies and Playwright browsers
- Runs unit tests
- Builds the application
- Starts a server and runs E2E tests with Playwright
- Uploads test results as artifacts

### Deployment

Deployment is handled automatically by Vercel. When changes are pushed to the main branch, Vercel automatically:
- Detects the changes
- Builds the application
- Deploys to production at [passwords.roga.dev](https://passwords.roga.dev)

No additional GitHub Actions workflow is needed for deployment.

## Pull Request Flow

When submitting a pull request to the main branch:

1. The **Unit Tests** workflow runs immediately
2. The **End-to-End Tests** workflow runs to verify all functionality
3. Once merged, Vercel automatically deploys the changes

## Manual Triggering

The E2E Tests workflow can be triggered manually from the GitHub Actions tab if needed.

## Artifacts

Test results and reports are saved as artifacts for each workflow run:
- Unit test results are available for 7 days
- E2E test reports are available for 7 days

These can be accessed from the workflow run page in the GitHub Actions tab. 