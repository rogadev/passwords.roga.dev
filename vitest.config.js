import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    include: ['tests/unit/**/*.test.js'],
    exclude: ['tests/e2e/**/*', 'tests/browser/**/*'],
    environment: 'jsdom',
  },
})
