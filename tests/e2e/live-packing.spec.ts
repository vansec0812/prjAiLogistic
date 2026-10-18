import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: 'ignoreErrors' }); });
async function beginTrial(page: Page) {
  await page.getByLabel('Loài/giống đã xác nhận').fill('Echeveria shop xác nhận');
  await page.getByLabel('Tôi đại diện shop', {exact:false}).check();
  await page.getByLabel('Tôi đã xem và duyệt checklist', {exact:false}).check();
}
async function manualNext(page: Page) {
  const panel=page.locator('section.live-controls').last();
  await panel.getByRole('checkbox').check();
  await panel.getByRole('button',{name:'Dùng xác nhận thủ công',exact:true}).click();
  await panel.getByRole('button',{name:'Bước tiếp',exact:true}).click();
}
async function reachVisual(page: Page) { await manualNext(page); await manualNext(page); }

async function configuredSession(page: Page) {
  const auth = await page.request.post('http://127.0.0.1:3107/api/v1/auth/dev', { headers: { Origin: 'http://127.0.0.1:3107' }, data: {} }); expect(auth.status()).toBe(200);
  const json = await (await page.request.get('http://127.0.0.1:3107/api/v1/session')).json(); json.data.aiConfigured = true;
  await page.route('**/api/v1/session', route => route.fulfill({ json }));
}

test('checklist confirmation prompts in Vietnamese then auto-inspects camera, retries and stops', async ({ page }) => {
  const spoken: string[] = [];
  await page.exposeFunction('recordSpeech', (text: string) => spoken.push(text));
  await page.exposeFunction('recordVoice', (value: {lang: string; voiceLang: string}) => { expect(value.lang).toBe('vi-VN'); expect(value.voiceLang).toBe('vi-VN'); });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { text: string; lang = ''; voice: {lang: string} | null = null; onend: (() => void) | null = null; onerror: (() => void) | null = null; constructor(text: string) { this.text = text; } } });
    Object.defineProperty(window, 'speechSynthesis', { value: Object.assign(new EventTarget(), {
      getVoices: () => [{name: 'English default', lang: 'en-US', default: true}, {name: 'Giọng Việt kiểm thử', lang: 'vi-VN', localService: true}],
      speak: (u: SpeechSynthesisUtterance) => { const target = window as unknown as {recordSpeech:(text:string)=>void; recordVoice:(value:{lang:string;voiceLang:string})=>void}; target.recordSpeech(u.text); target.recordVoice({lang:u.lang,voiceLang:u.voice?.lang || ''}); setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 10); }, resume: () => {}, cancel: () => {}
    }) });
  });
  await page.context().grantPermissions(['camera']);
  await configuredSession(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá bản thử nghiệm local/ }).click();
  await page.goto('/app/live-packing');
  await beginTrial(page);
  await page.getByRole('button', { name: 'Nghe lại', exact: true }).click();
  await expect.poll(() => spoken.length).toBeGreaterThan(0); await reachVisual(page);
  const speechBefore = spoken.length; await page.getByRole('button', { name: 'Nghe lại', exact: true }).click(); await expect.poll(() => spoken.length).toBeGreaterThan(speechBefore);
  await page.getByRole('button', { name: 'Mở camera', exact: true }).click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
  const track = await page.locator('video').evaluateHandle(v => ((v as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0]);
  expect(await track.evaluate(t => t.readyState)).toBe('live');
  expect(await page.locator('video').evaluate(v => ((v as HTMLVideoElement).srcObject as MediaStream).getAudioTracks().length)).toBe(0);
  let calls = 0;
  await page.route('**/api/v1/live-packing/check', async route => {
    calls++; const data = route.request().postDataJSON();
    expect(data.step_id).toBe('ESP-03'); expect(data.sop_id).toBe('SUCCULENT-POTTED-ES'); expect(data.shipping_form).toBe('POTTED'); expect(data.consent).toBe(true); expect(data.image).toMatch(/^data:image\/jpeg;base64,/);
    const image = await sharp(Buffer.from(data.image.split(',')[1], 'base64')).metadata(); expect(Math.max(image.width!, image.height!)).toBeLessThanOrEqual(1280);
    await route.fulfill({ json: { data: { step_id: 'ESP-03', observed: 'Ảnh từ camera kiểm thử.', status: 'passed', reason: 'Phản hồi giả lập, không chứng minh chất lượng AI.', manual_check_required: true, criterion_results: [{criterion_id:'ESP-03-C1',status:'passed',observation:'Giả lập thấy màng phủ.'}] } } });
  });
  expect(calls).toBe(0);
  await expect(page.getByRole('button', { name: 'Đã làm xong bước này — nhờ AI kiểm tra', exact: true })).toBeDisabled();
  await page.getByLabel('Đồng ý để AI lấy khung hình', { exact: false }).check();
  await page.getByRole('button', { name: 'Đã làm xong bước này — nhờ AI kiểm tra', exact: true }).click();
  await expect(page.getByText('Tự kiểm tra sau 3 giây')).toBeVisible(); expect(calls).toBe(0);
  await expect.poll(() => spoken.some(text => text.startsWith('Đưa sản phẩm trước camera'))).toBe(true);
  await expect(page.getByRole('heading', { name: 'Đạt tiêu chí nhìn thấy' })).toBeVisible({timeout:10000}); expect(calls).toBe(1);
  await expect.poll(() => spoken.some(text => text.includes('Phản hồi giả lập'))).toBe(true);
  await expect(page.getByRole('button', { name: 'Bước tiếp', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Yêu cầu AI kiểm tra lại', exact: true }).click();
  await expect.poll(() => calls, {timeout:10000}).toBe(2);
  await expect(page.getByRole('heading', { name: 'Đạt tiêu chí nhìn thấy' })).toBeVisible();
  await page.locator('section.live-controls').last().getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kiểm lớp bảo vệ' })).toBeVisible(); expect(calls).toBe(2);
  await page.getByRole('button', { name: 'Tắt camera', exact: true }).click(); expect(await track.evaluate(t => t.readyState)).toBe('ended');
  await page.getByRole('button', { name: 'Mở camera', exact: true }).click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).srcObject !== null)).toBe(true);
  const nextTrack = await page.locator('video').evaluateHandle(v => ((v as HTMLVideoElement).srcObject as MediaStream).getVideoTracks()[0]);
  await page.getByRole('link', { name: 'Tổng quan', exact: true }).click(); await expect(page).toHaveURL('http://127.0.0.1:3107/app'); await expect.poll(() => nextTrack.evaluate(t => t.readyState)).toBe('ended');
});

