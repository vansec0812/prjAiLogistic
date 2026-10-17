import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
// Explicit opt-in only: this config calls Gemini once with a synthetic blank image.
export default defineConfig({ testDir: 'tests/e2e', testMatch: ['gemini-real.spec.ts', 'gemini-tts-real.spec.ts'], workers: 1, retries: 0, use: { baseURL: 'http://127.0.0.1:3109' }, reporter: 'list', webServer: {
  command: 'node node_modules/next/dist/bin/next dev apps/web --webpack --hostname 127.0.0.1 --port 3109', url: 'http://127.0.0.1:3109/api/v1/health', reuseExistingServer: false, timeout: 120000,
  env: { PLANTCARE_MODE: 'development', APP_ORIGIN: 'http://127.0.0.1:3109', PLANTCARE_DATA_DIR: path.resolve('.data', 'gemini-real', randomUUID()), PLANTCARE_BUILD_DIR: '.next-gemini-test' }
} });
