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

for(const [alternative,count] of [['PA1',6],['PA2',8]] as const)test(`Phu quy sample upload fills the requested profile and opens ${alternative} with HIGH fragility`,async({page})=>{
  test.setTimeout(90000);const a=await actor();await page.context().addCookies((await a.client.storageState()).cookies);await page.setViewportSize(alternative==='PA1'?{width:1440,height:1000}:{width:390,height:844});
  // Sample matching works without Gemini and never calls the actual recognition provider.
  let analysisCalls=0;await page.route('**/api/v1/session',async route=>{const r=await route.fetch(),j=await r.json();j.data.aiConfigured=false;await route.fulfill({response:r,json:j});});await page.route('**/api/v1/cases/*/plant-analysis',async route=>{analysisCalls++;await route.abort();});
  await page.goto('/app/new');await page.getByPlaceholder('Ví dụ: Trầu bà gửi Đà Nẵng').fill('Phú quý '+alternative);await page.getByRole('button',{name:'Tạo hồ sơ',exact:true}).click();await expect(page).toHaveURL(/\/plant$/);
  await page.getByLabel('Cho phép lưu ảnh cây và gửi AI nhận diện').check();await page.getByLabel('Tải ảnh cây',{exact:true}).setInputFiles(path.resolve('tests/fixtures/cayphuquy-demo.jpg'));
  await expect(page.getByRole('heading',{name:'Các thông số mẫu',exact:true})).toBeVisible();await expect(page.getByLabel('Tên cây',{exact:true})).toHaveValue('Cây phú quý lá đỏ');await expect(page.getByLabel('Nhóm cây',{exact:true})).toHaveValue('FOLIAGE');
  for(const [label,value] of [['Chiều cao tổng (cm)','50'],['Dài tán (cm)','40'],['Rộng tán (cm)','40'],['Đường kính chậu (cm)','20'],['Cao chậu (cm)','25'],['Cả cây + chậu + đất (kg)','5']])await expect(page.getByLabel(label,{exact:true})).toHaveValue(value);
  await expect(page.getByLabel('Độ dễ hư hỏng',{exact:true})).toHaveValue('HIGH');await expect(page.getByLabel('Vật liệu chậu',{exact:true})).toHaveValue('Gốm / sứ');await expect(page.locator('.field-evidence')).toHaveCount(0);await expect(page.locator('main')).not.toContainText('Cần nhập tay');expect(analysisCalls).toBe(0);
  const next=page.getByRole('button',{name:'Xác nhận & nhập hành trình'});await expect(next).toBeDisabled();await page.screenshot({path:`output/qa/phu-quy-${alternative.toLowerCase()}-profile.png`,fullPage:true});await page.getByLabel('Tôi xác nhận thông số cây và chậu đã chính xác').check();await next.click();
  await page.getByLabel('Nơi đi',{exact:false}).fill('Hà Nội');await page.getByLabel('Nơi đến',{exact:false}).fill('Bắc Ninh');await page.getByLabel('Kênh bán',{exact:false}).selectOption('DIRECT');await page.getByLabel('Ngày giờ gửi',{exact:false}).fill(new Date(Date.now()+86400000).toISOString().slice(0,16));await page.getByRole('button',{name:'Ước tính hành trình'}).click();await page.getByLabel('Tôi xác nhận hành trình và các ước tính').check();await page.getByRole('button',{name:'Xem hai phương án'}).click();await expect(page.locator('.mvp-alternative')).toHaveCount(2);await page.getByRole('button',{name:'Chọn '+alternative,exact:true}).click();await expect(page.locator('.sample-instruction')).toHaveCount(count);
  const caseId=page.url().split('/cases/')[1].split('/')[0],saved=await data(await a.client.get('/api/v1/cases/'+caseId));expect(saved.input.plant).toMatchObject({height:50,length:40,width:40,potDiameter:20,potHeight:25,weight:5,fragility:'HIGH',confirmed:true});expect(saved.input.plant.fieldEvidence.weight).toMatchObject({source:'DEMO',confidence:null});
  await page.getByRole('button',{name:'Hướng dẫn thủ công',exact:true}).click();await page.getByLabel('Đọc hướng dẫn bằng tiếng Việt').uncheck();await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();await expect(page.locator('.guide-step-reference img')).toHaveAttribute('src',`/photos/packing-demo/v1/${alternative.toLowerCase()}/step-1.webp`);expect(analysisCalls).toBe(0);await a.client.dispose();
});

test('sample matching is owner/case scoped and ignores unrelated images',async()=>{
  const a=await actor(),b=await actor(),c=await ready(a),other=await ready(a),root=`cases/${c.id}`;
  const blank=await sharp({create:{width:400,height:400,channels:3,background:'white'}}).jpeg().toBuffer();
  const u=await data(await a.client.post('/api/v1/uploads',{headers:{'x-csrf-token':a.session.csrf},multipart:{file:{name:'cayphuquy.jpg',mimeType:'image/jpeg',buffer:blank},case_id:c.id,purpose:'PLANT',storage_consent:'true'}}));
  expect(await data(await call(a,root+'/plant-demo',{upload_id:u.id}))).toEqual({sampleId:null});expect((await call(b,root+'/plant-demo',{upload_id:u.id})).status()).toBe(404);expect((await call(a,`cases/${other.id}/plant-demo`,{upload_id:u.id})).status()).toBe(404);
  expect((await a.client.post('/api/v1/'+root+'/plant-demo',{data:{upload_id:u.id}})).status()).toBe(403);await a.client.dispose();await b.client.dispose();
});

