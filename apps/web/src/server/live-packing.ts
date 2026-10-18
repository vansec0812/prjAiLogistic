import type { NextRequest } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';
import type { CaseRecord } from '@plantcare/domain';
import { ownedGuidance, guidanceSop, saveGuidanceCheck, clearGuidanceCheck } from './guidance';
import { checkpointPrompt, checkpointSchema, contextIssues, contextSchema, sopCatalog, validateResult, type CheckpointResult } from '../lib/live-packing';
import { ApiError, rateLimit, requireUser, checkMutation } from './security';
import { db, doc, development, transaction } from './db';
import { newPostCheck, postCheckStep, savePostCheckAi } from './mvp';
import type { GuidanceSession } from '../lib/guidance';

const invalid = () => new ApiError(422, 'INVALID_CHECKPOINT', 'Ảnh hoặc checkpoint không hợp lệ. Chọn ảnh JPEG/PNG/WebP tối đa 2 MB.');
export async function checkLivePacking(req: NextRequest) {
  const user = requireUser(req); checkMutation(req, user);
  rateLimit('live-packing:' + user.id, 10, 60000);
  const key = process.env.GEMINI_API_KEY, model = process.env.GEMINI_VISION_MODEL;
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 30000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 5000 || timeoutMs > 60000) throw new ApiError(503, 'AI_CONFIG', 'Timeout Gemini chưa hợp lệ.');
  if (!key || !model || !/^[a-zA-Z0-9._-]+$/.test(model)) throw new ApiError(503, 'AI_UNAVAILABLE', 'Chưa cấu hình AI. Dùng checklist và xác nhận thủ công.');
  // Stream with a hard cap, including chunked requests; never persist image bytes.
  const reader = req.body?.getReader(); if (!reader) throw invalid();
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 2900000) { await reader.cancel(); throw new ApiError(413, 'IMAGE_TOO_LARGE', 'Ảnh vượt giới hạn.'); } chunks.push(value); }
  let raw: unknown; try { raw = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw invalid(); }
  const parsed = z.object({ sop_id: z.string().max(100), step_id: z.string().max(40), sop_version: z.string().max(100), shipping_form: z.enum(['POTTED', 'BARE_ROOT']), context: contextSchema, approved_for_trial: z.literal(true), reference_guidance:z.literal(true).optional(),consent: z.literal(true), image: z.string().max(2800000), case_id:z.string().optional(),session_id:z.string().optional(),session_revision:z.number().int().positive().optional(),post_check:z.literal(true).optional(),post_revision:z.number().int().positive().optional() }).strict().safeParse(raw);
  if (!parsed.success) throw invalid();
  const data = parsed.data;let sop = sopCatalog.sops.find(s => s.id === data.sop_id),boundGuidance:GuidanceSession|undefined;
  const bound=[data.case_id,data.session_id,data.session_revision].filter(x=>x!==undefined).length;
  if(bound!==0&&bound!==3)throw invalid();
  if(!development()&&!bound)throw new ApiError(409,'SOP_NOT_APPROVED','Cần mở phiên hướng dẫn theo hồ sơ.');
  const caseRecord=bound?doc<CaseRecord>('case',data.case_id!,user.id):undefined;
  if(bound){
    if(!caseRecord)throw new ApiError(404,'NOT_FOUND','Không tìm thấy hồ sơ.');
    const g=ownedGuidance(user.id,caseRecord,data.session_id!,data.session_revision),currentSop=guidanceSop(g);
    boundGuidance=g;sop=currentSop;
    if(!development()&&g.mode!=='MVP'&&(g.mode!=='REFERENCE'||process.env.PLANTCARE_REFERENCE_GUIDE_ENABLED!=='true'))throw new ApiError(409,'SOP_NOT_APPROVED','Phiên thử nghiệm không được chạy trên production.');
    const post=!!data.post_check&&g.mode==='MVP'&&g.status==='FINISHED'&&!!data.post_revision;
    if((post?data.step_id!=='postcheck':g.status!=='ACTIVE'||g.mode==='MVP'&&g.executionState!=='RUNNING'||currentSop.steps[g.index]?.id!==data.step_id)||g.sopId!==data.sop_id||g.sopVersion!==data.sop_version||JSON.stringify(g.context)!==JSON.stringify(data.context)||data.post_check&&!post)throw new ApiError(409,'CHECKPOINT_MISMATCH','Đầu vào không khớp phiên hướng dẫn hiện tại.');
  }
  if (!sop || sop.version !== data.sop_version) throw new ApiError(409, 'SOP_VERSION_MISMATCH', 'SOP đã thay đổi hoặc không được hỗ trợ. Tải lại trang.');
  if (sop.shipping_form !== data.shipping_form || contextIssues(sop, data.context).length) throw new ApiError(422, 'SOP_SCOPE_MISMATCH', 'Đầu vào chưa thuộc phạm vi SOP. Kiểm tra loài, hình thức và số đo đã xác nhận.');
  const step = data.post_check&&caseRecord&&boundGuidance?postCheckStep(newPostCheck(user.id,caseRecord,boundGuidance)):sop.steps.find(s => s.id === data.step_id); if (!step) throw invalid();
  const persist=(result:CheckpointResult)=>{
    if(!caseRecord)return result;requireUser(req);
    if(data.post_check&&boundGuidance){return transaction(()=>{const latest=doc<CaseRecord>('case',caseRecord.id,user.id);if(!latest)throw new ApiError(404,'NOT_FOUND','Không tìm thấy hồ sơ.');const current=ownedGuidance(user.id,latest,data.session_id!,data.session_revision);return {...result,postcheck:savePostCheckAi(user.id,latest,current,data.post_revision!,result)};});}
    return {...result,guidance:saveGuidanceCheck(user.id,caseRecord,data.session_id!,data.session_revision!,step.id,result)};
  };
  if (step.mode !== 'visual') throw new ApiError(422, 'MANUAL_STEP', 'Bước này phải kiểm trực tiếp; không gửi ảnh để suy độ khô hoặc độ chắc.');
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data.image); if (!match) throw invalid();
  const bytes = Buffer.from(match[2], 'base64'); if (bytes.length > 2 * 1024 * 1024) throw invalid();
  let image: Buffer;
  try { const decoder = sharp(bytes, { limitInputPixels: 12000000 }); const meta = await decoder.metadata(); if (!['jpeg', 'png', 'webp'].includes(meta.format || '') || (meta.pages || 1) > 1) throw invalid(); image = await decoder.rotate().resize(1280, 1280, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer(); } catch { throw invalid(); }
  // Uniform frames contain no evidence of a plant or packing, regardless of model output.
  const stats=await sharp(image).stats();
  if(stats.channels.every(c=>c.max-c.min<=1)){
    const reason='Ảnh không có đủ chi tiết. Đưa cây và vùng đang đóng gói vào camera rồi kiểm tra lại.';
    const result:CheckpointResult={step_id:step.id,observed:'Khung hình gần như một màu.',status:'unverifiable',reason,manual_check_required:true,criterion_results:step.criteria.map(c=>({criterion_id:c.id,status:'unverifiable',observation:reason}))};
    requireUser(req);
    return persist(result);
  }
  const max = Number(process.env.AI_DAILY_CALL_LIMIT || 20); if (!Number.isInteger(max) || max < 1 || max > 1000) throw new ApiError(503, 'AI_CONFIG', 'Hạn mức AI chưa hợp lệ.');
  const id = crypto.randomUUID(), day = new Date().toISOString().slice(0, 10);
  transaction(() => { const count = db().prepare('SELECT COUNT(*) AS n FROM ai_calls WHERE day=?').get(day) as { n: number }; if (count.n >= max) throw new ApiError(429, 'AI_QUOTA', 'Hết hạn mức AI hôm nay. Tiếp tục thủ công.'); db().prepare('INSERT INTO ai_calls VALUES(?,?,?,?,?,?)').run(id, user.id, day, 'RESERVED', '{}', new Date().toISOString()); });
  try {
    requireUser(req);
    if(caseRecord&&!data.post_check)clearGuidanceCheck(user.id,caseRecord,data.session_id!,data.session_revision!,step.id);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(timeoutMs), body: JSON.stringify({
      contents: [{ parts: [{ text: checkpointPrompt(sop, step, data.context) }, { inlineData: { mimeType: 'image/jpeg', data: image.toString('base64') } }] }],
      generationConfig: { responseFormat: { text: { mimeType: 'APPLICATION_JSON', schema: z.toJSONSchema(checkpointSchema) } }, maxOutputTokens: 1500 }
    }) });
    if (!response.ok) {
      if (response.status === 400) throw new ApiError(503, 'AI_REQUEST_INVALID', 'Gemini từ chối định dạng yêu cầu. Cần kiểm tra cấu hình tích hợp; tiếp tục thủ công.');
      if (response.status === 401 || response.status === 403) throw new ApiError(503, 'AI_AUTH_FAILED', 'Gemini từ chối key hoặc quyền truy cập. Kiểm tra key và quyền của dự án.');
      if (response.status === 404) throw new ApiError(503, 'AI_MODEL_UNAVAILABLE', 'Model Gemini không khả dụng với dự án này. Cần chọn model được hỗ trợ.');
      if (response.status === 429) throw new ApiError(429, 'AI_PROVIDER_QUOTA', 'Gemini đang giới hạn lượt gọi. Thử lại sau hoặc xác nhận thủ công.');
      throw new ApiError(503, 'AI_PROVIDER_UNAVAILABLE', 'Gemini tạm quá tải hoặc không khả dụng. Thử lại sau hoặc xác nhận thủ công.');
    }
    const output = await response.json();
    const text = output.candidates?.[0]?.content?.parts?.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought).map((p: { text: string }) => p.text).join('');
    let result = validateResult(JSON.parse(text || '{}'), step);
    if(boundGuidance?.mode==='MVP'&&(result.confidence===undefined||result.confidence===null||result.confidence<(boundGuidance.confidenceThreshold??70)))result={...result,status:'unverifiable',reason:'Ảnh chưa đủ rõ hoặc AI chưa đủ tin cậy. Điều chỉnh ánh sáng, góc máy hoặc kiểm tra trực tiếp.',criterion_results:result.criterion_results.map(r=>({...r,status:'unverifiable',observation:'Chưa đủ tin cậy để kết luận.'}))};
    db().prepare('UPDATE ai_calls SET status=?,usage=? WHERE id=?').run('SUCCEEDED', JSON.stringify(output.usageMetadata || {}), id);
    return persist(result);
  } catch (error) { db().prepare('UPDATE ai_calls SET status=? WHERE id=?').run('FAILED_USAGE_UNKNOWN', id); if (error instanceof ApiError) throw error; if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new ApiError(503, 'AI_TIMEOUT', 'Gemini phản hồi quá thời gian chờ. Thử lại sau hoặc xác nhận thủ công.'); throw new ApiError(503, 'AI_CHECK_FAILED', 'Chưa kiểm tra được ảnh. Kiểm tra lại hoặc xác nhận thủ công; không có kết luận AI.'); }
}
