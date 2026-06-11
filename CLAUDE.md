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

- **State management**: Reactive store via `src/stores/settingsStore.js` (Vue `reactive()` composable, not Vuex/Pinia). Single source of truth consumed by all components via `useSettings()`. All mutators (`updateSetting()`, `toggleSetting()`, `setSettings()`) enforce a cross-field invariant via `enforceInvariants()` — it auto-disables `ruleNoLeadingSpecial` when both letter sets are excluded. Always mutate settings through these mutators (never `Object.assign` onto the reactive object) so the invariant holds.
- **Password generation**: Pure function in `src/utils/password.js` — takes options object, returns password string or `"Error: ..."` string on failure. Error strings are checked with `startsWith('Error:')` in the UI. Key invariants: lengths outside 1–128 are rejected with an error (the UI clamps input to this range before it reaches the generator); each enabled (and not fully excluded) character set contributes at least one guaranteed character; `getRandomInt()` uses rejection sampling over `Uint32Array` to avoid modulo bias; the result is Fisher-Yates shuffled. The `ruleNoLeadingSpecial` rule runs *after* shuffling, swapping the leading char with the first letter found.
- **URL params**: `src/utils/urlParams.js` handles bidirectional sync between settings and URL query string (`?len=24&exUpper&exSym`). Boolean params use presence-means-true convention. Only non-default values are serialized (keeps URLs clean). Settings load from URL on mount (via `setSettings()` so store invariants apply), and URL updates on setting changes via `history.replaceState`, debounced 200ms because Safari throttles `replaceState` calls. The keys are remapped (`length`→`len`, `excludeUppercase`→`exUpper`, etc.) in the `PARAM_KEYS` map.
- **Component hierarchy**: `App.vue` → `PasswordGenerator.vue` (orchestrator) → `OptionsPanel.vue`, `KeyboardExcluder.vue`, `NetworkMonitor.vue`
- **Network monitor**: `NetworkMonitor.vue` monkey-patches `window.fetch`, `XMLHttpRequest`, and `navigator.sendBeacon` to log outbound requests, demonstrating that generation is fully local. Interception is lazy (starts only when the panel opens) and originals are restored on unmount.
- **PWA / offline**: `vite-plugin-pwa` (configured in `vite.config.js`) generates a service worker with `registerType: 'autoUpdate'`. Workbox precaches all build assets including self-hosted fonts (`woff`/`woff2`), so the app works fully offline. Build target supports Safari 14+.

## Testing

Three test tiers with separate configs:
- **Unit tests** (`tests/unit/`): `vitest.config.js`, jsdom environment
- **Browser tests** (`tests/browser/`): `vitest.browser.config.js`, real Chromium via Playwright
- **E2E tests** (`tests/e2e/`): `playwright.config.js`, runs against dev server (auto-started locally, provided externally in CI)

CI runs Chromium only. Locally, E2E runs Chromium + Firefox + WebKit.

## Styling

Tailwind CSS v4 with PostCSS. Global styles in `src/main.css`, component-scoped styles via `<style scoped>`. Dark theme (zinc-950 background) with emerald accent color.