test('provider unavailable never passes checkpoint; manual fallback remains available', async ({ page }) => {
  await page.context().grantPermissions(['camera']);
  await configuredSession(page);
  await page.route('**/api/v1/live-packing/check', route => route.fulfill({ status: 503, json: { error: { code: 'AI_CHECK_FAILED', message: 'Provider unavailable test' } } }));
  await page.goto('/'); await page.getByRole('button', { name: /Khám phá bản thử nghiệm local/ }).click(); await page.goto('/app/live-packing');
  await page.getByLabel('Đọc hướng dẫn và phản hồi', { exact: false }).uncheck(); await beginTrial(page); await reachVisual(page); await page.getByLabel('Đồng ý để AI lấy khung hình', { exact: false }).check();
  await page.getByRole('button', { name: 'Mở camera', exact: true }).click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Đã làm xong bước này — nhờ AI kiểm tra', exact: true }).click(); await expect(page.getByText('Provider unavailable test')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đạt tiêu chí nhìn thấy' })).toHaveCount(0); await expect(page.getByRole('button', { name: 'Bước tiếp', exact: true })).toBeDisabled();
  await page.locator('section.live-controls').last().getByRole('checkbox').check(); await page.getByLabel('Ghi nhận kiểm tay / lý do thay kết luận ảnh').fill('Người kiểm tra đã đối chiếu trực tiếp.'); await page.getByRole('button', { name: 'Dùng xác nhận thủ công' }).click(); await expect(page.getByRole('button', { name: 'Bước tiếp', exact: true })).toBeEnabled();
});
test('mobile manual fallback, skip remains incomplete, no AI key', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá bản thử nghiệm local/ }).click();
  await page.goto('/app/live-packing');
  await expect(page.getByText('Chưa cấu hình Vision API.', { exact: false })).toBeVisible();
  await page.getByLabel('Đọc hướng dẫn và phản hồi', { exact: false }).uncheck();
  await beginTrial(page); await reachVisual(page);
  await page.evaluate(() => { Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => { throw new DOMException('Denied', 'NotAllowedError'); } }); });
  await page.getByRole('button', { name: 'Mở camera', exact: true }).click();
  await expect(page.getByText(/Không mở được camera/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đã làm xong bước này — nhờ AI kiểm tra', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Bước tiếp', exact: true })).toBeDisabled();
  await page.locator('section.live-controls').last().getByRole('checkbox').check();
  await page.getByLabel('Ghi nhận kiểm tay / lý do thay kết luận ảnh').fill('Người kiểm tra đã đối chiếu trực tiếp.'); await page.getByRole('button', { name: 'Dùng xác nhận thủ công' }).click();
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Bỏ qua — ghi chưa đạt' }).click();
  await expect(page.getByRole('heading', { name: 'Đã kết thúc phiên kiểm thử' })).toBeVisible();
  await expect(page.getByText(/Đã bỏ qua — chưa đạt/)).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('without Vietnamese voice, never speaks in a foreign language', async ({ page }) => {
  let spoken = 0; await page.exposeFunction('foreignSpeech', () => spoken++);
  await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: Object.assign(new EventTarget(), { getVoices: () => [{ name: 'English only', lang: 'en-US', default: true }], speak: () => (window as unknown as { foreignSpeech: () => void }).foreignSpeech(), cancel: () => {} }) }); });
  await page.goto('/'); await page.getByRole('button', { name: /Khám phá bản thử nghiệm local/ }).click(); await page.goto('/app/live-packing');
  await beginTrial(page);
  await page.getByRole('button', { name: 'Nghe lại', exact: true }).click();
  await expect(page.getByText(/Chưa phát được giọng Việt/)).toBeVisible();
  await page.getByRole('button', { name: 'Nghe lại', exact: true }).click(); expect(spoken).toBe(0);
});

