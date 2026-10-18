import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { CaseRecord } from '@plantcare/domain';
import type { GuidanceSession } from '../lib/guidance';
import { canAdvance, contextIssues, contextSchema, sopCatalog, type StepRecord, type CheckpointResult } from '../lib/live-packing';
import { docs, doc, insertDoc, updateDoc, transaction, development, audit } from './db';
import { ApiError, inputHash } from './security';
import { parse } from './schemas';

const missing=()=>new ApiError(404,'NOT_FOUND','Không tìm thấy phiên hướng dẫn.');
export function assertGuidanceCase(c:CaseRecord){
  if(['DELETED','PACKED','SHIPPED','RECEIVED'].includes(c.status))throw new ApiError(409,'CASE_COMPLETED','Hồ sơ đã kết thúc. Tạo hồ sơ mới để hướng dẫn.');
  if(!development())throw new ApiError(409,'SOP_NOT_APPROVED','SOP đang thử nghiệm; camera xem tại chỗ vẫn có thể mở.');
}
export function guidanceSop(g:GuidanceSession){const sop=sopCatalog.sops.find(s=>s.id===g.sopId&&s.version===g.sopVersion);if(!sop)throw new ApiError(409,'SOP_VERSION_MISMATCH','SOP đã thay đổi. Tạo phiên mới để giữ lịch sử.');return sop;}
export function ownedGuidance(owner:string,c:CaseRecord,id:string,revision?:number){
  assertGuidanceCase(c);const g=doc<GuidanceSession>('guidance',id,owner);if(!g||g.caseId!==c.id)throw missing();
  if(g.inputHash!==inputHash(c.input))throw new ApiError(409,'GUIDANCE_STALE','Đầu vào hồ sơ đã thay đổi. Tạo phiên hướng dẫn mới.');
  if(revision!==undefined&&g.revision!==revision)throw new ApiError(409,'VERSION_CONFLICT','Phiên đã thay đổi ở nơi khác. Tải lại tiến độ.');
  guidanceSop(g);return g;
}
export function listGuidance(owner:string,c:CaseRecord){return docs<GuidanceSession>('guidance',owner).filter(g=>g.caseId===c.id).map(g=>({...g,stale:g.inputHash!==inputHash(c.input)||!sopCatalog.sops.some(s=>s.id===g.sopId&&s.version===g.sopVersion)}));}
export function startGuidance(owner:string,c:CaseRecord,value:unknown){
  const current=doc<CaseRecord>('case',c.id,owner);if(!current)throw missing();c=current;
  assertGuidanceCase(c);const v=parse(z.object({case_version:z.number().int().positive(),sop_id:z.string(),sop_version:z.string(),context:contextSchema,approved_for_trial:z.literal(true)}).strict(),value);
  if(c.version!==v.case_version)throw new ApiError(409,'VERSION_CONFLICT','Hồ sơ vừa được sửa, tải lại dữ liệu.');
  const sop=sopCatalog.sops.find(s=>s.id===v.sop_id&&s.version===v.sop_version);if(!sop)throw new ApiError(409,'SOP_VERSION_MISMATCH','SOP đã đổi.');
  if(contextIssues(sop,v.context).length)throw new ApiError(422,'SOP_SCOPE_MISMATCH','Thiếu dữ liệu hoặc ngoài phạm vi SOP.');
  const now=new Date().toISOString();const g:GuidanceSession={id:randomUUID(),caseId:c.id,inputHash:inputHash(c.input),sopId:sop.id,sopVersion:sop.version,context:v.context,revision:1,index:0,status:'ACTIVE',records:{},checks:{},createdAt:now,updatedAt:now};
  insertDoc('guidance',g.id,owner,g,'ACTIVE');audit(owner,'GUIDANCE_STARTED',g.id);return g;
}
export function advanceGuidance(owner:string,c:CaseRecord,id:string,value:unknown){
  const v=parse(z.object({expected_revision:z.number().int().positive(),step_id:z.string(),action:z.enum(['CONFIRM','MANUAL','SKIP']),method:z.enum(['BUTTON','VOICE']),manual_checked:z.literal(true),note:z.string().max(500).default('')}).strict(),value);
  return transaction(()=>{
    const currentCase=doc<CaseRecord>('case',c.id,owner);if(!currentCase)throw missing();
    const g=ownedGuidance(owner,currentCase,id,v.expected_revision),sop=guidanceSop(g),step=sop.steps[g.index];
    if(g.status!=='ACTIVE'||!step||step.id!==v.step_id)throw new ApiError(409,'CHECKPOINT_MISMATCH','Lời xác nhận không còn thuộc bước hiện tại.');
    const result=g.checks[step.id];const record:StepRecord=v.action==='SKIP'?{kind:'skipped',note:v.note,result}:v.action==='MANUAL'||step.mode==='manual'?{kind:'manual',note:v.note,result}:{kind:'ai',result,note:v.note};
    if(v.action!=='SKIP'&&!canAdvance(step,record,true))throw new ApiError(422,'CHECK_REQUIRED','Cần kiểm lại ảnh hoặc ghi lý do kiểm tay trước khi chuyển bước.');
    g.records[step.id]={...record,confirmation:{method:v.method,at:new Date().toISOString()}};
    if(g.index===sop.steps.length-1)g.status=Object.values(g.records).some(r=>r.kind==='skipped')?'REVIEW_REQUIRED':'FINISHED';else g.index++;
    g.revision++;g.updatedAt=new Date().toISOString();updateDoc('guidance',id,owner,g,g.status);audit(owner,'GUIDANCE_'+v.action,id);return g;
  });
}
export function saveGuidanceCheck(owner:string,c:CaseRecord,id:string,revision:number,stepId:string,result:CheckpointResult){
  return transaction(()=>{const latest=doc<CaseRecord>('case',c.id,owner);if(!latest)throw missing();const g=ownedGuidance(owner,latest,id,revision),step=guidanceSop(g).steps[g.index];if(g.status!=='ACTIVE'||step.id!==stepId)throw new ApiError(409,'CHECKPOINT_MISMATCH','Bước đã thay đổi khi AI trả kết quả.');g.checks[stepId]=result;g.revision++;g.updatedAt=new Date().toISOString();updateDoc('guidance',id,owner,g,g.status);return g;});
}
export function clearGuidanceCheck(owner:string,c:CaseRecord,id:string,revision:number,stepId:string){
  transaction(()=>{const latest=doc<CaseRecord>('case',c.id,owner);if(!latest)throw missing();const g=ownedGuidance(owner,latest,id,revision);if(g.status!=='ACTIVE'||guidanceSop(g).steps[g.index]?.id!==stepId)throw new ApiError(409,'CHECKPOINT_MISMATCH','Bước đã thay đổi.');delete g.checks[stepId];updateDoc('guidance',id,owner,g,g.status);});
}