for(const [alternative,count] of [['PA1',6],['PA2',8]] as const)test(`photo demo ${alternative}: gallery, pinned AI references, confirmations and postcheck`,async({page})=>{
  test.setTimeout(90000);const a=await actor(),c=await ready(a),root=`cases/${c.id}`;
  // UI creation uses demo explicitly; existing API calls continue to use normal eligibility.
  await page.context().addCookies((await a.client.storageState()).cookies);
  await page.setViewportSize(alternative==='PA1'?{width:1440,height:1000}:{width:390,height:844});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`/app/cases/${c.id}/options`);
  await expect(page.getByText('Demo theo ảnh mẫu · PA1: 6 bước · PA2: 8 bước.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Chọn '+alternative,exact:true}).click();
  await expect(page.locator('.sample-instruction')).toHaveCount(count);
  expect(await page.locator('.sample-instruction img').evaluateAll(imgs=>imgs.every(i=>getComputedStyle(i).objectFit==='contain'))).toBe(true);
  await expect.poll(()=>page.locator('.sample-instruction img').evaluateAll(imgs=>imgs.every(i=>(i as HTMLImageElement).naturalWidth===941))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`output/qa/demo-${alternative.toLowerCase()}-gallery.png`,fullPage:true});
  const state=await data(await a.client.get('/api/v1/'+root+'/mvp')),bundle=state.bundles.find((b:any)=>b.id===state.selection.bundleId);expect(bundle.demo).toBe(true);
  await page.getByRole('button',{name:'Hướng dẫn thủ công',exact:true}).click();
  await page.getByLabel('Đọc hướng dẫn bằng tiếng Việt').uncheck();
  await page.getByRole('button',{name:'Bắt đầu',exact:true}).click();
  expect((await call(a,root+'/mvp/proposals',{case_version:c.version,demo:true},'post',randomUUID())).status()).toBe(409);
  const selected=bundle.alternatives.find((x:any)=>x.id===alternative);
  for(const [i,s] of selected.steps.entries()){
    await expect(page.locator('.live-step h2')).toHaveText(s.title);
    await expect(page.locator('.guide-step-reference img')).toHaveAttribute('src',s.image);
    await expect.poll(()=>page.locator('.guide-step-reference img').evaluate(i=>(i as HTMLImageElement).naturalHeight)).toBe(1672);
    if(i===0){await page.screenshot({path:`output/qa/demo-${alternative.toLowerCase()}-guide.png`,fullPage:true});await page.getByRole('button',{name:'Đã xong bước này',exact:true}).click();await expect(page.locator('.live-step h2')).toHaveText(s.title);}
    const manual=page.getByRole('button',{name:'Dùng kiểm tay & tiếp tục',exact:true});if(!await manual.isVisible())await page.getByText('Xác nhận thủ công',{exact:true}).click();
    await page.getByLabel('Tôi đã kiểm tra trực tiếp',{exact:true}).check();await page.getByLabel('Lý do / ghi nhận').fill('Đã đối chiếu ảnh mẫu và kiểm trực tiếp bước đang thực hiện.');await manual.click();
  }
  const guides=await data(await a.client.get('/api/v1/'+root+'/guidance')),g=guides.find((g:any)=>g.bundleId===bundle.id);expect(g.status).toBe('FINISHED');expect(g.confidenceThreshold).toBe(bundle.confidenceThreshold);expect(g.boundSop.steps.every((s:any)=>s.reference_image?.path===s.image)).toBe(true);
  await page.getByRole('link',{name:'Hậu kiểm kiện',exact:true}).click();const checks=page.getByLabel('Tôi đã kiểm trực tiếp và xác nhận đạt',{exact:true});await expect(checks).toHaveCount(7);for(let i=0;i<7;i++)await checks.nth(i).check();await page.getByRole('button',{name:'Lưu hồ sơ đã đóng gói'}).click();await expect(page.getByRole('heading',{name:'Đã đóng gói chắc chắn'})).toBeVisible();expect(errors).toEqual([]);await a.client.dispose();
});

test('old catalog results can switch to a new photo demo without rewriting the original bundle',async({page})=>{
  const a=await actor(),c=await ready(a),root=`cases/${c.id}`,old=await data(await call(a,root+'/mvp/proposals',{case_version:c.version},'post',randomUUID()));await data(await call(a,root+'/mvp/selection',{bundle_id:old.id,alternative_id:'PA1',expected_revision:0}));await page.context().addCookies((await a.client.storageState()).cookies);await page.goto(`/app/cases/${c.id}/options`);await page.getByRole('button',{name:'Dùng ảnh mẫu PA1/PA2',exact:true}).click();await expect(page.getByText('Demo theo ảnh mẫu · PA1: 6 bước · PA2: 8 bước.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Chọn PA2',exact:true}).click();await expect(page.locator('.sample-instruction')).toHaveCount(8);const state=await data(await a.client.get('/api/v1/'+root+'/mvp'));expect(state.bundles.find((b:any)=>b.id===old.id).alternatives).toEqual(old.alternatives);expect(state.selection.bundleId).not.toBe(old.id);await a.client.dispose();
});

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
