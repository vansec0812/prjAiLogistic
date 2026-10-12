import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export default defineConfig({testDir:'tests/e2e',workers:1,use:{baseURL:'http://127.0.0.1:3001',browserName:'chromium',trace:'retain-on-failure'},reporter:'list',webServer:{
  command:'node node_modules/next/dist/bin/next dev apps/web --hostname 127.0.0.1 --port 3001',url:'http://127.0.0.1:3001/api/v1/health',reuseExistingServer:false,timeout:120000,
  env:{PLANTCARE_MODE:'development',APP_ORIGIN:'http://127.0.0.1:3001',PLANTCARE_DATA_DIR:path.resolve('.data','e2e',randomUUID()),PLANTCARE_BUILD_DIR:'.next-e2e',GEMINI_API_KEY:'',GEMINI_VISION_MODEL:''}
}});
