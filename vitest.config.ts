import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({ resolve:{alias:{'@plantcare/domain':path.resolve('packages/domain/src/index.ts'),'@plantcare/rule-engine':path.resolve('packages/rule-engine/src/index.ts')}},test: { include: ['tests/**/*.test.ts'], environment: 'node', fileParallelism: false } });
