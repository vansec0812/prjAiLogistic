import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fullPlantScanSchema } from '../../apps/web/src/lib/plant-recognition';
import { selectSop, validateResult } from '../../apps/web/src/lib/live-packing';

test('real recognition evaluates all fields and fills estimates only for a visible plant',async({request})=>{
  test.skip(process.env.RUN_REAL_GEMINI!=='1','Opt in: two recognition calls, blank and AI plant illustration.');test.setTimeout(120000);
  const origin='http://127.0.0.1:3109';expect((await request.post('/api/v1/auth/dev',{headers:{Origin:origin},data:{}})).status()).toBe(200);
  const session=(await (await request.get('/api/v1/session')).json()).data,headers={Origin:origin,'x-csrf-token':session.csrf};expect(session.aiConfigured).toBe(true);
  const samples=[{name:'blank',bytes:await sharp({create:{width:320,height:240,channels:3,background:'white'}}).jpeg().toBuffer()},{name:'plant',bytes:await sharp(readFileSync('apps/web/public/photos/step-3-v2.webp')).resize(960).jpeg().toBuffer()}];
  for(const {name,bytes} of samples){
  const c=(await (await request.post('/api/v1/cases',{headers,data:{name:'Real recognition '+name}})).json()).data;
  const upload=await request.post('/api/v1/uploads',{headers,multipart:{case_id:c.id,purpose:'PLANT',file:{name:name+'.jpg',mimeType:'image/jpeg',buffer:bytes}}});expect(upload.status()).toBe(201);const saved=(await upload.json()).data;
  const consent=(await (await request.post('/api/v1/consents',{headers,data:{purpose:'AI_ANALYSIS',accepted:true}})).json()).data;
  const start=await request.post(`/api/v1/cases/${c.id}/plant-analysis`,{headers,data:{upload_ids:[saved.id],consent_id:consent.id}});expect(start.status()).toBe(202);const {job_id:id}=(await start.json()).data;
  let job:any;for(let i=0;i<100;i++){job=(await (await request.get('/api/v1/jobs/'+id)).json()).data;if(['SUCCEEDED','FAILED','CANCELLED'].includes(job.status))break;await new Promise(r=>setTimeout(r,800));}
  expect(job.status,job.error).toBe('SUCCEEDED');const parsed=fullPlantScanSchema.parse(job.result),readings=parsed.plant_details.readings;expect(readings).toHaveLength(6);expect(job.result.status).toBe('UNCONFIRMED');expect(job.result.measurements).toBeNull();
  if(name==='blank'){expect(readings.every(r=>r.value===null&&r.origin==='UNKNOWN')).toBe(true);expect(parsed.plant_candidates.every(c=>c.group==='UNKNOWN')).toBe(true);}
  else{expect(parsed.plant_candidates[0].name.length).toBeGreaterThan(0);expect(parsed.plant_candidates[0].group).toBe('FOLIAGE');expect(readings.every(r=>r.value!==null&&r.value>0)).toBe(true);expect(readings.some(r=>r.origin==='VISUAL_ESTIMATE')).toBe(true);}
  console.log(JSON.stringify({sample:name,recognitionJobStatus:job.status,schema:parsed.schema_version,filledReadings:readings.filter(r=>r.value!==null).length,accuracyEvaluated:false}));
  }
});
test('real authenticated checkpoint rejects blank image as unverifiable', async ({ request }) => {
  test.skip(process.env.RUN_REAL_GEMINI !== '1', 'Opt-in suite: uniform frame guard uses no provider call.');
  test.setTimeout(75000);
  const origin = 'http://127.0.0.1:3109';
  const auth = await request.post('/api/v1/auth/dev', { headers: { Origin: origin }, data: {} }); expect(auth.status()).toBe(200);
  const session = (await (await request.get('/api/v1/session')).json()).data; expect(session.aiConfigured).toBe(true);
  const bytes = await sharp({ create: { width: 320, height: 240, channels: 3, background: 'white' } }).jpeg().toBuffer();
  const response = await request.post('/api/v1/live-packing/check', { headers: { Origin: origin, 'x-csrf-token': session.csrf }, data: { sop_id:'SUCCULENT-POTTED-ES', shipping_form:'POTTED', context:{species:'Echeveria thử nghiệm',shop_scope_confirmed:true,pot_cm:null,height_cm:null,packed_kg:null}, step_id: 'ESP-03', sop_version: '2026.10-trial.1', approved_for_trial: true, consent: true, image: 'data:image/jpeg;base64,' + bytes.toString('base64') }, timeout: 50000 });
  const json = await response.json();
  console.log(JSON.stringify({ checkpointHttpStatus: response.status(), code: json.error?.code || null, step_id: json.data?.step_id || null, status: json.data?.status || null, manual_check_required: json.data?.manual_check_required ?? null }));
  expect(response.status()).toBe(200); expect(json.data).toMatchObject({ step_id: 'ESP-03', status: 'unverifiable', manual_check_required: true }); expect(typeof json.data.observed).toBe('string'); expect(typeof json.data.reason).toBe('string');
});
test('real checkpoint accepts the current provider schema for a nonblank illustration',async({request})=>{
  test.skip(process.env.RUN_REAL_GEMINI!=='1','Opt in: one real checkpoint call, no accuracy assertion.');test.setTimeout(75000);
  const origin='http://127.0.0.1:3109';expect((await request.post('/api/v1/auth/dev',{headers:{Origin:origin},data:{}})).status()).toBe(200);
  const session=(await (await request.get('/api/v1/session')).json()).data,sop=selectSop('potted','POTTED'),step=sop.steps[1],bytes=await sharp(readFileSync('apps/web/public/photos/step-2-v2.webp')).resize(640).jpeg().toBuffer();
  const response=await request.post('/api/v1/live-packing/check',{headers:{Origin:origin,'x-csrf-token':session.csrf},data:{sop_id:sop.id,shipping_form:sop.shipping_form,context:{species:'Cây lá minh họa, không là kiện thật',shop_scope_confirmed:true,pot_cm:null,height_cm:null,packed_kg:null},step_id:step.id,sop_version:sop.version,approved_for_trial:true,consent:true,image:'data:image/jpeg;base64,'+bytes.toString('base64')},timeout:50000});expect(response.status()).toBe(200);
  const result=validateResult((await response.json()).data,step);expect(result.manual_check_required).toBe(true);console.log(JSON.stringify({nonblankCheckpointHttp:response.status(),schemaValid:true,status:result.status,accuracyEvaluated:false}));
});
test('real RAG answers with the pinned knowledge schema and source context',async({request})=>{
  test.skip(process.env.RUN_REAL_GEMINI!=='1','Opt in: one real RAG call.');test.setTimeout(120000);
  const origin='http://127.0.0.1:3109';expect((await request.post('/api/v1/auth/dev',{headers:{Origin:origin},data:{}})).status()).toBe(200);const session=(await (await request.get('/api/v1/session')).json()).data,headers={Origin:origin,'x-csrf-token':session.csrf};
  const consent=(await (await request.post('/api/v1/consents',{headers,data:{purpose:'AI_KNOWLEDGE',accepted:true}})).json()).data;
  const start=await request.post('/api/v1/knowledge/answers',{headers:{...headers,'Idempotency-Key':crypto.randomUUID()},data:{question:'Cách cố định chậu trong hộp và tránh đất tràn?',scope:'POTTED_PLANTS',consent_id:consent.id}});expect(start.status()).toBe(202);const {job_id:id}=(await start.json()).data;
  let job:any;for(let i=0;i<100;i++){job=(await (await request.get('/api/v1/jobs/'+id)).json()).data;if(['SUCCEEDED','FAILED'].includes(job.status))break;await new Promise(r=>setTimeout(r,800));}expect(job.status).toBe('SUCCEEDED');expect(job.result.mode).toBe('RAG_WITH_GEMINI');expect(job.result.sources.length).toBeGreaterThan(0);console.log(JSON.stringify({ragJobStatus:job.status,pinnedKnowledge:job.result.knowledgeVersion,sources:job.result.sources.length}));
});
