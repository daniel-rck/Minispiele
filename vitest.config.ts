import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['node_modules', 'dist', 'e2e', 'playwright-report', 'test-results'],
    coverage: {
      // Coverage is generated for visibility (HTML / lcov artifacts) but no
      // percentage gates — they reward exercising lines, not catching bugs.
      // Tests that find real defects (e.g. game-logic regressions, the issues
      // surfaced by review tools) are what we gate on instead.
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/pages/**',
      ],
    },
  },
});
