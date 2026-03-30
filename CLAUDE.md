# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Client-side password generator PWA built with Vue 3 + Vite. Deployed at passwords.roga.dev via Vercel. Fully offline-capable — no backend, no server-side logic. Uses `crypto.getRandomValues()` for cryptographically secure password generation.

## Commands

```bash
pnpm dev              # Start dev server (localhost:5173)
pnpm build            # Production build
pnpm test             # Unit tests (jsdom via vitest)
pnpm test:watch       # Unit tests in watch mode
pnpm test:browser     # Browser tests (Playwright-backed vitest)
pnpm test:all         # Unit + browser tests
pnpm test:e2e         # Playwright end-to-end tests
pnpm test:e2e:ui      # Playwright E2E with interactive UI
```

Run a single test file: `pnpm vitest run tests/unit/urlParams.test.js`

## Architecture

- **State management**: Reactive store via `src/stores/settingsStore.js` (Vue `reactive()` composable, not Vuex/Pinia). Single source of truth consumed by all components via `useSettings()`.
- **Password generation**: Pure function in `src/utils/password.js` — takes options object, returns password string or `"Error: ..."` string on failure. Error strings are checked with `startsWith('Error:')` in the UI.
- **URL params**: `src/utils/urlParams.js` handles bidirectional sync between settings and URL query string (`?len=24&exUpper&exSym`). Boolean params use presence-means-true convention. Settings load from URL on mount, and URL updates on every setting change via `history.replaceState`.
- **Component hierarchy**: `App.vue` → `PasswordGenerator.vue` (orchestrator) → `OptionsPanel.vue`, `KeyboardExcluder.vue`, `NetworkMonitor.vue`

## Testing

Three test tiers with separate configs:
- **Unit tests** (`tests/unit/`): `vitest.config.js`, jsdom environment
- **Browser tests** (`tests/browser/`): `vitest.browser.config.js`, real Chromium via Playwright
- **E2E tests** (`tests/e2e/`): `playwright.config.js`, runs against dev server (auto-started locally, provided externally in CI)

CI runs Chromium only. Locally, E2E runs Chromium + Firefox + WebKit.

## Styling

Tailwind CSS v4 with PostCSS. Global styles in `src/main.css`, component-scoped styles via `<style scoped>`. Dark theme (zinc-950 background) with emerald accent color.
