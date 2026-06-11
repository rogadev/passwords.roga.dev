import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vitest from '@vitest/eslint-plugin'
import playwright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

// Flat config (ESLint 9+/10). ESLint owns correctness + Vue template rules;
// Prettier owns formatting. `skipFormatting` MUST stay last so it can disable
// every stylistic rule and leave whitespace decisions entirely to Prettier.
export default [
  {
    name: 'app/ignores',
    ignores: [
      'dist/',
      'dev-dist/',
      'coverage/',
      '.claude/',
      'tests/browser/__screenshots__/',
    ],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    name: 'app/browser-source',
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },

  {
    name: 'app/node-config',
    files: ['*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    // Unit (jsdom) + browser (Playwright-backed vitest) tests. `globals: true`
    // in the vitest configs means describe/it/expect/vi are ambient.
    ...vitest.configs.recommended,
    name: 'app/vitest',
    files: ['tests/unit/**/*.{js,vue}', 'tests/browser/**/*.{js,vue}'],
    languageOptions: {
      globals: { ...globals.browser, ...vitest.environments.env.globals },
    },
  },

  {
    ...playwright.configs['flat/recommended'],
    name: 'app/playwright',
    files: ['tests/e2e/**/*.{js,spec.js}'],
  },

  skipFormatting,
]
