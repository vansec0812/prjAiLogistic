import { test, expect } from '@playwright/test';
test('real Vietnamese audio plays through Web Audio without an installed Vietnamese voice', async ({ page }) => {
  test.skip(process.env.RUN_REAL_GEMINI !== '1', 'Opt in: one real TTS call.'); test.setTimeout(90000);
  await page.addInitScript(() => { if (window.speechSynthesis) Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => [] }); });
  const origin = 'http://127.0.0.1:3109';
  const auth = await page.request.post(origin + '/api/v1/auth/dev', { headers: { Origin: origin }, data: {} }); expect(auth.status()).toBe(200);
  await page.goto('/app/live-packing');
  const waiting = page.waitForResponse(r => r.url().endsWith('/api/v1/live-packing/speech'), { timeout: 60000 });
  await page.getByRole('button', { name: 'Bật âm thanh và đọc bước hiện tại', exact: true }).click();
  const response = await waiting; expect(response.status()).toBe(200);
  const audio = (await response.json()).data;
  const bytes = Buffer.from(audio.audio_base64, 'base64'); expect(bytes.subarray(0, 4).toString()).toBe('RIFF'); expect(bytes.length).toBeGreaterThan(10000);
  const decoded = await page.evaluate(async (base64: string) => { const context = new AudioContext(); const data = Uint8Array.from(atob(base64), c => c.charCodeAt(0)); const audio = await context.decodeAudioData(data.buffer); const samples = audio.getChannelData(0); let energy = 0; for (const x of samples) energy += x * x; const result = { duration: audio.duration, rms: Math.sqrt(energy / samples.length) }; await context.close(); return result; }, audio.audio_base64);
  expect(decoded.rms).toBeGreaterThan(0.001); expect(decoded.duration).toBeGreaterThan(1);
  await expect(page.getByText('Âm thanh: Đang phát giọng Việt AI', { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Âm thanh: Đã đọc xong', { exact: true })).toBeVisible({ timeout: 30000 });
  console.log(JSON.stringify({ ttsHttpStatus: response.status(), waveBytes: bytes.length, ...decoded, browserPlaybackCompleted: true }));
});
