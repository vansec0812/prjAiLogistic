import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waveFixture } from './fixtures/wave';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(() => ({ id: 'tts-owner' })), csrf: vi.fn(), get: vi.fn(() => ({ n: 0 })), run: vi.fn(), limits: new Map<string, { reset_at: number }>() }));
vi.mock('../apps/web/src/server/security', () => ({ ApiError: class extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }, requireUser: mocks.auth, checkMutation: mocks.csrf, rateLimit: vi.fn(), sha: (s: string) => s }));
vi.mock('../apps/web/src/server/db', () => ({ db: () => ({ prepare: (sql: string) => sql.includes('limits') ? {
  get: (bucket: string) => mocks.limits.get(bucket),
  run: (bucket: string, _count: number, reset_at: number) => mocks.limits.set(bucket, { reset_at }),
} : { get: mocks.get, run: mocks.run } }), transaction: (fn: () => void) => fn() }));
import { vietnameseTts } from '../apps/web/src/server/vietnamese-tts';
const req = (data: unknown) => new NextRequest('http://localhost/api/v1/live-packing/speech', { method: 'POST', body: JSON.stringify(data) });
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); mocks.limits.clear(); mocks.get.mockReturnValue({ n: 0 }); process.env.GEMINI_API_KEY = 'unit-test'; process.env.AI_DAILY_CALL_LIMIT = '20'; });
describe('Vietnamese cloud speech boundary', () => {
  it('requires CSRF before parsing or provider work', async () => { mocks.csrf.mockImplementationOnce(() => { throw new Error('CSRF'); }); await expect(vietnameseTts(req({ text: 'Xin chào', consent: true }))).rejects.toThrow('CSRF'); expect(mocks.run).not.toHaveBeenCalled(); });
  it.each([{ text: 'Xin chào', consent: false }, { text: 'x'.repeat(3001), consent: true }, { consent: true }])('rejects invalid or unconsented text', async data => { await expect(vietnameseTts(req(data))).rejects.toMatchObject({ status: 422 }); });
  it('limits streamed body', async () => { await expect(vietnameseTts(req({ text: 'x'.repeat(21000), consent: true }))).rejects.toMatchObject({ status: 413 }); });
  it('respects quota shared with Vision', async () => { mocks.get.mockReturnValue({ n: 20 }); await expect(vietnameseTts(req({ text: 'Kiểm hạn mức', consent: true }))).rejects.toMatchObject({ status: 429 }); });
  it('does not serve invalid provider audio', async () => { vi.stubGlobal('fetch', vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from('invalid audio').toString('base64') } }] } }] }))); await expect(vietnameseTts(req({ text: 'Âm thanh lỗi', consent: true }))).rejects.toMatchObject({ code: 'TTS_FAILED' }); });
  it('reports daily Gemini quota, blocks other texts without reserving calls, and retries after the provider deadline', async () => {
    const fetcher = vi.fn(async () => Response.json({ error: { details: [
      { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3743s' },
    ] } }, { status: 429 })); vi.stubGlobal('fetch', fetcher);
    await expect(vietnameseTts(req({ text: 'Lần đọc hết hạn mức', consent: true }))).rejects.toMatchObject({ status: 429, code: 'TTS_PROVIDER_QUOTA', message: expect.stringContaining('hết hạn mức Gemini trong ngày') });
    const attempts = mocks.run.mock.calls.length;
    await expect(vietnameseTts(req({ text: 'Nội dung khác cũng bị giới hạn', consent: true }))).rejects.toMatchObject({ code: 'TTS_PROVIDER_QUOTA', message: expect.stringContaining('giờ Việt Nam') });
    expect(fetcher).toHaveBeenCalledTimes(1); expect(mocks.run).toHaveBeenCalledTimes(attempts);
    expect(mocks.run).toHaveBeenLastCalledWith('FAILED_USAGE_UNKNOWN', JSON.stringify({ model: 'gemini-3.8-flash-lite-tts', error_code: 'TTS_PROVIDER_QUOTA' }), expect.any(String));
    const saved = [...mocks.limits.values()][0]; saved.reset_at = Date.now() - 1;
    fetcher.mockImplementationOnce(async () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: waveFixture().toString('base64') } }] } }] }));
    expect((await vietnameseTts(req({ text: 'Đọc sau thời gian chờ', consent: true }))).mime_type).toBe('audio/wav');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('keeps cached audio playable while new speech is blocked by provider quota', async () => {
    const fetcher = vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: waveFixture().toString('base64') } }] } }] })); vi.stubGlobal('fetch', fetcher);
    const data = { text: 'Hướng dẫn đã tạo trước khi hết lượt', consent: true };
    const audio = await vietnameseTts(req(data));
    fetcher.mockImplementationOnce(async () => Response.json({ error: { details: [
      { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '60s' },
    ] } }, { status: 429 }));
    await expect(vietnameseTts(req({ text: 'Hết lượt cho câu mới', consent: true }))).rejects.toMatchObject({ code: 'TTS_PROVIDER_QUOTA' });
    expect(await vietnameseTts(req(data))).toEqual(audio); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('distinguishes a short rate limit from a daily quota and keeps provider secrets out of the error', async () => {
    const fetcher = vi.fn(async () => Response.json({ error: { message: 'private provider details', details: [
      { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' }] },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3.5s' },
    ] } }, { status: 429 })); vi.stubGlobal('fetch', fetcher);
    await expect(vietnameseTts(req({ text: 'Giới hạn theo phút', consent: true }))).rejects.toMatchObject({ code: 'TTS_RATE_LIMIT', message: expect.not.stringContaining('private provider details') });
    await expect(vietnameseTts(req({ text: 'Không gửi tiếp khi cần chờ', consent: true }))).rejects.toMatchObject({ code: 'TTS_RATE_LIMIT' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not apply the previous key quota deadline after credentials are replaced', async () => {
    const fetcher = vi.fn(async () => Response.json({ error: { details: [
      { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3600s' },
    ] } }, { status: 429 })); vi.stubGlobal('fetch', fetcher);
    await expect(vietnameseTts(req({ text: 'Key cũ bị giới hạn', consent: true }))).rejects.toMatchObject({ code: 'TTS_PROVIDER_QUOTA' });
    process.env.GEMINI_API_KEY = 'replacement-unit-test';
    fetcher.mockImplementationOnce(async () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: waveFixture().toString('base64') } }] } }] }));
    expect((await vietnameseTts(req({ text: 'Kiểm tra key mới', consent: true }))).mime_type).toBe('audio/wav');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('reuses valid audio for the same owner and text without another paid call', async () => {
    const wave = waveFixture();
    const fetcher = vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: wave.toString('base64') } }] } }] })); vi.stubGlobal('fetch', fetcher);
    const data = { text: 'Xin chào, kiểm tra bộ nhớ tạm', consent: true };
    expect((await vietnameseTts(req(data))).mime_type).toBe('audio/wav'); await vietnameseTts(req(data)); expect(fetcher).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(String((fetcher.mock.calls as unknown as [string, RequestInit][])[0][1].body));
    expect(sent.contents[0].parts[0].text).toBe(data.text);
    expect(sent.contents[0].parts[0].speechMetadata.style).toContain('Read exactly');
  });
});
