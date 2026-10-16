import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/legacy/**', 'legacy-app/**', 'tests/**', 'dist/**'],
    environment: 'node',
    restoreMocks: true,
  },
})
