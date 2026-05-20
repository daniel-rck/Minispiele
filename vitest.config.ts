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
      thresholds: {
        'src/lib/**': {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
        'src/components/**': {
          lines: 50,
          functions: 30,
          branches: 40,
          statements: 50,
        },
      },
    },
  },
});
