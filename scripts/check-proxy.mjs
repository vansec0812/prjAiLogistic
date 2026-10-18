import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const digest=b=>createHash('sha256').update(b).digest('hex');
const backend=createServer(async(req,res)=>{const chunks=[];for await(const b of req)chunks.push(b);const bytes=Buffer.concat(chunks);res.setHeader('Content-Type','application/json');res.setHeader('x-vercel-enable-rewrite-caching','0');res.setHeader('Cache-Control','private, no-store');res.setHeader('Set-Cookie','pc-session=proxy-test-fixture; Path=/; HttpOnly; Secure; SameSite=Lax');res.end(JSON.stringify({upstream:true,path:req.url,method:req.method,bytes:bytes.length,hash:digest(bytes),cookie:req.headers.cookie||'',csrf:req.headers['x-csrf-token']||'',origin:req.headers.origin||''}));});
await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
const upstream='http://127.0.0.1:'+backend.address().port,frontend='http://127.0.0.1:3114',data=path.resolve('.data','proxy-isolation',randomUUID());
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','apps/web','--webpack','--hostname','127.0.0.1','--port','3114'],{env:{...process.env,PLANTCARE_BUILD_DIR:'.next-proxy-check',PLANTCARE_BACKEND_URL:upstream,PLANTCARE_DATA_DIR:data,PLANTCARE_DEPLOYMENT_TARGET:'frontend',APP_ORIGIN:frontend,VERCEL:'1',GEMINI_API_KEY:'',GEMINI_VISION_MODEL:''},stdio:'ignore'});
try{
  let ready=false;for(let i=0;i<90;i++){try{const r=await fetch(frontend+'/api/v1/health');if(r.ok&&(await r.json()).upstream){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert(ready,'Proxy did not reach the external backend.');
  const first=await fetch(frontend+'/api/v1/session',{headers:{Cookie:'pc-session=owner-a'}});assert.match(first.headers.get('set-cookie')||'',/HttpOnly.*Secure.*SameSite=Lax/);assert.match(first.headers.get('cache-control')||'',/no-store/);assert.equal(first.headers.get('x-vercel-enable-rewrite-caching'),'0');assert.equal((await first.json()).cookie,'pc-session=owner-a');
  const second=await fetch(frontend+'/api/v1/session',{headers:{Cookie:'pc-session=owner-b'}});assert.equal((await second.json()).cookie,'pc-session=owner-b');
  const bytes=Buffer.alloc(3*1024*1024,65),sent=await fetch(frontend+'/api/v1/uploads?purpose=PLANT',{method:'POST',headers:{Origin:frontend,Cookie:'pc-session=owner-a','x-csrf-token':'csrf-fixture','Content-Type':'application/octet-stream'},body:bytes}),body=await sent.json();
  assert.equal(body.path,'/api/v1/uploads?purpose=PLANT');assert.equal(body.method,'POST');assert.equal(body.hash,digest(bytes));assert.equal(body.csrf,'csrf-fixture');assert.equal(body.origin,frontend);assert.equal(body.cookie,'pc-session=owner-a');assert(!existsSync(data),'Frontend unexpectedly initialized local storage.');
  console.log('Proxy smoke PASS: beforeFiles routing, query/body/CSRF/cookie forwarding, private cache headers, separate owners and no frontend database.');
}finally{child.kill();backend.closeAllConnections();await new Promise(resolve=>backend.close(resolve));}
