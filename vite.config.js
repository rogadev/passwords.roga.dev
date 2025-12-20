import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // Explicitly set to 'modules' to maintain backward compatibility
    // with older browsers (e.g., Safari 14.0+) after Vite 7.3.0 changed
    // the default from 'modules' to 'baseline-widely-available'
    target: 'modules',
  },
})
