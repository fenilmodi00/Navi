import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/**/*.test.ts',
        'src/types.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@elizaos/core': path.resolve(__dirname, 'src/__tests__/__mocks__/elizaos-core.ts')
    }
  }
});
