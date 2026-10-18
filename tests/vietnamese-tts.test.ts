import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waveFixture } from './fixtures/wave';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(() => ({ id: 'tts-owner' })), csrf: vi.fn(), get: vi.fn(() => ({ n: 0 })), run: vi.fn() }));
vi.mock('../apps/web/src/server/security', () => ({ ApiError: class extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }, requireUser: mocks.auth, checkMutation: mocks.csrf, rateLimit: vi.fn(), sha: (s: string) => s }));
vi.mock('../apps/web/src/server/db', () => ({ db: () => ({ prepare: () => ({ get: mocks.get, run: mocks.run }) }), transaction: (fn: () => void) => fn() }));
import { vietnameseTts } from '../apps/web/src/server/vietnamese-tts';
const req = (data: unknown) => new NextRequest('http://localhost/api/v1/live-packing/speech', { method: 'POST', body: JSON.stringify(data) });
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); mocks.get.mockReturnValue({ n: 0 }); process.env.GEMINI_API_KEY = 'unit-test'; process.env.AI_DAILY_CALL_LIMIT = '20'; });
describe('Vietnamese cloud speech boundary', () => {
  it('requires CSRF before parsing or provider work', async () => { mocks.csrf.mockImplementationOnce(() => { throw new Error('CSRF'); }); await expect(vietnameseTts(req({ text: 'Xin chào', consent: true }))).rejects.toThrow('CSRF'); expect(mocks.run).not.toHaveBeenCalled(); });
  it.each([{ text: 'Xin chào', consent: false }, { text: 'x'.repeat(3001), consent: true }, { consent: true }])('rejects invalid or unconsented text', async data => { await expect(vietnameseTts(req(data))).rejects.toMatchObject({ status: 422 }); });
  it('limits streamed body', async () => { await expect(vietnameseTts(req({ text: 'x'.repeat(21000), consent: true }))).rejects.toMatchObject({ status: 413 }); });
  it('respects quota shared with Vision', async () => { mocks.get.mockReturnValue({ n: 20 }); await expect(vietnameseTts(req({ text: 'Kiểm hạn mức', consent: true }))).rejects.toMatchObject({ status: 429 }); });
  it('does not serve invalid provider audio', async () => { vi.stubGlobal('fetch', vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from('invalid audio').toString('base64') } }] } }] }))); await expect(vietnameseTts(req({ text: 'Âm thanh lỗi', consent: true }))).rejects.toMatchObject({ code: 'TTS_FAILED' }); });
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
