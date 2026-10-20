import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { CaseRecord } from '@plantcare/domain';
import type { GuidanceSession } from '../lib/guidance';
import { canAdvance, contextIssues, contextSchema, sopCatalog, type StepRecord, type CheckpointResult } from '../lib/live-packing';
import { docs, doc, insertDoc, updateDoc, transaction, development, audit } from './db';
import { ApiError, inputHash } from './security';
import { parse } from './schemas';
import { plantProfileIssues } from '../lib/plant-recognition';
import { selectedMvp, mvpSop, selectionFor, mvpConfigs } from './mvp';

const missing=()=>new ApiError(404,'NOT_FOUND','Không tìm thấy phiên hướng dẫn.');
export function assertGuidanceCase(c:CaseRecord,mode:'TRIAL'|'REFERENCE'|'MVP'='TRIAL'){
  if(['DELETED','PACKED','SHIPPED','RECEIVED'].includes(c.status))throw new ApiError(409,'CASE_COMPLETED','Hồ sơ đã kết thúc. Tạo hồ sơ mới để hướng dẫn.');
  if(mode!=='MVP'&&!development()&&!(mode==='REFERENCE'&&process.env.PLANTCARE_REFERENCE_GUIDE_ENABLED==='true'))throw new ApiError(409,'SOP_NOT_APPROVED','Chưa bật trợ lý hướng dẫn. Liên hệ người quản lý.');
}
export function guidanceSop(g:GuidanceSession){const sop=g.mode==='MVP'?g.boundSop:sopCatalog.sops.find(s=>s.id===g.sopId&&s.version===g.sopVersion);if(!sop)throw new ApiError(409,'SOP_VERSION_MISMATCH','SOP đã thay đổi. Tạo phiên mới để giữ lịch sử.');return sop;}
export function ownedGuidance(owner:string,c:CaseRecord,id:string,revision?:number){
  const g=doc<GuidanceSession>('guidance',id,owner);if(!g||g.caseId!==c.id)throw missing();assertGuidanceCase(c,g.mode);
  if(g.inputHash!==inputHash(c.input))throw new ApiError(409,'GUIDANCE_STALE','Đầu vào hồ sơ đã thay đổi. Tạo phiên hướng dẫn mới.');
  if(g.mode==='MVP'){const {s,b}=selectedMvp(owner,c);if(s.bundleId!==g.bundleId||s.alternativeId!==g.alternativeId||!development()&&b.developmentOnly)throw new ApiError(409,'SELECTION_CHANGED','Phiên không còn thuộc phương án đã chọn.');}
  if(revision!==undefined&&g.revision!==revision)throw new ApiError(409,'VERSION_CONFLICT','Phiên đã thay đổi ở nơi khác. Tải lại tiến độ.');
  guidanceSop(g);return g;
}
export function listGuidance(owner:string,c:CaseRecord){const s=selectionFor(owner,c);return docs<GuidanceSession>('guidance',owner).filter(g=>g.caseId===c.id).map(g=>({...g,stale:g.inputHash!==inputHash(c.input)||(g.mode==='MVP'?g.bundleId!==s?.bundleId||g.alternativeId!==s?.alternativeId||g.executionState==='ENDED':!sopCatalog.sops.some(s=>s.id===g.sopId&&s.version===g.sopVersion))}));}
export function startGuidance(owner:string,c:CaseRecord,value:unknown){
  const current=doc<CaseRecord>('case',c.id,owner);if(!current)throw missing();c=current;
  if((value as {mode?:string})?.mode==='MVP'){
    const v=parse(z.object({case_version:z.number().int().positive(),mode:z.literal('MVP'),bundle_id:z.string(),alternative_id:z.enum(['PA1','PA2'])}).strict(),value),{s,b}=selectedMvp(owner,c);assertGuidanceCase(c,'MVP');
    if(c.version!==v.case_version||s.bundleId!==v.bundle_id||s.alternativeId!==v.alternative_id)throw new ApiError(409,'SELECTION_CHANGED','Dữ liệu hoặc lựa chọn vừa thay đổi.');
    if(!development()&&b.developmentOnly)throw new ApiError(409,'SOP_NOT_APPROVED','Quy tắc chưa được chuyên gia duyệt.');
    const existing=listGuidance(owner,c).find(g=>g.mode==='MVP'&&!g.stale&&['ACTIVE','FINISHED'].includes(g.status));if(existing)return existing;
    const sop=mvpSop(owner,c),now=new Date().toISOString(),g:GuidanceSession={id:randomUUID(),caseId:c.id,inputHash:b.inputHash,sopId:sop.id,sopVersion:sop.version,context:{species:c.input.plant.name,shop_scope_confirmed:true,pot_cm:c.input.plant.potDiameter,height_cm:c.input.plant.height,packed_kg:null},mode:'MVP',bundleId:b.id,alternativeId:s.alternativeId,boundSop:sop,confidenceThreshold:b.confidenceThreshold??mvpConfigs().find(x=>x.version===b.configVersion)?.confidenceThreshold??70,executionState:'READY',revision:1,index:0,status:'ACTIVE',records:{},checks:{},createdAt:now,updatedAt:now};insertDoc('guidance',g.id,owner,g,'ACTIVE');audit(owner,'GUIDANCE_READY',g.id);return g;
  }
  const v=parse(z.object({case_version:z.number().int().positive(),sop_id:z.string(),sop_version:z.string(),context:contextSchema,approved_for_trial:z.literal(true).optional(),mode:z.enum(['TRIAL','REFERENCE']).default('TRIAL'),reference_ack:z.literal(true).optional()}).strict(),value);assertGuidanceCase(c,v.mode);
  if(v.mode==='TRIAL'&&!v.approved_for_trial||v.mode==='REFERENCE'&&!v.reference_ack)throw new ApiError(422,'GUIDANCE_ACK_REQUIRED','Xem hướng dẫn trước khi bắt đầu.');
  if(v.mode==='REFERENCE'&&(plantProfileIssues(c.input.plant).length||v.context.species!==c.input.plant.name||v.context.pot_cm!==c.input.plant.potDiameter||v.context.height_cm!==c.input.plant.height))throw new ApiError(422,'PLANT_CONFIRMATION_REQUIRED','Kiểm tra và xác nhận thông tin cây trước khi bắt đầu.');
  if(c.version!==v.case_version)throw new ApiError(409,'VERSION_CONFLICT','Hồ sơ vừa được sửa, tải lại dữ liệu.');
  const sop=sopCatalog.sops.find(s=>s.id===v.sop_id&&s.version===v.sop_version);if(!sop)throw new ApiError(409,'SOP_VERSION_MISMATCH','SOP đã đổi.');
  if(contextIssues(sop,v.context).length)throw new ApiError(422,'SOP_SCOPE_MISMATCH','Thiếu dữ liệu hoặc ngoài phạm vi SOP.');
  const now=new Date().toISOString();const g:GuidanceSession={id:randomUUID(),caseId:c.id,inputHash:inputHash(c.input),sopId:sop.id,sopVersion:sop.version,context:v.context,mode:v.mode,revision:1,index:0,status:'ACTIVE',records:{},checks:{},createdAt:now,updatedAt:now};
  insertDoc('guidance',g.id,owner,g,'ACTIVE');audit(owner,'GUIDANCE_STARTED',g.id);return g;
}
export function advanceGuidance(owner:string,c:CaseRecord,id:string,value:unknown){
  const v=parse(z.object({expected_revision:z.number().int().positive(),step_id:z.string(),action:z.enum(['CONFIRM','MANUAL','SKIP','REPORT_ISSUE','RESOLVE_ISSUE']),method:z.enum(['BUTTON','VOICE']),manual_checked:z.boolean().optional(),note:z.string().max(500).default('')}).strict(),value);
  return transaction(()=>{
    const currentCase=doc<CaseRecord>('case',c.id,owner);if(!currentCase)throw missing();
    const g=ownedGuidance(owner,currentCase,id,v.expected_revision),sop=guidanceSop(g),step=sop.steps[g.index];
    if(g.mode==='MVP'&&g.executionState!=='RUNNING')throw new ApiError(409,'SESSION_PAUSED','Bấm Bắt đầu hoặc Tiếp tục phiên trước.');
    if(g.status!=='ACTIVE'||!step||step.id!==v.step_id)throw new ApiError(409,'CHECKPOINT_MISMATCH','Lời xác nhận không còn thuộc bước hiện tại.');
    if(v.action==='REPORT_ISSUE'||v.action==='RESOLVE_ISSUE'){
      if(v.action==='REPORT_ISSUE'){g.currentIssue={stepId:step.id,note:v.note||'Người dùng báo lỗi ở bước hiện tại.',at:new Date().toISOString()};delete g.checks[step.id];}
      else {if(step.mode==='visual'&&g.checks[step.id]?.status!=='passed')throw new ApiError(422,'CHECK_REQUIRED','Kiểm tra lại ảnh sau khi sửa lỗi.');delete g.currentIssue;}
      g.revision++;g.updatedAt=new Date().toISOString();updateDoc('guidance',id,owner,g,g.status);audit(owner,'GUIDANCE_'+v.action,id);return g;
    }
    if(!v.manual_checked)throw new ApiError(422,'MANUAL_CHECK_REQUIRED','Xác nhận kiểm tra thực tế trước khi chuyển bước.');
    if(g.currentIssue&&g.checks[step.id]?.status!=='passed'&&!(v.action==='MANUAL'&&v.note.trim().length>=10)&&v.action!=='SKIP')throw new ApiError(409,'ISSUE_UNRESOLVED','Xử lý lỗi ở bước hiện tại trước khi tiếp tục.');
    const result=g.checks[step.id];const record:StepRecord=v.action==='SKIP'?{kind:'skipped',note:v.note,result}:v.action==='MANUAL'||step.mode==='manual'?{kind:'manual',note:v.note,result}:{kind:'ai',result,note:v.note};
    if(v.action!=='SKIP'&&!canAdvance(step,record,true))throw new ApiError(422,'CHECK_REQUIRED','Cần kiểm lại ảnh hoặc ghi lý do kiểm tay trước khi chuyển bước.');
    g.records[step.id]={...record,confirmation:{method:v.method,at:new Date().toISOString()}};
    delete g.currentIssue;
    if(g.index===sop.steps.length-1)g.status=Object.values(g.records).some(r=>r.kind==='skipped')?'REVIEW_REQUIRED':'FINISHED';else g.index++;
    if(g.mode==='MVP'&&g.status==='REVIEW_REQUIRED'){g.executionState='ENDED';const s=selectionFor(owner,currentCase)!;s.started=false;s.revision++;updateDoc('mvp-selection',c.id,owner,s);updateDoc('case',c.id,owner,{...currentCase,status:'PLAN_READY'},'PLAN_READY');}
    g.revision++;g.updatedAt=new Date().toISOString();updateDoc('guidance',id,owner,g,g.status);audit(owner,'GUIDANCE_'+v.action,id);return g;
  });
}
export function saveGuidanceCheck(owner:string,c:CaseRecord,id:string,revision:number,stepId:string,result:CheckpointResult){
  return transaction(()=>{const latest=doc<CaseRecord>('case',c.id,owner);if(!latest)throw missing();const g=ownedGuidance(owner,latest,id,revision),step=guidanceSop(g).steps[g.index];if(g.status!=='ACTIVE'||step.id!==stepId)throw new ApiError(409,'CHECKPOINT_MISMATCH','Bước đã thay đổi khi AI trả kết quả.');g.checks[stepId]=result;if(result.status!=='passed')audit(owner,'GUIDANCE_WARNING_'+result.status,id);g.revision++;g.updatedAt=new Date().toISOString();updateDoc('guidance',id,owner,g,g.status);return g;});
}
export function controlGuidance(owner:string,c:CaseRecord,id:string,value:unknown){
  const v=parse(z.object({expected_revision:z.number().int().positive(),action:z.enum(['BEGIN','PAUSE','RESUME','END'])}).strict(),value);
  return transaction(()=>{const current=doc<CaseRecord>('case',c.id,owner);if(!current)throw missing();const g=ownedGuidance(owner,current,id,v.expected_revision);if(g.mode!=='MVP'||g.status!=='ACTIVE')throw new ApiError(409,'INVALID_TRANSITION','Phiên không còn hoạt động.');
    const state=g.executionState;
    if(v.action==='BEGIN'&&state!=='READY'||v.action==='PAUSE'&&state!=='RUNNING'||v.action==='RESUME'&&state!=='PAUSED'||state==='ENDED')throw new ApiError(409,'INVALID_TRANSITION','Trạng thái phiên đã đổi.');
    g.executionState=v.action==='END'?'ENDED':v.action==='PAUSE'?'PAUSED':'RUNNING';if(v.action==='END')g.status='REVIEW_REQUIRED';
    const s=selectionFor(owner,current)!;s.started=v.action!=='END';s.revision++;updateDoc('mvp-selection',current.id,owner,s);g.revision++;g.updatedAt=new Date().toISOString();updateDoc('guidance',id,owner,g,g.status);updateDoc('case',c.id,owner,{...current,status:v.action==='END'?'PLAN_READY':'PACKING'},v.action==='END'?'PLAN_READY':'PACKING');audit(owner,'GUIDANCE_'+v.action,id);return g;});
}
export function clearGuidanceCheck(owner:string,c:CaseRecord,id:string,revision:number,stepId:string){
  transaction(()=>{const latest=doc<CaseRecord>('case',c.id,owner);if(!latest)throw missing();const g=ownedGuidance(owner,latest,id,revision);if(g.status!=='ACTIVE'||guidanceSop(g).steps[g.index]?.id!==stepId)throw new ApiError(409,'CHECKPOINT_MISMATCH','Bước đã thay đổi.');delete g.checks[stepId];updateDoc('guidance',id,owner,g,g.status);});
}
