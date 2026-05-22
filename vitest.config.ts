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
      // Thresholds calibrated for ~52 game components (post foreign-games import).
      // Smoke + axe tests cover the render path; per-game logic suites can be added
      // later to raise these.
      thresholds: {
        'src/lib/**': {
          lines: 50,
          functions: 65,
          branches: 70,
          statements: 75,
        },
        'src/components/**': {
          lines: 40,
          functions: 25,
          branches: 30,
          statements: 35,
        },
      },
    },
  },
});