test('cancel, revoke consent or stop camera during positioning never sends an image', async ({ page }) => {
  await page.context().grantPermissions(['camera']); let calls = 0;
  await configuredSession(page);
  await page.route('**/api/v1/live-packing/check', async route => { calls++; await route.fulfill({ status: 503, json: { error: { message: 'Unexpected image request' } } }); });
  await page.goto('/'); await page.getByRole('button', { name: /Khám phá bản thử nghiệm local/ }).click(); await page.goto('/app/live-packing');
  await page.getByLabel('Đọc hướng dẫn và phản hồi', { exact: false }).uncheck(); await beginTrial(page); await reachVisual(page); await page.getByLabel('Đồng ý để AI lấy khung hình', { exact: false }).check();
  await page.getByRole('button', { name: 'Mở camera', exact: true }).click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
  await page.clock.install();
  for (const action of ['cancel', 'consent', 'camera']) {
    await page.getByRole('button', { name: 'Đã làm xong bước này — nhờ AI kiểm tra', exact: true }).click();
    await expect(page.getByText('Tự kiểm tra sau 3 giây')).toBeVisible();
    if (action === 'cancel') await page.getByRole('button', { name: 'Hủy kiểm tra', exact: true }).click();
    if (action === 'consent') await page.getByLabel('Đồng ý để AI lấy khung hình', { exact: false }).uncheck();
    if (action === 'camera') await page.getByRole('button', { name: 'Tắt camera', exact: true }).click();
    await page.clock.runFor(4000); expect(calls).toBe(0);
    await expect(page.getByText(/Tự kiểm tra sau/)).toHaveCount(0);
    if (action === 'consent') await page.getByLabel('Đồng ý để AI lấy khung hình', { exact: false }).check();
  }
});

test('bare root branch reads the new SOP and exports unresolved steps without image data', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: /Khám phá bản thử nghiệm local/ }).click(); await page.goto('/app/live-packing');
  await page.getByLabel('Đọc hướng dẫn và phản hồi', { exact:false }).uncheck();
  await page.getByLabel('Hình thức gửi').selectOption('BARE_ROOT');
  await beginTrial(page);
  await expect(page.getByRole('heading', {name:'Chuẩn bị trước ngày gửi',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Đã làm xong bước này — nhờ AI kiểm tra',exact:true})).toHaveCount(0);
  await manualNext(page);
  await expect(page.getByRole('heading',{name:'Chuẩn bị rễ trần',exact:true})).toBeVisible();
  await manualNext(page);
  await expect(page.getByRole('heading',{name:'Bọc cây rễ trần',exact:true})).toBeVisible();
  await page.locator('section.live-controls').last().getByRole('checkbox').check();
  await expect(page.getByRole('button',{name:'Dùng xác nhận thủ công',exact:true})).toBeDisabled();
  for (let i=0;i<4;i++) await page.getByRole('button',{name:'Bỏ qua — ghi chưa đạt',exact:true}).click();
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:'Tải biên bản kiểm thử (không ảnh)',exact:true}).click();
  const download=await pending, data=JSON.parse(readFileSync((await download.path())!,'utf8'));
  expect(data.sop_id).toBe('SUCCULENT-BARE_ROOT-ES'); expect(data.approved_professionally).toBe(false); expect(data.transport_safe).toBeNull();
  expect(Object.values(data.records).filter((r:unknown)=>(r as {kind:string}).kind==='skipped')).toHaveLength(4);
  expect(JSON.stringify(data)).not.toContain('base64');
  await page.screenshot({path:'output/qa/live-sop-bare-root.png',fullPage:true});
});

