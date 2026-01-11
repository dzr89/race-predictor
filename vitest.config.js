import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['js/core.js', 'js/ui.js'],
      exclude: ['node_modules', 'tests', 'js/race-predictor.js']
    },
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js']
  }
});
