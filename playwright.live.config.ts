import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export default defineConfig({testDir:'tests/e2e',testMatch:'live-packing.spec.ts',workers:1,use:{baseURL:'http://127.0.0.1:3107',browserName:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}},reporter:'list',webServer:{
  command:'node node_modules/next/dist/bin/next dev apps/web --webpack --hostname 127.0.0.1 --port 3107',url:'http://127.0.0.1:3107/api/v1/health',reuseExistingServer:false,timeout:120000,
  env:{PLANTCARE_MODE:'development',APP_ORIGIN:'http://127.0.0.1:3107',PLANTCARE_DATA_DIR:path.resolve('.data','e2e',randomUUID()),PLANTCARE_BUILD_DIR:'.next-live-e2e',GEMINI_API_KEY:'',GEMINI_VISION_MODEL:''}
}});
