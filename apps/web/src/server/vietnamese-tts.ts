import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiError, requireUser, checkMutation, rateLimit, sha } from './security';
import { db, transaction } from './db';
import { vietnameseSpeechText, PRONUNCIATION_VERSION } from '../lib/vietnamese-pronunciation';
import { validWav } from '../lib/wav';
const cache = new Map<string, { expires: number; value: SpeechAudio }>();
const pending = new Map<string, Promise<SpeechAudio>>();
type SpeechAudio = { audio_base64: string; mime_type: 'audio/wav' };
export async function vietnameseTts(req: NextRequest): Promise<SpeechAudio> {
  const user = requireUser(req); checkMutation(req, user); rateLimit('vietnamese-tts:' + user.id, 12, 60000);
  const reader = req.body?.getReader(); if (!reader) throw new ApiError(422, 'TTS_INPUT', 'Thiếu nội dung đọc.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length; if (size > 20000) { await reader.cancel(); throw new ApiError(413, 'TTS_TOO_LARGE', 'Nội dung đọc quá dài.'); } chunks.push(part.value); }
  let raw: unknown; try { raw = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(422, 'TTS_INPUT', 'Nội dung đọc không hợp lệ.'); }
  const parsed = z.object({ text: z.string().trim().min(1).max(3000), consent: z.literal(true) }).strict().safeParse(raw);
  if (!parsed.success) throw new ApiError(422, 'TTS_INPUT', 'Cần đồng ý tạo giọng Việt và nội dung đọc hợp lệ.');
  parsed.data.text=vietnameseSpeechText(parsed.data.text);
  if(parsed.data.text.length>3000)throw new ApiError(422,'TTS_INPUT','Nội dung đọc quá dài.');
  const key = process.env.GEMINI_API_KEY, model = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';
  if (!key || !/^[\w.-]+$/.test(model)) throw new ApiError(503, 'TTS_CONFIG', 'Chưa cấu hình giọng Việt AI.');
  const hash = sha(user.id + ':' + model + ':' + PRONUNCIATION_VERSION + ':' + parsed.data.text), now = Date.now();
  for (const [id, entry] of cache) if (entry.expires <= now) cache.delete(id);
  const cached = cache.get(hash); if (cached) return cached.value;
  const running = pending.get(hash); if (running) return running;
  const work = async (): Promise<SpeechAudio> => {
    const limit = Number(process.env.AI_DAILY_CALL_LIMIT || 20), day = new Date().toISOString().slice(0, 10), id = crypto.randomUUID();
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new ApiError(503, 'TTS_CONFIG', 'Hạn mức AI chưa hợp lệ.');
    transaction(() => { const count = db().prepare('SELECT COUNT(*) AS n FROM ai_calls WHERE day=?').get(day) as { n: number }; if (count.n >= limit) throw new ApiError(429, 'AI_QUOTA', 'Hết hạn mức AI hôm nay. Giọng trên thiết bị và hướng dẫn chữ vẫn dùng được.'); db().prepare('INSERT INTO ai_calls VALUES(?,?,?,?,?,?)').run(id, user.id, day, 'RESERVED', '{}', new Date().toISOString()); });
    try {
      requireUser(req);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(45000), body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: parsed.data.text, speechMetadata: { style: 'Speak clearly in Vietnamese, natural and friendly, at a moderate pace. Read exactly the supplied Vietnamese text.' } }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { voice: 'Kore' } }, responseFormat: { audio: { mimeType: 'AUDIO_WAV' } } } }) });
      if (!response.ok) throw new ApiError(response.status === 429 ? 429 : 503, 'TTS_UNAVAILABLE', 'Giọng Việt AI đang bận hoặc chưa được cấp quyền. Bấm nghe thử lại sau.');
      const data = await response.json();
      const inline = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data)?.inlineData;
      if (typeof inline?.data !== 'string' || inline.data.length > 8000000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(inline.data)) throw new Error('INVALID_AUDIO');
      const bytes = Buffer.from(inline.data, 'base64');
      if (!validWav(bytes)) throw new Error('INVALID_AUDIO');
      const value: SpeechAudio = { audio_base64: bytes.toString('base64'), mime_type: 'audio/wav' };
      db().prepare('UPDATE ai_calls SET status=?,usage=? WHERE id=?').run('SUCCEEDED', JSON.stringify(data.usageMetadata || {}), id);
      while (cache.size >= 8) cache.delete(cache.keys().next().value!);
      cache.set(hash, { expires: Date.now() + 300000, value }); return value;
    } catch (error) { db().prepare('UPDATE ai_calls SET status=? WHERE id=?').run('FAILED_USAGE_UNKNOWN', id); if (error instanceof ApiError) throw error; throw new ApiError(503, 'TTS_FAILED', 'Chưa tạo được giọng Việt. Bấm nghe thử lại hoặc đọc hướng dẫn trên màn hình.'); }
  };
  const task = work(); pending.set(hash, task); try { return await task; } finally { pending.delete(hash); }
}
