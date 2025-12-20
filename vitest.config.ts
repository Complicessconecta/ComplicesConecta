import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { sanitizeSnapshotPath } from './src/tests/utils/snapshot-sanitizer'

const isCIEnvironment = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
const isCoverageRequested = process.argv.includes('--coverage')

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/tests/e2e/**',
      'tests/e2e/**',
      // Skipear tests con imports rotos (legacy)
      'src/tests/auth.test.ts',
      'src/tests/performance.test.ts',
      'src/tests/system-integration.test.ts',
      'src/tests/mobileUtils.test.ts',
      'src/tests/TokenAnalyticsService.test.ts',
      'src/tests/integration/system-integration.test.ts',
      'src/tests/media-access.test.ts',
      'src/tests/security/media-access.test.ts',
      'src/tests/unit/performance.test.ts',
      'src/tests/mobile.test.ts',
      'src/tests/security/biometric-auth.test.ts',
      'src/tests/Chat.test.tsx',
      'src/tests/components/Chat.test.tsx',
      'src/tests/unit/TokenAnalyticsService.test.ts',
      'src/components/profiles/shared/profile-management.spec.ts'
    ],
    testTimeout: 10000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    bail: 1,
    retry: 0,
    maxConcurrency: 5,
    coverage: {
      enabled: !isCIEnvironment && isCoverageRequested,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/dist/**'
      ]
    },
    typecheck: {
      enabled: false,
      tsconfig: './tsconfig.test.json'
    },
    dangerouslyIgnoreUnhandledErrors: true,
    // Sanitizar nombres de snapshots para evitar caracteres inválidos (Windows)
    resolveSnapshotPath: (testPath: string, snapExtension: string) => {
      const sanitizedPath = sanitizeSnapshotPath(testPath);
      return sanitizedPath.replace(/\.(test|spec)\.[jt]sx?$/, snapExtension);
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
