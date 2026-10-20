// Opt-in production smoke. Only UUID-scoped disposable fixtures are created.
// DATABASE_URL must refer to PlantCare's own database. No local user data is sent.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Client } from 'pg';
import { hashSync } from 'bcryptjs';
import sharp from 'sharp';

const base=new URL(process.argv[2]||'https://prj-ai-logistic.vercel.app').origin;
const origin=process.env.APP_ORIGIN||base,withAi=process.argv.includes('--ai');
const url=new URL(process.env.DATABASE_URL||'');
for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key);
const client=new Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:15000});
const fixtures=[];
async function call(actor,route,method='GET',data,csrf=true){
  return fetch(base+'/api/v1/'+route,{method,headers:{Origin:origin,...(actor?{Cookie:actor.cookie,...(csrf?{'x-csrf-token':actor.csrf}:{})}:{}),...(data instanceof FormData?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:data instanceof FormData?data:JSON.stringify(data)}),signal:AbortSignal.timeout(45000)});
}
async function value(response,status=200){assert.equal(response.status,status,'Unexpected HTTP status');const body=await response.json();return body.data;}
async function actor(){
  const id='deploy-'+randomUUID(),username='deploy_'+randomUUID().replaceAll('-','').slice(0,16),password=randomUUID()+randomUUID(),phone='+849'+String(Date.now()).slice(-7)+String(fixtures.length);
  await client.query('INSERT INTO plantcare.users VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,username,phone,'Disposable deployment fixture',hashSync(password,10),'ACTIVE','MEMBER',new Date().toISOString()]);fixtures.push({id,username});
  const response=await call(null,'auth/login','POST',{username,password});assert.equal(response.status,200);const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);assert.match(cookie,/Secure/i);const body=await response.json();return {id,username,cookie:cookie.split(';')[0],csrf:body.data.csrf};
}
try{
  const health=await value(await call(null,'health'));assert.equal(health.storage,'postgres');assert.equal(health.mode,'production-gated');
  assert.equal((await fetch(base)).status,200);
  assert.equal((await call(null,'cases')).status,401);
  assert.equal((await call(null,'auth/dev','POST',{})).status,404);
  await client.connect();
  const a=await actor(),b=await actor();
  assert.equal((await call(a,'cases','POST',{name:'No CSRF fixture'},false)).status,403);
  const c=await value(await call(a,'cases','POST',{name:'Disposable deployment smoke'}),201);
  assert.equal((await call(b,'cases/'+c.id)).status,404);
  const bytes=withAi?readFileSync('tests/fixtures/cayphuquy-demo.jpg'):await sharp({create:{width:32,height:32,channels:3,background:'#228844'}}).png().toBuffer();
  const form=new FormData();form.set('case_id',c.id);form.set('purpose','PLANT');form.set('storage_consent','true');form.set('file',new Blob([bytes],{type:withAi?'image/jpeg':'image/png'}),'fixture.'+(withAi?'jpg':'png'));
  const uploaded=await value(await call(a,'uploads','POST',form),201);
  assert.equal((await call(null,'uploads/'+uploaded.id)).status,401);assert.equal((await call(b,'uploads/'+uploaded.id)).status,404);
  const image=await call(a,'uploads/'+uploaded.id);assert.equal(image.status,200);assert.match(image.headers.get('cache-control'),/private.*no-store/);assert.equal((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).format,'webp');
  assert.equal((await call(a,'cases/'+c.id)).status,200);
  if(withAi){
    const consent=await value(await call(a,'consents','POST',{purpose:'AI_ANALYSIS',accepted:true}),201);
    const queued=await value(await call(a,'cases/'+c.id+'/plant-analysis','POST',{upload_ids:[uploaded.id],consent_id:consent.id}),202);
    let job;
    for(let i=0;i<30;i++){
      job=await value(await call(a,'jobs/'+queued.job_id));
      if(['SUCCEEDED','FAILED','CANCELLED'].includes(job.status))break;
      await new Promise(resolve=>setTimeout(resolve,1500));
    }
    assert.equal(job?.status,'SUCCEEDED','AI background job failed: '+(job?.error||job?.status));
    assert.equal(job.result.schema_version,'vision-v3');
  }
  console.log(JSON.stringify({result:'PASS',base,storage:'postgres',publicPage:true,auth:true,csrf:true,ownerIsolation:true,privateUpload:true,persistence:true,realVision:withAi,smsConfigured:health.smsConfigured}));
}finally{
  if(fixtures.length){
    const ids=fixtures.map(x=>x.id);
    const {rows}=await client.query("SELECT kind,id,body FROM plantcare.documents WHERE owner_id=ANY($1::text[])",[ids]);
    for(const row of rows){
      const doc=JSON.parse(row.body);
      if(row.kind==='upload')await client.query('DELETE FROM plantcare.private_files WHERE key=$1',['uploads/'+doc.file]);
      if(row.kind==='job')await client.query('DELETE FROM plantcare.outbox WHERE job_id=$1',[row.id]);
    }
    for(const table of ['sessions','challenges','otp_locks'])await client.query('DELETE FROM plantcare.'+table+' WHERE user_id=ANY($1::text[])',[ids]);
    for(const table of ['documents','idempotency','shares'])await client.query('DELETE FROM plantcare.'+table+' WHERE owner_id=ANY($1::text[])',[ids]);
    await client.query('DELETE FROM plantcare.audit WHERE actor_id=ANY($1::text[])',[ids]);
    for(const f of fixtures)await client.query('DELETE FROM plantcare.limits WHERE bucket=$1',['login:'+createHash('sha256').update(f.username).digest('hex')]);
    await client.query('DELETE FROM plantcare.users WHERE id=ANY($1::text[])',[ids]);
  }
  await client.end();
}
