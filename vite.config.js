import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { hmr: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  build: {
    rollupOptions: {
      output: {
        // Stable chunk names so browsers can diff old vs new
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
