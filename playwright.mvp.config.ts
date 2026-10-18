import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
const data=process.env.PLANTCARE_TEST_MVP_DATA_DIR||path.resolve('.data','e2e-mvp',randomUUID());process.env.PLANTCARE_TEST_MVP_DATA_DIR=data;
export default defineConfig({testDir:'tests/e2e',testMatch:'mvp.spec.ts',outputDir:'test-results/mvp',workers:1,use:{baseURL:'http://127.0.0.1:3117',browserName:'chromium',trace:'retain-on-failure'},reporter:'list',webServer:{command:'node node_modules/next/dist/bin/next dev apps/web --hostname 127.0.0.1 --port 3117',url:'http://127.0.0.1:3117/api/v1/health',reuseExistingServer:false,timeout:120000,env:{PLANTCARE_MODE:'development',APP_ORIGIN:'http://127.0.0.1:3117',PLANTCARE_DATA_DIR:data,PLANTCARE_BUILD_DIR:'.next-mvp-e2e',GEMINI_API_KEY:'uniform-frame-test-no-network',GEMINI_VISION_MODEL:'test-only'}}});
