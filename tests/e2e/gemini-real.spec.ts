import { test, expect } from '@playwright/test';
import sharp from 'sharp';
test('real authenticated checkpoint rejects blank image as unverifiable', async ({ request }) => {
  test.skip(process.env.RUN_REAL_GEMINI !== '1', 'Explicit opt-in required: spends one provider call.');
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
