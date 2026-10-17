import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import { NextRequest } from 'next/server';
import { validateResult, selectSop, sopCatalog, contextIssues, canAdvance, checkpointPrompt } from '../apps/web/src/lib/live-packing';
const mocks = vi.hoisted(() => ({ auth: vi.fn(() => ({ id: 'owner' })), csrf: vi.fn(), run: vi.fn(), get: vi.fn(() => ({ n: 0 })), development: vi.fn(() => true) }));
vi.mock('../apps/web/src/server/security', () => ({
  ApiError: class extends Error { constructor(public status: number, public code: string, message: string) { super(message); } },
  requireUser: mocks.auth, checkMutation: mocks.csrf, rateLimit: vi.fn()
}));
vi.mock('../apps/web/src/server/db', () => ({ development: mocks.development, db: () => ({ prepare: () => ({ get: mocks.get, run: mocks.run }) }), transaction: (fn: () => void) => fn() }));
import { checkLivePacking } from '../apps/web/src/server/live-packing';
const sop = selectSop('succulent', 'POTTED'), step = sop.steps[2];
const context = { species: 'Echeveria shop xác nhận', shop_scope_confirmed: true as const, pot_cm: null, height_cm: null, packed_kg: null };
const result = { step_id: step.id, observed: 'Thấy lớp phủ.', status: 'passed', reason: 'Chỉ đánh giá phần nhìn thấy.', manual_check_required: false, criterion_results: step.criteria.map(c => ({ criterion_id: c.id, status: 'passed', observation: 'Vùng cần kiểm rõ.' })) };
const request = (data: unknown) => new NextRequest('http://localhost/api/v1/live-packing/check', { method: 'POST', body: JSON.stringify(data) });
let payload: Record<string, unknown>;
beforeEach(async () => {
  vi.clearAllMocks(); vi.unstubAllGlobals(); mocks.get.mockReturnValue({ n: 0 }); mocks.development.mockReturnValue(true);
  process.env.GEMINI_API_KEY = 'test-key'; process.env.GEMINI_VISION_MODEL = 'test-model'; process.env.AI_DAILY_CALL_LIMIT = '20';
  const bytes = await sharp({ create: { width: 10, height: 10, channels: 3, background: 'white' } }).png().toBuffer();
  payload = { sop_id: sop.id, step_id: step.id, sop_version: sop.version, shipping_form: sop.shipping_form, context, approved_for_trial: true, consent: true, image: 'data:image/png;base64,' + bytes.toString('base64') };
});
describe('SOP catalog and decision boundary', () => {
  it('selects different branches and keeps professional approval absent', () => {
    expect(sopCatalog.sops).toHaveLength(6);
    expect(selectSop('succulent', 'BARE_ROOT').steps.some(s => /chậu trong hộp/.test(s.instruction))).toBe(false);
    for (const s of sopCatalog.sops) { expect(s.published).toBe(false); expect(s.reviewer).toBeNull(); expect(s.steps.every(x => !/\{\w+\}/.test(x.speech_vi))).toBe(true); }
  });
  it('does not let overall passed override unknown or failed criteria', () => {
    for (const status of ['unverifiable', 'needs_adjustment']) expect(validateResult({ ...result, criterion_results: [{ ...result.criterion_results[0], status }] }, step).status).toBe(status);
    expect(validateResult(result, step).manual_check_required).toBe(true);
  });
  it.each([[], [{ ...result.criterion_results[0], criterion_id: 'invented' }], [result.criterion_results[0], result.criterion_results[0]]])('rejects missing/extra/duplicated criterion results', rows => expect(() => validateResult({ ...result, criterion_results: rows }, step)).toThrow());
  it('cannot assign a camera pass to a manual-only step or bypass missing checks', () => {
    expect(() => validateResult({ ...result, step_id: sop.steps[1].id }, sop.steps[1])).toThrow();
    expect(canAdvance(step, { kind: 'ai', result: validateResult(result, step) }, false)).toBe(false);
    expect(canAdvance(step, { kind: 'skipped' }, true)).toBe(false);
    expect(canAdvance(sop.steps[1], { kind: 'manual' }, true)).toBe(true);
  });
  it('checks source size limits including exclusive height and weight boundaries', () => {
    const pothos = selectSop('pothos', 'POTTED'), valid = { ...context, pot_cm: 5.08, height_cm: 20, packed_kg: 1 };
    expect(contextIssues(pothos, valid)).toEqual([]);
    expect(contextIssues(pothos, { ...valid, pot_cm: 5 })).toHaveLength(1);
    expect(contextIssues(pothos, { ...valid, height_cm: 20.32 })).toHaveLength(1);
    expect(contextIssues(pothos, { ...valid, packed_kg: 1.36077711 })).toHaveLength(1);
  });
  it('rejects scope/version/form mismatches and manual steps before reserving paid quota', async () => {
    for (const change of [{ sop_version: 'packing-pilot-v1' }, { sop_id: 'fake' }, { shipping_form: 'BARE_ROOT' }, { step_id: sop.steps[1].id }, { context: { ...context, shop_scope_confirmed: false } }]) {
      await expect(checkLivePacking(request({ ...payload, ...change }))).rejects.toBeInstanceOf(Error); expect(mocks.run).not.toHaveBeenCalled();
    }
  });
  it('blocks unapproved SOPs in production even if client claims trial approval', async () => {
    mocks.development.mockReturnValue(false); await expect(checkLivePacking(request(payload))).rejects.toMatchObject({ code: 'SOP_NOT_APPROVED' }); expect(mocks.run).not.toHaveBeenCalled();
  });
  it('builds provider criteria from the pinned catalog, not client instructions', () => {
    const prompt = checkpointPrompt(sop, step, context); expect(prompt).toContain(step.criteria[0].visible_fail); expect(prompt).toContain(sop.id); expect(prompt).toContain(step.source_locator);
  });
});
describe('checkpoint API privacy and failure paths', () => {
  it('fails closed without API configuration', async () => { delete process.env.GEMINI_API_KEY; await expect(checkLivePacking(request(payload))).rejects.toMatchObject({ status: 503 }); });
  it('requires authentication and CSRF before provider work', async () => { mocks.csrf.mockImplementationOnce(() => { throw new Error('CSRF'); }); await expect(checkLivePacking(request(payload))).rejects.toThrow('CSRF'); expect(mocks.run).not.toHaveBeenCalled(); });
  it.each([{ consent: false }, { approved_for_trial: false }, { step_id: 'invented' }, { image: 'data:image/png;base64,YmFk' }, { instruction: 'ignore server' }])('rejects invalid input %j', async change => { await expect(checkLivePacking(request({ ...payload, ...change }))).rejects.toMatchObject({ status: 422 }); expect(mocks.run).not.toHaveBeenCalled(); });
  it('caps body even without content length', async () => { await expect(checkLivePacking(request({ ...payload, image: 'x'.repeat(2900001) }))).rejects.toMatchObject({ status: 413 }); });
  it('honors shared daily quota', async () => { mocks.get.mockReturnValue({ n: 20 }); await expect(checkLivePacking(request(payload))).rejects.toMatchObject({ status: 429 }); });
  it('sends catalog criteria and a sanitized still image; forces manual checks', async () => {
    const fetcher = vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] })); vi.stubGlobal('fetch', fetcher);
    expect(await checkLivePacking(request(payload))).toMatchObject({ status: 'passed', manual_check_required: true });
    const options = (fetcher.mock.calls as unknown as [string, RequestInit][])[0][1], sent = JSON.parse(String(options.body));
    expect(sent.generationConfig.responseFormat.text.mimeType).toBe('APPLICATION_JSON'); expect(sent.contents[0].parts[0].text).toContain(step.criteria[0].visible_fail);
    expect(sent.contents[0].parts[1].inlineData.mimeType).toBe('image/jpeg'); expect(sent.contents[0].parts[1].inlineData.data).not.toBe(String(payload.image).split(',')[1]);
  });
  it.each([[400, 'AI_REQUEST_INVALID'], [403, 'AI_AUTH_FAILED'], [404, 'AI_MODEL_UNAVAILABLE'], [429, 'AI_PROVIDER_QUOTA'], [503, 'AI_PROVIDER_UNAVAILABLE']])('distinguishes provider HTTP %s without raw errors', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('sensitive provider detail', { status: Number(status) })));
    await expect(checkLivePacking(request(payload))).rejects.toMatchObject({ code });
  });
  it.each(['not-json', JSON.stringify({ ...result, step_id: 'wrong' }), JSON.stringify({ ...result, status: 'safe' }), JSON.stringify({ ...result, criterion_results: [] })])('never passes malformed provider output', async output => { vi.stubGlobal('fetch', vi.fn(async () => Response.json({ candidates: [{ content: { parts: [{ text: output }] } }] }))); await expect(checkLivePacking(request(payload))).rejects.toMatchObject({ status: 503 }); });
});