test('pothos source scope rejects missing and out of range measurements', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/'); await page.getByRole('button',{name:/Khám phá bản thử nghiệm local/}).click(); await page.goto('/app/live-packing');
  await page.getByLabel('Đọc hướng dẫn và phản hồi',{exact:false}).uncheck();
  await page.getByLabel('Nhóm cây').selectOption('pothos');
  await page.getByLabel('Loài/giống đã xác nhận').fill('Epipremnum aureum'); await page.getByLabel('Tôi đại diện shop',{exact:false}).check();
  const begin=page.getByLabel('Tôi đã xem và duyệt checklist',{exact:false}); await expect(begin).toBeDisabled();
  await page.getByLabel('Đường kính chậu (cm)').fill('8'); await page.getByLabel('Chiều cao cả cây/chậu (cm)').fill('40'); await page.getByLabel('Khối lượng kiện dự kiến đã cân (kg)').fill('1');
  await expect(begin).toBeDisabled(); await page.getByLabel('Chiều cao cả cây/chậu (cm)').fill('18'); await expect(begin).toBeEnabled();
  await begin.check(); await expect(page.getByRole('heading',{name:'Chuẩn bị cây nhỏ',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'output/qa/live-sop-pothos-mobile.png',fullPage:true});
});

async function installCommandBrowser(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as {
      commandSessions: Array<{ onresult: ((e:unknown)=>void)|null; onerror: ((e:{error:string})=>void)|null; receive: ((e:unknown)=>void)|null; aborted:boolean }>;
      holdSpeech: boolean; finishSpeech: (()=>void)|null;
    };
    w.commandSessions=[]; w.holdSpeech=false; w.finishSpeech=null;
    Object.defineProperty(window,'SpeechRecognition',{configurable:true,value:class {
      lang='';continuous=false;interimResults=false;maxAlternatives=1;
      onresult:((e:unknown)=>void)|null=null;onerror:((e:{error:string})=>void)|null=null;onstart:(()=>void)|null=null;onend:(()=>void)|null=null;
      receive:((e:unknown)=>void)|null=null;aborted=false;
      start(){ this.receive=this.onresult;w.commandSessions.push(this);this.onstart?.(); }
      abort(){this.aborted=true;}
    }});
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class {
      text:string;lang='';voice:unknown=null;onstart:(()=>void)|null=null;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;
      constructor(text:string){this.text=text;}
    }});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:Object.assign(new EventTarget(),{
      getVoices:()=>[{name:'Vietnamese test',lang:'vi-VN',localService:true}],
      speak:(u:SpeechSynthesisUtterance)=>{u.onstart?.(new Event('start') as SpeechSynthesisEvent);const finish=()=>u.onend?.(new Event('end') as SpeechSynthesisEvent);if(w.holdSpeech)w.finishSpeech=finish;else setTimeout(finish,10);},
      resume:()=>{},cancel:()=>{}
    })});
  });
}
async function command(page: Page, text: string, stale=false) {
  await page.evaluate(({text,stale})=>{
    const w=window as unknown as {commandSessions:Array<{onresult:((e:unknown)=>void)|null;receive:((e:unknown)=>void)|null}>};
    const s=stale?w.commandSessions[0]:w.commandSessions.at(-1)!;
    (stale?s.receive:s.onresult)?.({resultIndex:0,results:[{isFinal:true,0:{transcript:text}}]});
  },{text,stale});
}

