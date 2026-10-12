import { spawn } from 'node:child_process';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const origin='http://127.0.0.1:3002';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','apps/web','--hostname','127.0.0.1','--port','3002'],{
  env:{...process.env,NODE_ENV:'production',PLANTCARE_MODE:'development',APP_ORIGIN:origin,PLANTCARE_DATA_DIR:path.resolve('.data','production-smoke',randomUUID())},stdio:'ignore'
});
try{
  let health;
  for(let i=0;i<40;i++){try{const res=await fetch(origin+'/api/v1/health');if(res.ok){health=(await res.json()).data;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
  assert.equal(health?.mode,'production-gated');
  assert.equal((await fetch(origin+'/api/v1/auth/dev',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'})).status,404);
  assert.equal((await fetch(origin+'/api/v1/cases')).status,401);
  assert.equal((await fetch(origin+'/.data/plantcare.sqlite')).status,404);
  const publicPage=await fetch(origin);assert.equal(publicPage.status,200);
  assert.equal(publicPage.headers.get('content-security-policy')?.includes('unsafe-eval'),false);
  console.log('Production smoke: public page 200; dev auth disabled even with development config; private API 401; storage path 404; CSP no unsafe-eval.');
}finally{child.kill();}
