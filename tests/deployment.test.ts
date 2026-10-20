import { describe, expect, it } from 'vitest';
import { backendOrigin } from '../apps/web/src/lib/deployment';
import { validateBackendEnvironment } from '../apps/web/src/server/runtime';
describe('split deployment configuration',()=>{
  it('runs API on Vercel with cloud storage and rejects mixing cloud storage with a proxy',()=>{
    expect(backendOrigin({VERCEL:'1',PLANTCARE_STORAGE:'postgres'})).toBeNull();
    expect(()=>backendOrigin({PLANTCARE_STORAGE:'postgres',PLANTCARE_BACKEND_URL:'https://backend.test'})).toThrow();
  });
  it('fails frontend build without upstream and rejects credentials, paths and proxy loops',()=>{
    expect(()=>backendOrigin({VERCEL:'1'})).toThrow();
    for(const url of ['http://backend.test','https://x:y@backend.test','https://backend.test/api','https://backend.test/?token=x'])expect(()=>backendOrigin({NODE_ENV:'production',PLANTCARE_BACKEND_URL:url})).toThrow();
    expect(()=>backendOrigin({PLANTCARE_BACKEND_URL:'https://app.test',APP_ORIGIN:'https://app.test'})).toThrow();expect(backendOrigin({PLANTCARE_BACKEND_URL:'https://backend.test',NODE_ENV:'production'})).toBe('https://backend.test');expect(backendOrigin({})).toBeNull();
  });
  it('requires persistent storage, stable secrets and configured external providers on the backend',()=>{
    expect(()=>validateBackendEnvironment({})).toThrow();const env={APP_ORIGIN:'https://app.test',PLANTCARE_DATA_DIR:process.platform==='win32'?'D:\\data':'/data',PLANTCARE_OTP_SECRET:'a'.repeat(40),SMS_ADAPTER_URL:'https://sms.test/send',SMS_ADAPTER_TOKEN:'token',GEMINI_API_KEY:'key',GEMINI_VISION_MODEL:'vision-model'};
    expect(()=>validateBackendEnvironment(env)).not.toThrow();expect(()=>validateBackendEnvironment({...env,PLANTCARE_DATA_DIR:'./data'})).toThrow();expect(()=>validateBackendEnvironment({...env,PLANTCARE_BACKEND_URL:'https://backend.test'})).toThrow();
  });
});
