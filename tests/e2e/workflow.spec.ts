import { test, expect, request, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import type { CaseRecord, PlanVersion } from '../../packages/domain/src/index';

const origin='http://127.0.0.1:3001';
type Actor={client:APIRequestContext;csrf:string;phone:string;username:string;password:string;challenge:any};
async function actor():Promise<Actor>{
  const client=await request.newContext({baseURL:origin,extraHTTPHeaders:{Origin:origin}}),username='qa_'+randomUUID().replaceAll('-','').slice(0,12),phone='+84'+String(Date.now()).slice(-8)+Math.floor(Math.random()*1000).toString().padStart(3,'0'),password='LocalTestPassword-2026';
  const registered=await client.post('/api/v1/auth/register',{data:{username,phone,password,name:'Kiểm thử local',terms:true}});
  expect(registered.status()).toBe(202);const challenge=(await registered.json()).data;
  const verified=await client.post('/api/v1/auth/otp/verify',{data:{challenge_id:challenge.challenge_id,code:challenge.development_code,purpose:'REGISTER'}});expect(verified.status()).toBe(200);
  const session=(await(await client.get('/api/v1/session')).json()).data;
  return {client,csrf:session.csrf,phone,username,password,challenge};
}
async function mutate(a:Actor,path:string,data:unknown={},method:'post'|'patch'|'delete'='post',key?:string){return a.client[method]('/api/v1/'+path,{data,headers:{'x-csrf-token':a.csrf,...(key?{'Idempotency-Key':key}:{})}});}
async function value<T=any>(response:any):Promise<T>{expect(response.ok(),JSON.stringify(await response.json())).toBe(true);return (await response.json()).data;}
async function create(a:Actor){return value<CaseRecord>(await mutate(a,'cases',{name:'Hồ sơ kiểm thử',sample:true}));}
async function generate(a:Actor,c:CaseRecord){
  const key=randomUUID(),path=`cases/${c.id}/plans`,body={input_version:c.version,use_ai_images:false};
  const job=await value(await mutate(a,path,body,'post',key));
  expect((await value(await mutate(a,path,body,'post',key))).job_id).toBe(job.job_id);
  let result:any;await expect.poll(async()=>{result=await value(await a.client.get('/api/v1/jobs/'+job.job_id));return result.status;},{timeout:15000}).toBe('SUCCEEDED');
  return result.result as PlanVersion;
}
async function select(a:Actor,c:CaseRecord,v:PlanVersion){return mutate(a,`cases/${c.id}/selection`,{version_id:v.id,acknowledgments:v.plan.warnings.map(w=>w.code)});}
async function checks(a:Actor,c:CaseRecord,v:PlanVersion){return mutate(a,`cases/${c.id}/checklist`,{version_id:v.id,checked:v.plan.steps.map(s=>s.id)},'patch');}
function actual(v:PlanVersion){return {version_id:v.id,actual_weight:v.plan.package.weight!,actual_length:v.plan.package.length!,actual_width:v.plan.package.width!,actual_height:v.plan.package.height!};}

test('OTP is one time; owner, CSRF, role and reset revoke sessions',async()=>{
  const a=await actor(),b=await actor();const c=await create(a);
  expect((await b.client.get('/api/v1/cases/'+c.id)).status()).toBe(404);
  expect((await a.client.post('/api/v1/cases',{data:{name:'Không có CSRF'}})).status()).toBe(403);
  expect((await a.client.get('/api/v1/admin/rules')).status()).toBe(403);
  expect((await mutate(a,'me',{name:'Vai trò giả',role:'ADMIN'},'patch')).status()).toBe(422);
  expect((await a.client.post('/api/v1/auth/otp/verify',{data:{challenge_id:a.challenge.challenge_id,code:a.challenge.development_code,purpose:'REGISTER'}})).status()).toBe(422);
  const reset=await value(await a.client.post('/api/v1/auth/password/reset/request',{data:{phone:a.phone}}));
  expect((await a.client.post('/api/v1/auth/password/reset/confirm',{data:{challenge_id:reset.challenge_id,code:reset.development_code,new_password:'ChangedLocalPassword-2026'}})).status()).toBe(200);
  expect((await a.client.get('/api/v1/cases')).status()).toBe(401);
  await a.client.dispose();await b.client.dispose();
});

test('FAIL, missing load and STALE plans cannot be selected or completed',async()=>{
  const a=await actor();let c=await create(a);c.input.materials[0].length=20;
  c=await value(await mutate(a,`cases/${c.id}`,{name:c.name,input:c.input,expected_version:c.version},'patch'));
  let v=await generate(a,c);expect(v.plan.outcome).toBe('FAIL');expect((await select(a,c,v)).status()).toBe(422);
  c.input.materials[0].length=40;c.input.materials[0].maxLoad=null;
  c=await value(await mutate(a,`cases/${c.id}`,{name:c.name,input:c.input,expected_version:c.version},'patch'));
  v=await generate(a,c);expect(v.plan.outcome).toBe('NEEDS_INPUT');expect((await select(a,c,v)).status()).toBe(422);
  c.input.materials[0].maxLoad=10;c=await value(await mutate(a,`cases/${c.id}`,{name:c.name,input:c.input,expected_version:c.version},'patch'));v=await generate(a,c);
  expect((await select(a,c,v)).status()).toBe(200);expect((await checks(a,c,v)).status()).toBe(200);
  const staleRequest={name:c.name,input:{...c.input,plant:{...c.input.plant,height:56}},expected_version:c.version};
  expect((await mutate(a,`cases/${c.id}`,staleRequest,'patch')).status()).toBe(200);
  expect((await mutate(a,`cases/${c.id}`,staleRequest,'patch')).status()).toBe(409);
  expect((await select(a,c,v)).status()).toBe(409);
  expect((await mutate(a,`cases/${c.id}/complete`,actual(v),'post',randomUUID())).status()).toBe(409);
  const versions=await value<PlanVersion[]>(await a.client.get(`/api/v1/cases/${c.id}/versions`));expect(versions.every(v=>v.stale)).toBe(true);
  await a.client.dispose();
});

test('completion is atomic, checklist-bound and idempotent; only selected materials deducted',async()=>{
  const a=await actor();let c=await create(a);
  const inventory:any[]=[];
  for(const material of c.input.materials)inventory.push(await value(await mutate(a,'materials',{material,stock:2})));
  c.input.materials=c.input.materials.map((m,i)=>({...m,inventoryId:inventory[i].id}));
  c.input.materials.push({...c.input.materials[1],id:'unused-extra',quantity:50,inventoryId:inventory[1].id,confirmed:false});
  c=await value(await mutate(a,`cases/${c.id}`,{name:c.name,input:c.input,expected_version:c.version},'patch'));const v=await generate(a,c);expect(v.plan.usedMaterialIds).not.toContain('unused-extra');
  expect((await select(a,c,v)).status()).toBe(200);
  expect((await mutate(a,`cases/${c.id}/complete`,actual(v),'post',randomUUID())).status()).toBe(422);
  await checks(a,c,v);
  const last=inventory.at(-1);await mutate(a,'materials/'+last.id,{material:last,stock:0,expected_version:1},'patch');
  expect((await mutate(a,`cases/${c.id}/complete`,actual(v),'post',randomUUID())).status()).toBe(409);
  let stock=await value<any[]>(await a.client.get('/api/v1/materials'));expect(stock.find(m=>m.id===inventory[0].id).stock).toBe(2);
  await mutate(a,'materials/'+last.id,{material:last,stock:2,expected_version:2},'patch');
  const key=randomUUID(),path=`cases/${c.id}/complete`;
  const [first,second]=await Promise.all([mutate(a,path,actual(v),'post',key),mutate(a,path,actual(v),'post',key)]);
  const completion=await value(first);expect((await value(second)).id).toBe(completion.id);
  expect((await value(await mutate(a,path,actual(v),'post',randomUUID()))).id).toBe(completion.id);
  stock=await value(await a.client.get('/api/v1/materials'));expect(stock.every(m=>m.stock===1)).toBe(true);
  expect((await mutate(a,path,{...actual(v),actual_weight:5},'post',key)).status()).toBe(409);
  expect((await value(await a.client.get('/api/v1/cases/'+c.id))).status).toBe('PACKED');
  expect((await select(a,c,v)).status()).toBe(409);
  expect((await mutate(a,`cases/${c.id}`,{name:c.name,input:c.input,expected_version:c.version},'patch')).status()).toBe(409);
  expect((await mutate(a,`cases/${c.id}/plans`,{input_version:c.version},'post',randomUUID())).status()).toBe(409);
  await a.client.dispose();
});

test('pinned share revocation, private photo, sanitized template and actual PDF export',async()=>{
  test.setTimeout(60000);const a=await actor(),b=await actor();const c=await create(a),v=await generate(a,c);
  const share=await value(await mutate(a,`cases/${c.id}/shares`,{version_id:v.id,days:1}));
  const shared=await value(await b.client.get('/api/v1'+share.url));expect(shared.id).toBe(v.id);expect(shared.snapshot).toBeUndefined();expect(JSON.stringify(shared)).not.toContain(a.phone);
  await mutate(a,'shares/'+share.id,{},'delete');expect((await b.client.get('/api/v1'+share.url)).status()).toBe(404);
  const template=await value(await mutate(a,'templates',{case_id:c.id,name:'Mẫu test'}));
  const clone=await value(await mutate(a,'templates/'+template.id+'/clone'));expect(clone.input.plant.confirmed).toBe(false);expect(clone.input.shipment.departure).toBe('');expect(clone.input.materials.every((m:any)=>!m.confirmed)).toBe(true);
  const png=await sharp({create:{width:10,height:10,channels:3,background:'#146445'}}).png().toBuffer();
  const upload=await a.client.post('/api/v1/uploads',{headers:{'x-csrf-token':a.csrf},multipart:{case_id:c.id,purpose:'PLANT',file:{name:'private.png',mimeType:'image/png',buffer:png}}});
  const u=await value(upload);expect((await a.client.get('/api/v1/uploads/'+u.id)).status()).toBe(200);expect((await b.client.get('/api/v1/uploads/'+u.id)).status()).toBe(404);
  const malformed=await a.client.post('/api/v1/uploads',{headers:{'x-csrf-token':a.csrf},multipart:{case_id:c.id,purpose:'PLANT',file:{name:'fake.png',mimeType:'image/png',buffer:Buffer.from('<svg><script/></svg>')}}});expect(malformed.status()).toBe(422);
  const exported=await value(await mutate(a,`cases/${c.id}/exports`,{version_id:v.id},'post',randomUUID()));let job:any;
  await expect.poll(async()=>{job=await value(await a.client.get('/api/v1/jobs/'+exported.job_id));return job.status;},{timeout:30000}).toBe('SUCCEEDED');
  const pdf=await a.client.get('/api/v1/exports/'+exported.job_id);expect(pdf.status()).toBe(200);const bytes=await pdf.body();expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  mkdirSync('output/qa',{recursive:true});writeFileSync('output/qa/export.pdf',bytes);expect((await b.client.get('/api/v1/exports/'+exported.job_id)).status()).toBe(404);
  await a.client.dispose();await b.client.dispose();
});

test('responsive UI: landing, dashboard, wizard and plan walkthrough',async({page})=>{
  test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));mkdirSync('output/qa',{recursive:true});
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');await expect(page.getByRole('heading',{name:/Gửi một chút xanh/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Khám phá bản thử nghiệm local/})).toBeVisible();await page.screenshot({path:'output/qa/landing-desktop.png',fullPage:true});
  await page.getByRole('button',{name:/Khám phá bản thử nghiệm local/}).click();await expect(page).toHaveURL(/\/app$/);await expect(page.getByRole('heading',{name:'Hôm nay, bạn gửi cây gì?'})).toBeVisible();
  await page.screenshot({path:'output/qa/dashboard-desktop.png',fullPage:true});
  await page.goto('/app/new');await page.getByPlaceholder('Ví dụ: Trầu bà gửi Đà Nẵng').fill('Hồ sơ UI test');await page.getByRole('button',{name:/Hoặc tạo hồ sơ mẫu/}).click();await expect(page).toHaveURL(/\/plant$/);
  const caseId=new URL(page.url()).pathname.split('/')[3];
  await page.screenshot({path:'output/qa/wizard-desktop.png',fullPage:true});
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'Lưu & tiếp tục'}).click();
  await page.getByRole('button',{name:'Tạo hướng dẫn',exact:true}).click();await expect(page).toHaveURL(/\/plans\?version=/,{timeout:20000});
  await expect(page.getByText('Cần xác nhận cảnh báo',{exact:true}).first()).toBeVisible();await page.screenshot({path:'output/qa/plan-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await expect.poll(async()=>{const b=await page.locator('.sidebar').boundingBox();return b?b.x+b.width:0;}).toBeLessThanOrEqual(0);await page.screenshot({path:'output/qa/plan-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.locator('.warning-item input[type=checkbox]').first().check();await page.locator('.warning-item input[type=checkbox]').last().check();
  await page.getByRole('button',{name:'Bắt đầu checklist'}).click();await expect(page).toHaveURL(/\/checklist\?/);
  await expect(page.locator('.checklist-row input')).toHaveCount(6);
  for(const checkbox of await page.locator('.checklist-row input').all()){await expect(checkbox).toBeEnabled();await checkbox.click();await expect(checkbox).toBeChecked();}
  await page.getByRole('button',{name:'Xác nhận hoàn tất'}).click();
  await page.getByLabel('Khối lượng kiện (kg)').fill('4,1');await page.getByLabel('Dài kiện (cm)').fill('34');await page.getByLabel('Rộng kiện (cm)').fill('34');await page.getByLabel('Cao kiện (cm)').fill('59');
  await page.getByRole('dialog').getByRole('button',{name:'Xác nhận hoàn tất'}).click();await expect(page.getByText('Đã đóng gói',{exact:true})).toBeVisible();
  await page.goto('/app');await expect(page.locator('.stat-card strong').first()).not.toHaveText('—');await page.screenshot({path:'output/qa/dashboard-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  const session=(await(await page.request.get('/api/v1/session')).json()).data;
  await page.request.delete('/api/v1/cases/'+caseId,{headers:{Origin:origin,'x-csrf-token':session.csrf}});
});
