import { test, expect, request, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import sharp from 'sharp';
import { defaultMvpConfig } from '../../apps/web/src/lib/mvp-config';
const origin='http://127.0.0.1:3117',password='MvpRegressionPassword-2026';
async function data(r:any){const body=await r.json();expect(r.ok(),JSON.stringify(body)).toBe(true);return body.data;}
async function actor(){const client=await request.newContext({baseURL:origin,extraHTTPHeaders:{Origin:origin}}),n=randomUUID().replaceAll('-',''),phone='+84'+parseInt(n.slice(0,10),16).toString().padStart(12,'0');const ch=await data(await client.post('/api/v1/auth/register',{data:{name:'PRD Regression',username:'mvp_'+n.slice(0,12),phone,password,terms:true}}));await data(await client.post('/api/v1/auth/otp/verify',{data:{challenge_id:ch.challenge_id,code:ch.development_code,purpose:'REGISTER'}}));const session=await data(await client.get('/api/v1/session'));return {client,session,phone};}
type Actor=Awaited<ReturnType<typeof actor>>;
function call(a:Actor,p:string,v:any,method:'post'|'patch'='post',key?:string){return a.client[method]('/api/v1/'+p,{headers:{'x-csrf-token':a.session.csrf,...(key?{'Idempotency-Key':key}:{})},data:v});}
async function ready(a:Actor){let c=await data(await call(a,'cases',{name:'PRD chuẩn',sample:true}));c.input.plant.weight=1;c.input.plant.fragility='LOW';c.input.shipment.channel='DIRECT';c.input.shipment.distanceKm=35;c.input.shipment.departure=new Date(Date.now()+86400000).toISOString();c=await data(await call(a,'cases/'+c.id,{name:c.name,input:c.input,expected_version:c.version},'patch'));return c;}
function role(a:Actor,value:string){const db=new DatabaseSync(path.join(process.env.PLANTCARE_TEST_MVP_DATA_DIR!,'plantcare.sqlite'));db.prepare('UPDATE users SET role=? WHERE id=?').run(value,a.session.user.id);db.close();}

test('mandatory journey, alternative binding, explicit start, postcheck and immutable history',async({page})=>{
  const a=await actor(),b=await actor();let c=await ready(a);const root=`cases/${c.id}`,key=randomUUID(),bundle=await data(await call(a,root+'/mvp/proposals',{case_version:c.version},'post',key));expect(bundle.alternatives.map((a:any)=>a.id)).toEqual(['PA1','PA2']);expect((await data(await call(a,root+'/mvp/proposals',{case_version:c.version},'post',key))).id).toBe(bundle.id);
  expect((await b.client.get('/api/v1/'+root+'/mvp')).status()).toBe(404);
  let selection=await data(await call(a,root+'/mvp/selection',{bundle_id:bundle.id,alternative_id:'PA1',expected_revision:0}));
  async function guide(s=selection){return data(await call(a,root+'/guidance',{case_version:c.version,mode:'MVP',bundle_id:bundle.id,alternative_id:s.alternativeId},'post',randomUUID()));}
  const old=await guide();selection=await data(await call(a,root+'/mvp/selection',{bundle_id:bundle.id,alternative_id:'PA2',expected_revision:selection.revision}));
  expect((await call(a,root+`/guidance/${old.id}/control`,{expected_revision:old.revision,action:'BEGIN'})).status()).toBe(409);
  let g=await guide();expect(g.boundSop.steps.some((s:any)=>s.id==='padding')).toBe(false);
  expect((await call(a,root+'/guidance/'+g.id,{expected_revision:g.revision,step_id:g.boundSop.steps[0].id,action:'CONFIRM',method:'VOICE',manual_checked:true},'patch')).status()).toBe(409);
  g=await data(await call(a,root+`/guidance/${g.id}/control`,{expected_revision:g.revision,action:'BEGIN'}));
  selection=(await data(await a.client.get('/api/v1/'+root+'/mvp'))).selection;
  expect((await call(a,root+'/mvp/selection',{bundle_id:bundle.id,alternative_id:'PA1',expected_revision:selection.revision})).status()).toBe(409);
  for(const s of g.boundSop.steps){if(s.mode==='visual')expect((await call(a,root+'/guidance/'+g.id,{expected_revision:g.revision,step_id:s.id,action:'CONFIRM',method:'VOICE',manual_checked:true},'patch')).status()).toBe(422);g=await data(await call(a,root+'/guidance/'+g.id,{expected_revision:g.revision,step_id:s.id,action:'MANUAL',method:'BUTTON',manual_checked:true,note:'Đã kiểm trực tiếp đúng phương án đã chọn.'},'patch'));}
  expect(g.status).toBe('FINISHED');let p=await data(await a.client.get('/api/v1/'+root+'/mvp/postcheck?guidance_id='+g.id));expect(p.items.map((i:any)=>i.id)).toEqual(['fixation','wrap','closure']);
  expect((await call(a,root+'/mvp/complete',{guidance_id:g.id,post_revision:p.revision},'post',randomUUID())).status()).toBe(422);
  const image='data:image/jpeg;base64,'+(await sharp({create:{width:200,height:200,channels:3,background:'green'}}).jpeg().toBuffer()).toString('base64');
  const check=await data(await call(a,'live-packing/check',{case_id:c.id,session_id:g.id,session_revision:g.revision,sop_id:g.sopId,sop_version:g.sopVersion,shipping_form:'POTTED',context:g.context,step_id:'postcheck',approved_for_trial:true,consent:true,post_check:true,post_revision:p.revision,image}));p=check.postcheck;expect(p.items.every((i:any)=>i.status==='unverifiable')).toBe(true);
  p=await data(await call(a,root+'/mvp/postcheck',{guidance_id:g.id,expected_revision:p.revision,items:p.items.map((i:any)=>({id:i.id,status:'passed',note:'Đã mở kiện kiểm trực tiếp bằng tay.'}))},'patch'));
  const doneKey=randomUUID(),v={guidance_id:g.id,post_revision:p.revision},done=await data(await call(a,root+'/mvp/complete',v,'post',doneKey));expect((await data(await call(a,root+'/mvp/complete',v,'post',doneKey))).completedAt).toBe(done.completedAt);expect((await data(await a.client.get('/api/v1/'+root))).status).toBe('PACKED');
  await page.context().addCookies(await a.client.storageState().then(s=>s.cookies));await page.goto(`/app/cases/${c.id}/options`);await expect(page.getByRole('heading',{name:'Đã đóng gói chắc chắn'})).toBeVisible();await page.screenshot({path:'output/qa/prd-history-desktop.png',fullPage:true});
  const clone=await data(await call(a,root+'/mvp/clone',{}));expect(clone.input.plant.confirmed).toBe(false);expect(clone.input.shipment.departure).toBe('');expect((await data(await a.client.get('/api/v1/'+root+'/mvp'))).bundles.find((x:any)=>x.id===bundle.id).snapshot).toEqual(bundle.snapshot);
  await a.client.dispose();await b.client.dispose();
});
test('manual UI supports pause, offline resume, physical checks and postcheck completion without camera',async({page})=>{
  test.setTimeout(60000);const a=await actor(),c=await ready(a),root=`cases/${c.id}`,bundle=await data(await call(a,root+'/mvp/proposals',{case_version:c.version},'post',randomUUID()));await data(await call(a,root+'/mvp/selection',{bundle_id:bundle.id,alternative_id:'PA2',expected_revision:0}));const g=await data(await call(a,root+'/guidance',{case_version:c.version,mode:'MVP',bundle_id:bundle.id,alternative_id:'PA2'},'post',randomUUID()));
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.context().addCookies((await a.client.storageState()).cookies);await page.setViewportSize({width:390,height:844});await page.goto(`/app/cases/${c.id}/guide?session=${g.id}`);await page.getByLabel('Đọc hướng dẫn bằng tiếng Việt').uncheck();await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();await page.getByRole('button',{name:'Tạm dừng',exact:true}).click();await expect(page.getByRole('button',{name:'Đã xong bước này',exact:true})).toBeDisabled();await page.reload();await page.getByRole('button',{name:'Tiếp tục phiên',exact:true}).click();
  await page.context().setOffline(true);await expect(page.getByRole('alert').filter({hasText:'Mất kết nối'})).toBeVisible();await page.context().setOffline(false);await page.getByRole('button',{name:'Tiếp tục phiên',exact:true}).click();
  for(const s of g.boundSop.steps){await expect(page.locator('.live-step h2')).toHaveText(s.title);if(s.mode==='manual')await page.getByRole('button',{name:'Đã xong bước này',exact:true}).click();else{const manual=page.getByRole('button',{name:'Dùng kiểm tay & tiếp tục',exact:true});if(!await manual.isVisible())await page.getByText('Xác nhận thủ công',{exact:true}).click();await page.getByLabel('Tôi đã kiểm tra trực tiếp',{exact:true}).check();await page.getByLabel('Lý do / ghi nhận').fill('Đã kiểm thực tế theo phương án, không sử dụng camera.');await manual.click();}}
  await page.getByRole('link',{name:'Hậu kiểm kiện',exact:true}).click();const checks=page.getByLabel('Tôi đã kiểm trực tiếp và xác nhận đạt',{exact:true});await expect(checks).toHaveCount(3);await expect(page.getByRole('button',{name:'Lưu hồ sơ đã đóng gói'})).toBeDisabled();
  for(let i=0;i<3;i++){await checks.nth(i).check();await expect(checks.nth(i)).toBeEnabled();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'output/qa/prd-postcheck-mobile.png',fullPage:true});await page.getByRole('button',{name:'Lưu hồ sơ đã đóng gói'}).click();await expect(page.getByRole('heading',{name:'Đã đóng gói chắc chắn'})).toBeVisible();expect(errors).toEqual([]);await a.client.dispose();
});
test('configuration edits require independent expert approval, reauth, optimistic activation and preserve history',async()=>{
  const admin=await actor(),expert=await actor(),member=await actor();role(admin,'ADMIN');role(expert,'EXPERT');const {version,status,author,createdAt,effectiveAt,reason,expertReview,...content}=defaultMvpConfig;void status;void author;void createdAt;void effectiveAt;void reason;void expertReview;
  expect((await call(member,'admin/mvp/draft',{base_version:version,reason:'Thử quyền thành viên trái phép',content})).status()).toBe(403);
  const draft=await data(await call(admin,'admin/mvp/draft',{base_version:version,reason:'Kiểm thử vòng đời cấu hình có duyệt',content}));expect((await data(await admin.client.get('/api/v1/mvp/config'))).version).toBe(version);
  expect((await call(admin,'admin/mvp/review',{version:draft.version,note:'Quản trị không được tự duyệt chuyên môn'})).status()).toBe(403);
  expect((await call(admin,'admin/mvp/activate',{version:draft.version,expected_active:version,password})).status()).toBe(422);
  const approved=await data(await call(expert,'admin/mvp/review',{version:draft.version,note:'Chỉ fixture kiểm thử chức năng, không phải duyệt chuyên môn thật.'}));
  expect((await call(admin,'admin/mvp/activate',{version:approved.version,expected_active:version,password:'incorrect'})).status()).toBe(401);
  await data(await call(admin,'admin/mvp/activate',{version:approved.version,expected_active:version,password}));expect((await call(admin,'admin/mvp/activate',{version:approved.version,expected_active:version,password})).status()).toBe(409);
  expect((await data(await admin.client.get('/api/v1/admin/mvp'))).configs.find((x:any)=>x.version===draft.version).status).toBe('DRAFT');await admin.client.dispose();await expert.client.dispose();await member.client.dispose();
});
test('OTP login is purpose-specific and wrong attempts lock further sends for 15 minutes',async()=>{
  const a=await actor();const ch=await data(await a.client.post('/api/v1/auth/otp/request',{data:{phone:a.phone}}));expect((await a.client.post('/api/v1/auth/otp/verify',{data:{challenge_id:ch.challenge_id,purpose:'REGISTER',code:ch.development_code}})).status()).toBe(422);await data(await a.client.post('/api/v1/auth/otp/verify',{data:{challenge_id:ch.challenge_id,purpose:'LOGIN',code:ch.development_code}}));
  const b=await actor(),bad=await data(await b.client.post('/api/v1/auth/otp/request',{data:{phone:b.phone}}));for(let i=0;i<5;i++)expect((await b.client.post('/api/v1/auth/otp/verify',{data:{challenge_id:bad.challenge_id,purpose:'LOGIN',code:bad.development_code==='111111'?'222222':'111111'}})).status()).toBe(422);expect((await b.client.post('/api/v1/auth/otp/request',{data:{phone:b.phone}})).status()).toBe(429);await a.client.dispose();await b.client.dispose();
});
