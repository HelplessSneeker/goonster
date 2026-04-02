import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.tsx', 'tests/**/*.test.ts', 'src/__tests__/**/*.test.tsx', 'src/__tests__/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})
