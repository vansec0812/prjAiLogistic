import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { AlternativeId, CaseRecord, MvpBundle, MvpConfig, MvpSelection, MvpPostCheck } from '@plantcare/domain';
import { inferJourney, proposeMvp } from '../../../../packages/rule-engine/src/mvp';
import { defaultMvpConfig } from '../lib/mvp-config';
import { proposePackingDemo, demoPhotoByPath, packingDemoSource } from '../lib/demo-packing';
import { doc, docs, insertDoc, updateDoc, audit, development } from './db';
import { ApiError, inputHash } from './security';
import type { GuidanceSession } from '../lib/guidance';
import type { LiveSop, LiveStep, CheckpointResult } from '../lib/live-packing';

export const configOwner='plantcare-system';
export function mvpConfigs(){return [defaultMvpConfig,...docs<MvpConfig>('mvp-config')].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
export function activeMvpConfig(){const active=doc<{version:string}>('mvp-active','current');return mvpConfigs().find(c=>c.version===active?.version)||defaultMvpConfig;}
export function propose(owner:string,c:CaseRecord,demo=false){
  if(['PACKED','SHIPPED','RECEIVED'].includes(c.status))throw new ApiError(409,'CASE_COMPLETED','Hồ sơ đã hoàn tất. Tạo bản nháp mới.');
  if(demo&&!development())throw new ApiError(409,'DEMO_LOCAL_ONLY','Bộ ảnh demo chỉ dùng trong chế độ phát triển.');
  if(demo&&selectionFor(owner,c)?.started)throw new ApiError(409,'PACKING_STARTED','Kết thúc phiên hiện tại trước khi tạo bộ demo mới.');
  const config=activeMvpConfig(),proposal=demo?proposePackingDemo(c.input,config.confidenceThreshold):proposeMvp(c.input,config,development());
  const bundle:MvpBundle={...proposal,confidenceThreshold:config.confidenceThreshold,id:randomUUID(),caseId:c.id,inputHash:inputHash(c.input),createdAt:new Date().toISOString()};
  insertDoc('mvp-bundle',bundle.id,owner,bundle,bundle.outcome);const status=bundle.outcome==='READY'?'PLAN_READY':bundle.outcome==='NEED_INPUT'?'NEEDS_INPUT':'NEEDS_EXPERT';updateDoc('case',c.id,owner,{...c,flow:'MVP',status},status);audit(owner,bundle.outcome==='NEED_INPUT'?'MVP_NEED_INPUT':'MVP_PROPOSED',bundle.id);return bundle;
}
export function bundleFor(owner:string,c:CaseRecord,id:string,allowCompleted=false){
  const b=doc<MvpBundle>('mvp-bundle',id,owner);if(!b||b.caseId!==c.id)throw new ApiError(404,'NOT_FOUND','Không tìm thấy phương án.');
  if(b.inputHash!==inputHash(c.input))throw new ApiError(409,'PLAN_STALE','Thông tin đã đổi. Tạo lại hai phương án.');
  if(!allowCompleted&&['PACKED','SHIPPED','RECEIVED'].includes(c.status))throw new ApiError(409,'CASE_COMPLETED','Hồ sơ đã hoàn tất.');
  return b;
}
export function selectionFor(owner:string,c:CaseRecord){return doc<MvpSelection>('mvp-selection',c.id,owner);}
export function selectMvp(owner:string,c:CaseRecord,bundleId:string,alternativeId:AlternativeId,revision:number){
  const b=bundleFor(owner,c,bundleId),old=selectionFor(owner,c);
  if(old&&old.revision!==revision||!old&&revision!==0)throw new ApiError(409,'VERSION_CONFLICT','Lựa chọn đã đổi. Tải lại phương án.');
  if(old?.started&&old.bundleId===b.id)throw new ApiError(409,'PACKING_STARTED','Đã bắt đầu đóng gói. Kết thúc phiên hiện tại trước khi đổi phương án.');
  if(b.outcome!=='READY'||!b.alternatives.some(a=>a.id===alternativeId)||!development()&&b.developmentOnly)throw new ApiError(422,'PLAN_INELIGIBLE','Phương án chưa đủ điều kiện áp dụng.');
  const selection:MvpSelection={id:c.id,caseId:c.id,bundleId:b.id,alternativeId,revision:(old?.revision||0)+1,started:false};
  if(old)updateDoc('mvp-selection',c.id,owner,selection);else insertDoc('mvp-selection',c.id,owner,selection);
  updateDoc('case',c.id,owner,{...c,status:'PLAN_READY',selectedVersion:b.id},'PLAN_READY');audit(owner,'MVP_SELECTED',b.id);return selection;
}
export function selectedMvp(owner:string,c:CaseRecord,allowCompleted=false){const s=selectionFor(owner,c);if(!s)throw new ApiError(422,'SELECTION_REQUIRED','Chọn một phương án trước.');const b=bundleFor(owner,c,s.bundleId,allowCompleted),a=b.alternatives.find(a=>a.id===s.alternativeId);if(!a)throw new ApiError(409,'SELECTION_CHANGED','Phương án không còn khớp.');return {s,b,a};}
export function mvpSop(owner:string,c:CaseRecord):LiveSop{
  const {b,a}=selectedMvp(owner,c,true);const review=mvpConfigs().find(x=>x.version===b.configVersion)?.expertReview;
  const source=b.demo?packingDemoSource:'PRD-MVP-20261019';
  return {id:'mvp-'+b.id+'-'+a.id,plant:'potted',shipping_form:'POTTED',title:a.title,version:b.configVersion,status:b.developmentOnly?'DRAFT':'PUBLISHED',published:!b.developmentOnly,production_enabled:!b.developmentOnly,reviewer:review?.by||null,approved_at:review?.at||null,validation_status:b.developmentOnly?'NOT_EVALUATED':'EXPERT_REVIEWED',completeness:b.demo?'User supplied photo demonstration':'PRD fixed selected alternative',supersedes_research:'',source_ids:[source],scope:b.demo?'Demo theo ảnh mẫu người dùng cung cấp':'Một cây nguyên chậu theo nhóm đã xác nhận',limits:null,steps:a.steps.map(s=>{
    const photo=b.demo?demoPhotoByPath.get(s.image):undefined;
    return {id:s.id,title:s.title,instruction:s.instruction,speech_vi:s.speech,manual:s.manual,image:s.image,...(photo?{reference_image:{path:photo.image,sha256:photo.sha256}}:{}),source_id:source,source_locator:photo?.source||'Tính năng 5–8; mẫu cấu hình '+b.configVersion,mode:s.mode,camera_prompt_vi:'Đưa vùng đang đóng gói vào camera, giữ máy đủ sáng và rõ.',criteria:s.criteria,unverifiable:['Độ chắc, kích thước và phần bị che kín phải kiểm tra trực tiếp.'],remedy_vi:s.remedy,criterion_origin:b.configVersion};
  })};
}
export function newPostCheck(owner:string,c:CaseRecord,g:GuidanceSession){
  const {s,b,a}=selectedMvp(owner,c,true);if(g.bundleId!==b.id||g.alternativeId!==s.alternativeId||g.status!=='FINISHED')throw new ApiError(409,'GUIDANCE_INCOMPLETE','Hoàn tất đủ các bước trước khi hậu kiểm.');
  const old=doc<MvpPostCheck>('mvp-postcheck',g.id,owner);if(old)return old;
  const fixation={id:'fixation',title:'Chậu cố định, không xê dịch',remedy:'Mở kiện và kiểm tra độ cố định bằng tay.'};
  const items=b.demo?[fixation,...a.steps.filter(x=>!['fix','tube'].includes(x.id)).map(x=>({id:x.id,title:x.title,remedy:x.remedy}))]:[fixation,...(s.alternativeId==='PA1'?[{id:'padding',title:'Chèn đủ quanh chậu',remedy:'Mở thùng, bổ sung vật liệu chèn quanh chậu, không ép tán.'}]:[]),{id:'wrap',title:'Bọc kín và đúng vị trí',remedy:'Kiểm tra lại vật liệu bọc giữ đất quanh miệng chậu.'},{id:'closure',title:'Dán kín thùng và nhãn dễ vỡ',remedy:'Dán lại các mép hở và bổ sung nhãn hướng kiện.'}];
  const p:MvpPostCheck={id:g.id,caseId:c.id,bundleId:b.id,alternativeId:s.alternativeId,guidanceId:g.id,revision:1,items:items.map(i=>({...i,status:'unverifiable',reason:'Chưa kiểm tra.',source:'PENDING'})),completedAt:null,updatedAt:new Date().toISOString()};insertDoc('mvp-postcheck',p.id,owner,p);return p;
}
export function postCheckStep(p:MvpPostCheck):LiveStep{return {id:'postcheck',title:'Hậu kiểm kiện',instruction:'Kiểm các phần nhìn thấy của kiện sau đóng gói.',speech_vi:'Kiểm tra kiện sau đóng gói.',manual:'Độ cố định và các phần kín phải mở kiểm trực tiếp.',source_id:'PRD-MVP-20261019',source_locator:'Tính năng 8',mode:'visual',camera_prompt_vi:'Chụp rõ kiện, băng keo và nhãn.',criteria:p.items.map(i=>({id:i.id,visible_pass:i.id==='fixation'?'Không thể xác minh độ cố định chỉ bằng ảnh.':i.title,visible_fail:'Chỉ báo lỗi khi nhìn thấy rõ: '+i.remedy})),unverifiable:['Độ chắc bên trong và phần bị che khuất luôn cần kiểm tay.'],remedy_vi:'Chụp lại phần cần kiểm, hoặc mở kiện để kiểm trực tiếp.',criterion_origin:'PRD-MVP-20261019'};}
export function savePostCheckAi(owner:string,c:CaseRecord,g:GuidanceSession,expected:number,result:CheckpointResult){
  const p=newPostCheck(owner,c,g);if(p.revision!==expected||p.completedAt)throw new ApiError(409,'VERSION_CONFLICT','Kết quả hậu kiểm đã thay đổi.');
  p.items=p.items.map(item=>{const r=result.criterion_results.find(r=>r.criterion_id===item.id)!;return {...item,status:item.id==='fixation'?'unverifiable':r.status,reason:item.id==='fixation'?'Cần kiểm trực tiếp bằng tay; ảnh không chứng minh chậu không xê dịch.':r.observation,source:'AI'};});p.revision++;p.updatedAt=new Date().toISOString();updateDoc('mvp-postcheck',p.id,owner,p);audit(owner,'MVP_POSTCHECK_AI',p.id);return p;
}
export function journeyContext(origin:string,destination:string,departure:string,channel:string){return inferJourney(origin,destination,departure,channel,activeMvpConfig());}

const localImage=z.string().max(300).refine(x=>/^\/(?:illustrations|photos)\/[a-zA-Z0-9._/-]+$/.test(x)&&!x.includes('..'),'Dùng ảnh trong thư viện đã kiểm tra.');
const stepSchema=z.object({id:z.string().regex(/^[a-z0-9-]{1,40}$/),title:z.string().min(2).max(100),instruction:z.string().min(10).max(1200),speech:z.string().min(10).max(1200),manual:z.string().min(5).max(500),remedy:z.string().min(5).max(500),image:localImage,mode:z.enum(['manual','visual']),criteria:z.array(z.object({id:z.string().max(80),visible_pass:z.string().min(5).max(500),visible_fail:z.string().min(5).max(500)}).strict()).max(10)}).strict().refine(s=>(s.mode==='visual')===(s.criteria.length>0));
export const configContentSchema=z.object({confidenceThreshold:z.number().min(0).max(100),groups:z.array(z.enum(['FOLIAGE','FLOWERING','SUCCULENT'])).min(1),plants:z.array(z.object({name:z.string().min(2).max(100),group:z.enum(['FOLIAGE','FLOWERING','SUCCULENT']),fragility:z.enum(['LOW','MEDIUM','HIGH']),thorns:z.boolean(),lightSensitive:z.boolean()}).strict()).max(500),limits:z.object({potBands:z.array(z.number().positive()).length(4),weightBands:z.array(z.number().positive()).length(4),minTemp:z.number().min(-80).max(80),maxTemp:z.number().min(-80).max(80),maxDuration:z.number().positive().max(720),costMaxWeight:z.number().positive(),costMaxPot:z.number().positive(),costMaxDuration:z.number().positive()}).strict(),channels:z.array(z.object({id:z.enum(['SHOPEE','TIKTOK','DIRECT','OTHER']),label:z.string().min(2).max(80),nearHours:z.number().positive().max(720),farHours:z.number().positive().max(720)}).strict()).length(4),seasons:z.array(z.object({months:z.array(z.number().int().min(1).max(12)).min(1),minTemp:z.number().min(-80).max(80),maxTemp:z.number().min(-80).max(80),label:z.string().min(5).max(200)}).strict()).min(1).max(12),materials:z.array(z.object({id:z.string().regex(/^[a-z0-9-]{1,40}$/),name:z.string().min(2).max(120),unit:z.string().min(1).max(40),price:z.number().min(0).max(1e9).nullable(),image:localImage,active:z.boolean()}).strict()).min(1).max(100),alternatives:z.array(z.object({id:z.enum(['PA1','PA2']),title:z.string().min(2).max(100),description:z.string().min(5).max(500),bom:z.array(z.object({materialId:z.string(),quantity:z.number().positive().max(10000)}).strict()).min(1).max(30),steps:z.array(stepSchema).min(4).max(8)}).strict()).length(2)}).strict().superRefine((c,ctx)=>{
  const unique=(items:string[])=>new Set(items).size===items.length;
  if(!unique(c.materials.map(m=>m.id))||!unique(c.alternatives.map(a=>a.id))||!unique(c.channels.map(a=>a.id))||c.limits.minTemp>c.limits.maxTemp||[c.limits.potBands,c.limits.weightBands].some(ns=>ns.some((n,i)=>i>0&&n<=ns[i-1])))ctx.addIssue({code:'custom',message:'Mã trùng hoặc khoảng ngưỡng không hợp lệ.'});
  for(const a of c.alternatives)if(!unique(a.bom.map(b=>b.materialId))||!unique(a.steps.map(s=>s.id))||a.bom.some(b=>!c.materials.some(m=>m.id===b.materialId))||!['fix','wrap','tape','label'].every(id=>a.bom.some(b=>b.materialId===id))||a.id==='PA1'&&!a.bom.some(b=>b.materialId==='padding')||!['fix','wrap','close'].every(id=>a.steps.some(s=>s.id===id))||a.id==='PA1'&&!a.steps.some(s=>s.id==='padding'))ctx.addIssue({code:'custom',message:'Thiếu vật tư hoặc bước bắt buộc của phương án.'});
  const months=c.seasons.flatMap(s=>s.months);if(months.length!==12||new Set(months).size!==12||c.seasons.some(s=>s.minTemp>s.maxTemp))ctx.addIssue({code:'custom',message:'Giả định mùa cần đủ 12 tháng không trùng.'});
});