test('voice command pauses for TTS, rejects negation and duplicates, then checks camera without marking completion', async ({page})=>{
  await installCommandBrowser(page);await configuredSession(page);await page.context().grantPermissions(['camera']);
  await page.goto('/');await page.getByRole('button',{name:/Khám phá bản thử nghiệm local/}).click();
  const response=await page.goto('/app/live-packing');expect(response?.headers()['permissions-policy']).toContain('microphone=(self)');
  await page.getByLabel('Đọc hướng dẫn và phản hồi',{exact:false}).uncheck();await beginTrial(page);await reachVisual(page);
  await page.getByLabel('Đồng ý để AI lấy khung hình',{exact:false}).check();await page.getByRole('button',{name:'Mở camera',exact:true}).click();
  await expect.poll(()=>page.locator('video').evaluate(v=>(v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0);
  let calls=0;
  await page.route('**/api/v1/live-packing/check',async route=>{calls++;const d=route.request().postDataJSON();expect(d.step_id).toBe('ESP-03');await route.fulfill({json:{data:{step_id:'ESP-03',observed:'Màng phủ trong ảnh thử.',status:'passed',reason:'Kết quả giả lập.',manual_check_required:true,criterion_results:[{criterion_id:'ESP-03-C1',status:'passed',observation:'Giả lập.'}]}}});});
  await page.getByLabel('Điều khiển bằng giọng nói',{exact:false}).check();await expect(page.getByText('Nhận lệnh: Đang nghe lệnh',{exact:true})).toBeVisible();
  await command(page,'chưa xong');await command(page,'tôi chưa xong rồi');expect(calls).toBe(0);
  await page.evaluate(()=>{(window as unknown as {holdSpeech:boolean}).holdSpeech=true;});
  await page.getByLabel('Đọc hướng dẫn và phản hồi',{exact:false}).check();
  await page.getByRole('button',{name:'Nghe lại',exact:true}).click();
  await expect(page.getByText('Nhận lệnh: Tạm ngừng nghe lệnh',{exact:true})).toBeVisible();await command(page,'đã xong rồi',true);expect(calls).toBe(0);
  await page.evaluate(()=>{const w=window as unknown as {holdSpeech:boolean;finishSpeech:(()=>void)|null};w.holdSpeech=false;w.finishSpeech?.();});
  await expect(page.getByText('Nhận lệnh: Đang nghe lệnh',{exact:true})).toBeVisible();
  await command(page,'PlantMove, kiểm tra');await command(page,'đã xong rồi',true);
  await expect(page.getByRole('heading',{name:'Đạt tiêu chí nhìn thấy',exact:true})).toBeVisible({timeout:12000});expect(calls).toBe(1);
  await expect(page.getByRole('button',{name:'Bước tiếp',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Tắt camera',exact:true}).click();await expect(page.getByLabel('Điều khiển bằng giọng nói',{exact:false})).not.toBeChecked();
  await page.screenshot({path:'output/qa/voice-commands.png',fullPage:true});
});

test('spoken done never completes manual steps; denied microphone disables listening without retry',async({page})=>{
  await installCommandBrowser(page);await configuredSession(page);
  await page.goto('/');await page.getByRole('button',{name:/Khám phá bản thử nghiệm local/}).click();await page.goto('/app/live-packing');
  await page.getByLabel('Đọc hướng dẫn và phản hồi',{exact:false}).uncheck();await beginTrial(page);
  let calls=0;await page.route('**/api/v1/live-packing/check',async route=>{calls++;await route.abort();});
  await page.getByLabel('Điều khiển bằng giọng nói',{exact:false}).check();await expect(page.getByText('Nhận lệnh: Đang nghe lệnh',{exact:true})).toBeVisible();
  await command(page,'Đã xong rồi');await expect(page.getByText(/Đã nhận lệnh. Bước này cần kiểm tra trực tiếp/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Bước tiếp',exact:true})).toBeDisabled();expect(calls).toBe(0);
  await expect(page.getByText('Nhận lệnh: Đang nghe lệnh',{exact:true})).toBeVisible();
  await page.evaluate(()=>{const w=window as unknown as {commandSessions:Array<{onerror:((e:{error:string})=>void)|null}>};w.commandSessions.at(-1)?.onerror?.({error:'not-allowed'});});
  await expect(page.getByText(/Micro hoặc dịch vụ nhận giọng bị từ chối/)).toBeVisible();await expect(page.getByLabel('Điều khiển bằng giọng nói',{exact:false})).not.toBeChecked();
  const count=await page.evaluate(()=>(window as unknown as {commandSessions:unknown[]}).commandSessions.length);
  await page.clock.install();await page.clock.runFor(2000);expect(await page.evaluate(()=>(window as unknown as {commandSessions:unknown[]}).commandSessions.length)).toBe(count);
});

test('unsupported speech recognition leaves button workflow available',async({page})=>{
  await page.addInitScript(()=>{for(const name of ['SpeechRecognition','webkitSpeechRecognition'])Object.defineProperty(window,name,{configurable:true,value:undefined});});
  await page.goto('/');await page.getByRole('button',{name:/Khám phá bản thử nghiệm local/}).click();await page.goto('/app/live-packing');
  await page.getByLabel('Đọc hướng dẫn và phản hồi',{exact:false}).uncheck();await beginTrial(page);await reachVisual(page);
  await expect(page.getByLabel('Điều khiển bằng giọng nói',{exact:false})).toBeDisabled();await expect(page.getByRole('button',{name:'Đã làm xong bước này — nhờ AI kiểm tra',exact:true})).toBeVisible();
});
