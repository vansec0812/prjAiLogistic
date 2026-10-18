import { NextRequest, NextResponse } from 'next/server';
import { checkLivePacking } from './live-packing';
import { listGuidance, startGuidance, advanceGuidance } from './guidance';
import { vietnameseTts } from './vietnamese-tts';
import { randomUUID, randomBytes } from 'node:crypto';
import { compareSync, hashSync } from 'bcryptjs';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import path from 'node:path';
import sharp, { type Metadata } from 'sharp';
import Decimal from 'decimal.js';
import { z } from 'zod';
import type { CaseRecord, PlanVersion, MaterialInput, CaseInput } from '@plantcare/domain';
import { emptyInput, getReadiness } from '@plantcare/domain';
import { db, transaction, doc, docs, insertDoc, updateDoc, audit, development, dataDir } from './db';
import { ApiError, requireUser, session, checkOrigin, checkMutation, issueSession, sha, inputHash, otpHash, newOtp, equalHash, rateLimit, type User } from './security';
import { parse, registerSchema, inputSchema } from './schemas';
import { demoUser, sampleInput } from './seed';
import { createJob, wakeWorker, type Job, type Upload } from './jobs';
import { draftRulePack } from '@plantcare/rule-engine';
import { retrieveKnowledge, KNOWLEDGE_VERSION, sources as knowledgeSources } from '../../../../packages/knowledge/src/index';
import { exportMetadata } from './export';

interface Inventory extends MaterialInput {stock:number;version:number;updatedAt:string;}
interface Challenge {id:string;user_id:string;purpose:string;code_hash:string;expires_at:number;attempts:number;used:number;sent_at:number;}
const missing=()=>new ApiError(404,'NOT_FOUND','Không tìm thấy dữ liệu hoặc liên kết đã hết hạn.');
function owned<T>(kind:string,id:string,owner:string){const value=doc<T>(kind,id,owner);if(!value)throw missing();return value;}
function success(data:unknown,status=200){const res=NextResponse.json({data,meta:{request_id:randomUUID()}},{status});res.headers.set('Cache-Control','no-store');return res;}
async function body(req:NextRequest){try{return await req.json();}catch{throw new ApiError(422,'INVALID_JSON','Dữ liệu gửi lên chưa hợp lệ.');}}
function idempotent<T>(req:NextRequest,owner:string,endpoint:string,value:unknown,fn:()=>T):T{
  const key=req.headers.get('idempotency-key');if(!key||key.length>128)throw new ApiError(422,'IDEMPOTENCY_REQUIRED','Cần khóa xác nhận thao tác.');
  const hash=inputHash(value);return transaction(()=>{
    const old=db().prepare('SELECT request_hash,response FROM idempotency WHERE owner_id=? AND endpoint=? AND key=?').get(owner,endpoint,key) as {request_hash:string;response:string}|undefined;
    if(old){if(old.request_hash!==hash)throw new ApiError(409,'IDEMPOTENCY_CONFLICT','Khóa thao tác đã được dùng với dữ liệu khác.');return JSON.parse(old.response) as T;}
    const result=fn();db().prepare('INSERT INTO idempotency VALUES(?,?,?,?,?)').run(owner,endpoint,key,hash,JSON.stringify(result));return result;
  });
}
function versionWithStale(v:PlanVersion,owner:string):PlanVersion{const c=doc<CaseRecord>('case',v.caseId,owner);return {...v,stale:!c||inputHash(c.input)!==v.inputHash};}
function eligible(c:CaseRecord,v:PlanVersion){
  if(['PACKED','SHIPPED','RECEIVED'].includes(c.status))throw new ApiError(409,'CASE_COMPLETED','Hồ sơ đã hoàn tất. Tạo nháp từ mẫu cho lần đóng gói mới.');
  if(c.id!==v.caseId||inputHash(c.input)!==v.inputHash)throw new ApiError(409,'PLAN_STALE','Dữ liệu đã thay đổi. Tạo phương án mới trước khi đóng gói.');
  if(!['PASS','WARN_ACK'].includes(v.plan.outcome))throw new ApiError(422,'PLAN_INELIGIBLE','Phương án chưa vượt kiểm ràng buộc.');
}
async function challenge(user:User,purpose:string){
  rateLimit('sms:'+sha(user.phone),5,3600000);
  const id=randomUUID(),code=newOtp(),now=Date.now();
  if(!development()&&!process.env.SMS_ADAPTER_URL)throw new ApiError(503,'SMS_UNAVAILABLE','SMS chưa hoạt động. Đăng ký vẫn chờ xác minh.');
  db().prepare('UPDATE challenges SET used=1 WHERE user_id=? AND purpose=?').run(user.id,purpose);
  db().prepare('INSERT INTO challenges VALUES(?,?,?,?,?,0,0,?)').run(id,user.id,purpose,otpHash(id,code),now+300000,now);
  if(!development()){
    const endpoint=process.env.SMS_ADAPTER_URL!;if(!endpoint.startsWith('https://'))throw new ApiError(503,'SMS_CONFIG','SMS chưa hoạt động.');
    const result=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(process.env.SMS_ADAPTER_TOKEN||'')},body:JSON.stringify({phone:user.phone,code,purpose,request_id:id}),signal:AbortSignal.timeout(10000)});
    if(!result.ok)throw new ApiError(503,'SMS_UNAVAILABLE','SMS tạm lỗi. Thử lại sau.');
  }
  return {challenge_id:id,expires_in:300,resend_after:60,purpose,...(development()?{development_code:code,development_notice:'Mã thử nghiệm local, không gửi SMS thật'}:{})};
}
function verify(id:string,code:string,purpose:string){
  const c=db().prepare('SELECT * FROM challenges WHERE id=?').get(id) as unknown as Challenge|undefined;
  if(!c||c.used||c.purpose!==purpose||c.expires_at<Date.now()||c.attempts>=5)throw new ApiError(422,'OTP_INVALID','Mã không hợp lệ hoặc đã hết hạn.');
  db().prepare('UPDATE challenges SET attempts=attempts+1 WHERE id=?').run(id);
  if(!equalHash(c.code_hash,otpHash(id,code)))throw new ApiError(422,'OTP_INVALID','Mã không hợp lệ hoặc đã hết hạn.');
  db().prepare('UPDATE challenges SET used=1 WHERE id=? AND used=0').run(id);
  return db().prepare('SELECT id,username,phone,name,status,role FROM users WHERE id=?').get(c.user_id) as unknown as User;
}
const articles=[
  {id:'measure',slug:'cach-do-cay-va-chau',title:'Đo đúng, đóng gói phù hợp',category:'Chuẩn bị',description:'Sáu thông số cần xác nhận trước khi chọn hộp.',body:['Đo chiều cao tổng bao gồm chậu, chiều dài và chiều rộng tán trong tư thế vận chuyển dự kiến.','Đo đường kính (hoặc dài/rộng) và chiều cao chậu. Cân cả cây, chậu và đất.','Số đo từ ảnh đơn lẻ không thay thế đo/cân thực tế. Lưu nháp nếu chưa có dụng cụ đo.'],illustration:'/illustrations/step-1.svg'},
  {id:'box',slug:'kiem-tra-hop',title:'Chiếc hộp vừa vặn cho cây',category:'Vật tư',description:'Kích thước trong hộp và tải trọng là hai kiểm tra riêng.',body:['Đo khoảng trống bên trong hộp. Kích thước ngoài không chứng minh cây vừa hộp.','Tải trọng cần thông số vật tư đã kiểm hoặc nguồn phù hợp. Tính cả khối lượng cây/chậu và vật tư.','Hộp cũ cần kiểm tra tình trạng. Không ép hoặc gập cây để làm vừa hộp.'],illustration:'/illustrations/step-4.svg'},
  {id:'context',slug:'hieu-boi-canh-hanh-trinh',title:'Hiểu bối cảnh hành trình',category:'Hành trình',description:'Lưu nguồn, thời điểm và phạm vi của dữ liệu thời tiết.',body:['Nhiệt độ ngoài trời không phải nhiệt độ bên trong kiện.','Không biết tuyến thực thì không tuyên bố dự báo đã phủ toàn hành trình.','Thiếu dữ liệu hoặc nhóm cây chưa có quy tắc chuyên môn cần hỏi thêm hoặc chuyển chuyên gia.'],illustration:'/illustrations/step-6.svg'}
];

export async function handle(req:NextRequest,parts:string[]):Promise<NextResponse>{
  try{return await route(req,parts);}catch(error){
    const e=error instanceof ApiError?error:new ApiError(500,'INTERNAL_ERROR','Không thể xử lý lúc này. Dữ liệu đã lưu vẫn được giữ.');
    if(!(error instanceof ApiError))console.error(JSON.stringify({event:'api_error',request_id:randomUUID(),type:error instanceof Error?error.name:'Unknown'}));
    const res=NextResponse.json({error:{code:e.code,message:e.message,...(e.fields?{field_errors:e.fields}:{}),...(e.status===429?{retry_after:60}:{})},request_id:randomUUID()},{status:e.status});res.headers.set('Cache-Control','no-store');if(e.status===429)res.headers.set('Retry-After','60');return res;
  }
}
async function route(req:NextRequest,parts:string[]):Promise<NextResponse>{
  const method=req.method,endpoint=parts.join('/');
  wakeWorker();
  if(endpoint==='health')return success({status:'ok',mode:development()?'development':'production-gated',aiConfigured:!!(process.env.GEMINI_API_KEY&&process.env.GEMINI_VISION_MODEL),smsConfigured:!!process.env.SMS_ADAPTER_URL});
  if(endpoint==='session'&&method==='GET'){const user=session(req);return success({user:user?{id:user.id,name:user.name,username:user.username,role:user.role}:null,csrf:user?.csrf||null,development:development(),aiConfigured:!!(process.env.GEMINI_API_KEY&&process.env.GEMINI_VISION_MODEL)});}
  if(parts[0]==='articles'&&method==='GET')return success(parts[1]?articles.find(a=>a.slug===parts[1])||null:articles);
  if(parts[0]==='shared'&&method==='GET'){
    const s=db().prepare('SELECT * FROM shares WHERE token_hash=? AND revoked=0 AND expires_at>?').get(sha(parts[1]||''),Date.now()) as {version_id:string;expires_at:number}|undefined;
    if(!s)throw missing();const v=doc<PlanVersion>('plan',s.version_id);if(!v)throw missing();
    const publicPlan=structuredClone(v.plan);if(publicPlan.report)publicPlan.report.materials=publicPlan.report.materials.map(m=>({...m,name:({BOX:'Hộp',PADDING:'Chèn',FIXING:'Cố định',TAPE:'Keo',LABEL:'Nhãn'} as const)[m.category]}));
    return success({id:v.id,caseId:v.caseId,number:v.number,plan:publicPlan,createdAt:v.createdAt,expiresAt:new Date(s.expires_at).toISOString()});
  }
  if(parts[0]==='auth'){
    if(method!=='POST')throw missing();checkOrigin(req);rateLimit('auth-global',100,60000);
    const value=await body(req);
    if(parts[1]==='dev'){
      if(!development())throw missing();return issueSession(demoUser(),{development:true});
    }
    if(parts[1]==='register'){
      const data=parse(registerSchema,value);const old=db().prepare('SELECT * FROM users WHERE username=? OR phone=?').get(data.username,data.phone) as unknown as User|undefined;
      if(old)throw new ApiError(422,'REGISTRATION_UNAVAILABLE','Không thể đăng ký thông tin này. Kiểm tra hoặc dùng khôi phục tài khoản.');
      const user:User={id:randomUUID(),name:data.name,username:data.username,phone:data.phone,status:'PENDING_PHONE',role:'MEMBER'};
      db().prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?,?)').run(user.id,user.username,user.phone,user.name,hashSync(data.password,12),'PENDING_PHONE','MEMBER',new Date().toISOString());
      audit(user.id,'REGISTER_PENDING',user.id);return success(await challenge(user,'REGISTER'),202);
    }
    if(parts[1]==='login'){
      const data=parse(z.object({username:z.string().max(30),password:z.string().max(128)}),value);rateLimit('login:'+sha(data.username),10,900000);
      const user=db().prepare('SELECT * FROM users WHERE username=?').get(data.username) as unknown as User&{password:string}|undefined;
      if(!user||!compareSync(data.password,user.password)||user.status!=='ACTIVE')throw new ApiError(401,'LOGIN_FAILED','Thông tin đăng nhập chưa hợp lệ hoặc tài khoản chưa xác minh.');
      audit(user.id,'LOGIN',user.id);return issueSession(user,{});
    }
    if(parts[1]==='otp'&&parts[2]==='verify'){
      const data=parse(z.object({challenge_id:z.string(),code:z.string().regex(/^\d{6}$/),purpose:z.literal('REGISTER')}),value);
      const user=verify(data.challenge_id,data.code,data.purpose);transaction(()=>{db().prepare("UPDATE users SET status='ACTIVE' WHERE id=? AND status='PENDING_PHONE'").run(user.id);audit(user.id,'PHONE_VERIFIED',user.id);});return issueSession({...user,status:'ACTIVE'},{});
    }
    if(parts[1]==='otp'&&parts[2]==='send'){
      const data=parse(z.object({challenge_id:z.string()}),value);const c=db().prepare('SELECT * FROM challenges WHERE id=?').get(data.challenge_id) as unknown as Challenge|undefined;
      if(!c||c.used||Date.now()-c.sent_at<60000)throw new ApiError(429,'OTP_COOLDOWN','Chờ 60 giây trước khi gửi lại.');
      const u=db().prepare('SELECT * FROM users WHERE id=?').get(c.user_id) as unknown as User;return success(await challenge(u,c.purpose),202);
    }
    if(parts[1]==='password'&&parts[2]==='reset'&&parts[3]==='request'){
      const data=parse(z.object({phone:z.string().max(20)}),value);const u=db().prepare("SELECT * FROM users WHERE phone=? AND status='ACTIVE'").get(data.phone) as unknown as User|undefined;
      return success(u?await challenge(u,'RESET'):{challenge_id:randomUUID(),expires_in:300,resend_after:60,purpose:'RESET'},202);
    }
    if(parts[1]==='password'&&parts[2]==='reset'&&parts[3]==='confirm'){
      const data=parse(z.object({challenge_id:z.string(),code:z.string().regex(/^\d{6}$/),new_password:z.string().min(12).max(128)}),value);const user=verify(data.challenge_id,data.code,'RESET');
      transaction(()=>{db().prepare('UPDATE users SET password=? WHERE id=?').run(hashSync(data.new_password,12),user.id);db().prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);audit(user.id,'PASSWORD_RESET',user.id);});return success({reset:true});
    }
    if(parts[1]==='logout'){
      const user=requireUser(req);checkMutation(req,user);db().prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(req.cookies.get('pc-session')!.value));const res=success({loggedOut:true});res.cookies.delete('pc-session');return res;
    }
    throw missing();
  }
  const user=requireUser(req);if(!['GET','HEAD'].includes(method))checkMutation(req,user);
  if(parts[0]==='knowledge'){
    if(endpoint==='knowledge/sources'&&method==='GET')return success({version:KNOWLEDGE_VERSION,sources:knowledgeSources,trainingStatus:'NOT_FINE_TUNED'});
    if(endpoint==='knowledge/search'&&method==='GET'){const query=(req.nextUrl.searchParams.get('q')||'').slice(0,1000),scope=parse(z.enum(['POTTED_PLANTS','NURSERY','CACTUS','MARITIME']),req.nextUrl.searchParams.get('scope')||'POTTED_PLANTS');return success({version:KNOWLEDGE_VERSION,items:retrieveKnowledge(query,scope),mode:'LOCAL_RETRIEVAL',notice:'Các ghi chú có nguồn, chưa chuyên gia duyệt; không là rule an toàn.'});}
    if(endpoint==='knowledge/answers'&&method==='POST'){
      const value=parse(z.object({question:z.string().trim().min(3).max(1000),consent_id:z.string(),scope:z.enum(['POTTED_PLANTS','NURSERY','CACTUS','MARITIME']).default('POTTED_PLANTS')}).strict(),await body(req));
      const consent=owned<{purpose:string;revoked:boolean}>('consent',value.consent_id,user.id);if(consent.revoked||consent.purpose!=='AI_KNOWLEDGE')throw new ApiError(403,'CONSENT_REQUIRED','Cần đồng ý riêng cho hỏi AI với nguồn.');
      if(!process.env.GEMINI_API_KEY||!process.env.GEMINI_VISION_MODEL)throw new ApiError(503,'AI_UNAVAILABLE','AI chưa được cấu hình. Tra cứu nguồn vẫn dùng được.');
      rateLimit('rag:'+user.id,10,60000);
      const now=new Date().toISOString(),context:CaseRecord={id:'',name:'',version:1,status:'DRAFT',input:emptyInput(),createdAt:now,updatedAt:now,selectedVersion:null,demo:false};
      const job=idempotent(req,user.id,endpoint,value,()=>createJob(user.id,context,'KNOWLEDGE',{question:value.question,consentId:value.consent_id,knowledgeVersion:KNOWLEDGE_VERSION,knowledgeContext:retrieveKnowledge(value.question,value.scope)}));wakeWorker();return success({job_id:job.id},202);
    }
  }
  if(endpoint==='live-packing/check'&&method==='POST')return success(await checkLivePacking(req));
  if(endpoint==='live-packing/speech'&&method==='POST')return success(await vietnameseTts(req));
  if(endpoint==='me'){
    if(method==='GET')return success({id:user.id,name:user.name,username:user.username,phone:user.phone.replace(/.(?=.{3})/g,'•'),role:user.role});
    if(method==='PATCH'){const data=parse(z.object({name:z.string().trim().min(2).max(80)}).strict(),await body(req));db().prepare('UPDATE users SET name=? WHERE id=?').run(data.name,user.id);audit(user.id,'PROFILE_UPDATED',user.id);return success(data);}
  }
  if(endpoint==='me/sessions'&&method==='GET')return success(db().prepare('SELECT created_at,expires_at FROM sessions WHERE user_id=?').all(user.id));
  if(endpoint==='consents'){
    if(method==='GET')return success(docs('consent',user.id));
    if(method==='POST'){const data=parse(z.object({purpose:z.enum(['AI_ANALYSIS','AI_IMAGE','EXPERT_SHARE','AI_KNOWLEDGE']),accepted:z.literal(true)}),await body(req));const id=randomUUID();const consent={id,purpose:data.purpose,noticeVersion:'local-v2',acceptedAt:new Date().toISOString(),revoked:false};insertDoc('consent',id,user.id,consent);audit(user.id,'CONSENT_GRANTED',id);return success(consent,201);}
  }
  if(parts[0]==='consents'&&method==='DELETE'){const c=owned<Record<string,unknown>>('consent',parts[1],user.id);updateDoc('consent',parts[1],user.id,{...c,revoked:true,revokedAt:new Date().toISOString()});audit(user.id,'CONSENT_REVOKED',parts[1]);return success({revoked:true});}
  if(parts[0]==='cases'){
    if(parts.length===1){
      if(method==='GET'){
        const q=(req.nextUrl.searchParams.get('q')||'').toLowerCase(),state=req.nextUrl.searchParams.get('status');
        const all=docs<CaseRecord>('case',user.id).filter(c=>c.status!=='DELETED'&&(!q||c.name.toLowerCase().includes(q))&&(!state||c.status===state));
        const cursor=Number(req.nextUrl.searchParams.get('cursor')||0),size=Math.min(100,Math.max(1,Number(req.nextUrl.searchParams.get('page_size')||20)));
        return success({items:all.slice(cursor,cursor+size),total:all.length,nextCursor:cursor+size<all.length?cursor+size:null});
      }
      if(method==='POST'){
        const data=parse(z.object({name:z.string().trim().min(2).max(120),sample:z.boolean().optional()}),await body(req));const id=randomUUID(),now=new Date().toISOString();
        const c:CaseRecord={id,name:data.name,version:1,status:'DRAFT',input:data.sample&&development()?sampleInput():emptyInput(),updatedAt:now,createdAt:now,selectedVersion:null,demo:!!data.sample&&development()};insertDoc('case',id,user.id,c,'DRAFT');audit(user.id,'CASE_CREATED',id);return success(c,201);
      }
    }
    const c=owned<CaseRecord>('case',parts[1],user.id);if(c.status==='DELETED')throw missing();
    if(parts[2]==='guidance'){
      if(parts.length===3&&method==='GET')return success(listGuidance(user.id,c));
      if(parts.length===3&&method==='POST'){const value=await body(req);return success(idempotent(req,user.id,endpoint,value,()=>startGuidance(user.id,c,value)),201);}
      if(parts.length===4&&method==='PATCH')return success(advanceGuidance(user.id,c,parts[3],await body(req)));
    }
    if(parts.length===2){
      if(method==='GET')return success(c);
      if(method==='PATCH'){
        if(['PACKED','SHIPPED','RECEIVED'].includes(c.status))throw new ApiError(409,'CASE_COMPLETED','Hồ sơ đã hoàn tất. Tạo nháp từ mẫu để giữ lịch sử.');
        const value=parse(z.object({expected_version:z.number().int().positive(),name:z.string().trim().min(2).max(120),input:inputSchema}),await body(req));
        if(c.version!==value.expected_version)throw new ApiError(409,'VERSION_CONFLICT','Hồ sơ đã được sửa ở nơi khác. Nội dung tại trang được giữ để bạn đối chiếu.');
        const inputChanged=inputHash(c.input)!==inputHash(value.input);if(!inputChanged&&c.name===value.name)return success(c);
        const next={...c,name:value.name,input:value.input,version:c.version+1,status:inputChanged?'DRAFT':c.status,selectedVersion:inputChanged?null:c.selectedVersion,updatedAt:new Date().toISOString()};
        const changes=updateDoc('case',c.id,user.id,next,next.status,value.expected_version);if(!changes)throw new ApiError(409,'VERSION_CONFLICT','Hồ sơ đã được cập nhật.');audit(user.id,'CASE_UPDATED',c.id);return success(next);
      }
      if(method==='DELETE'){transaction(()=>{updateDoc('case',c.id,user.id,{...c,status:'DELETED'},'DELETED');db().prepare('UPDATE shares SET revoked=1 WHERE owner_id=? AND version_id IN (SELECT id FROM documents WHERE kind=\'plan\' AND json_extract(body,\'$.caseId\')=?)').run(user.id,c.id);for(const j of docs<Job>('job',user.id).filter(j=>j.caseId===c.id&&['QUEUED','RUNNING'].includes(j.status)))updateDoc('job',j.id,user.id,{...j,status:'CANCELLED'},'CANCELLED');});return success({deleted:true});}
    }
    if(parts[2]==='versions'&&method==='GET')return success(docs<PlanVersion>('plan',user.id).filter(v=>v.caseId===c.id).map(v=>versionWithStale(v,user.id)));
    if(parts[2]==='readiness'&&method==='GET')return success(getReadiness(c.input));
    if(parts[2]==='plans'&&method==='POST'){
      if(['PACKED','SHIPPED','RECEIVED'].includes(c.status))throw new ApiError(409,'CASE_COMPLETED','Hồ sơ đã hoàn tất. Tạo nháp từ mẫu cho lần đóng gói mới.');
      const value=parse(z.object({input_version:z.number().int(),use_ai_images:z.literal(false).optional()}),await body(req));
      if(value.input_version!==c.version)throw new ApiError(409,'VERSION_CONFLICT','Tải phiên bản đầu vào mới nhất.');
      if(!Number.isFinite(Date.parse(c.input.shipment.departure))||Date.parse(c.input.shipment.departure)<=Date.now())throw new ApiError(422,'DEPARTURE_INVALID','Ngày gửi cần nằm trong tương lai.',{'shipment.departure':'Chọn ngày gửi mới.'});
      const job=idempotent(req,user.id,endpoint,value,()=>{
        const existing=docs<Job>('job',user.id).find(j=>j.caseId===c.id&&j.type==='PLAN'&&j.inputHash===inputHash(c.input)&&['QUEUED','RUNNING'].includes(j.status));return existing||createJob(user.id,c,'PLAN');
      });wakeWorker();return success({job_id:job.id,status:job.status},202);
    }
    if(parts[2]==='plant-analysis'||parts[2]==='material-analysis'){
      if(method!=='POST')throw missing();const value=parse(z.object({upload_ids:z.array(z.string()).min(1).max(6),consent_id:z.string()}),await body(req));
      const consent=owned<{revoked:boolean;purpose:string}>('consent',value.consent_id,user.id);if(consent.revoked||consent.purpose!=='AI_ANALYSIS')throw new ApiError(403,'CONSENT_REQUIRED','Cần đồng ý riêng cho nhận diện AI.');
      for(const id of value.upload_ids){const upload=owned<Upload>('upload',id,user.id);if(upload.caseId!==c.id)throw missing();}
      if(!process.env.GEMINI_API_KEY||!process.env.GEMINI_VISION_MODEL)throw new ApiError(503,'AI_UNAVAILABLE','AI chưa được cấu hình. Bạn vẫn tiếp tục bằng nhập tay.');
      const job=createJob(user.id,c,'VISION',{uploads:value.upload_ids,consentId:value.consent_id});wakeWorker();return success({job_id:job.id},202);
    }
    if(parts[2]==='selection'&&method==='POST'){
      const value=parse(z.object({version_id:z.string(),acknowledgments:z.array(z.string())}),await body(req));
      const v=owned<PlanVersion>('plan',value.version_id,user.id);eligible(c,v);
      if(v.plan.warnings.some(w=>w.acknowledgeable&&!value.acknowledgments.includes(w.code)))throw new ApiError(422,'WARNING_ACK_REQUIRED','Xác nhận từng cảnh báo trước khi bắt đầu.');
      transaction(()=>{const current=owned<CaseRecord>('case',c.id,user.id);eligible(current,v);current.selectedVersion=v.id;current.status='PACKING';updateDoc('case',c.id,user.id,current,'PACKING');insertDoc('selection',randomUUID(),user.id,{caseId:c.id,versionId:v.id,acknowledgments:value.acknowledgments,createdAt:new Date().toISOString()});audit(user.id,'PLAN_SELECTED',v.id);});return success({selected:true});
    }
    if(parts[2]==='checklist'){
      const vId=req.nextUrl.searchParams.get('version_id')||c.selectedVersion;
      if(method==='GET')return success(vId?doc('checklist',vId,user.id)||{versionId:vId,checked:[]}:null);
      if(method==='PATCH'){
        const value=parse(z.object({version_id:z.string(),checked:z.array(z.string()).max(8)}),await body(req));const v=owned<PlanVersion>('plan',value.version_id,user.id);eligible(c,v);if(c.selectedVersion!==v.id)throw new ApiError(409,'SELECTION_CHANGED','Chọn phương án trước khi làm checklist.');
        if(value.checked.some(id=>!v.plan.steps.some(step=>step.id===id)))throw new ApiError(422,'INVALID_STEP','Bước không thuộc phiên bản được chọn.');
        const data={versionId:v.id,checked:[...new Set(value.checked)],updatedAt:new Date().toISOString()};if(doc('checklist',v.id,user.id))updateDoc('checklist',v.id,user.id,data);else insertDoc('checklist',v.id,user.id,data);return success(data);
      }
    }
    if(parts[2]==='complete'&&method==='POST'){
      const value=parse(z.object({version_id:z.string(),actual_weight:z.number().positive(),actual_length:z.number().positive(),actual_width:z.number().positive(),actual_height:z.number().positive()}),await body(req));
      const result=idempotent(req,user.id,endpoint,value,()=>{
        const old=db().prepare('SELECT body FROM completions WHERE case_id=? AND version_id=? AND owner_id=?').get(c.id,value.version_id,user.id) as {body:string}|undefined;if(old)return JSON.parse(old.body);
        const current=owned<CaseRecord>('case',c.id,user.id),v=owned<PlanVersion>('plan',value.version_id,user.id);eligible(current,v);
        if(current.selectedVersion!==v.id)throw new ApiError(409,'SELECTION_CHANGED','Phiên bản được chọn đã thay đổi.');
        const checks=doc<{checked:string[]}>('checklist',v.id,user.id);if(v.plan.steps.some(step=>!checks?.checked.includes(step.id)))throw new ApiError(422,'CHECKLIST_INCOMPLETE','Xác nhận đầy đủ các bước bắt buộc.');
        const box=v.snapshot.materials.find(m=>m.id===v.plan.boxId)!;
        if(!box.maxLoad||value.actual_weight>box.maxLoad||value.actual_weight<(v.plan.package.weight||0)||value.actual_length<(v.plan.package.length||0)||value.actual_width<(v.plan.package.width||0)||value.actual_height<(v.plan.package.height||0))throw new ApiError(422,'ACTUAL_PACKAGE_INVALID','Thông số kiện thực tế không vượt kiểm kích thước/tải trọng.');
        const completionId=randomUUID(),at=new Date().toISOString();const totals=new Map<string,Decimal>();
        for(const m of v.snapshot.materials.filter(m=>m.inventoryId&&v.plan.usedMaterialIds.includes(m.id)))totals.set(m.inventoryId!,new Decimal(totals.get(m.inventoryId!)||0).plus(m.category==='BOX'?1:m.quantity));
        for(const [id,quantity] of totals){const material=owned<Inventory>('material',id,user.id);if(quantity.gt(material.stock))throw new ApiError(409,'INSUFFICIENT_STOCK',`Không đủ tồn kho ${material.name}; chưa trừ vật tư nào.`);}
        const completion={id:completionId,caseId:c.id,versionId:v.id,...value,createdAt:at};db().prepare('INSERT INTO completions VALUES(?,?,?,?,?,?)').run(completionId,user.id,c.id,v.id,JSON.stringify(completion),at);
        for(const [id,quantity] of [...totals].sort(([a],[b])=>a.localeCompare(b))){const m=owned<Inventory>('material',id,user.id);m.stock=new Decimal(m.stock).minus(quantity).toNumber();m.version++;updateDoc('material',id,user.id,m);db().prepare('INSERT INTO movements VALUES(?,?,?,?,?)').run(randomUUID(),completionId,id,quantity.negated().toString(),at);}
        updateDoc('case',c.id,user.id,{...current,status:'PACKED',updatedAt:at},'PACKED');audit(user.id,'PACKING_COMPLETED',completionId);return completion;
      });return success(result);
    }
    if(parts[2]==='exports'&&method==='POST'){
      const value=parse(z.object({version_id:z.string(),format:z.enum(['PDF','MARKDOWN','JSON','BUNDLE']).default('PDF')}),await body(req));const v=owned<PlanVersion>('plan',value.version_id,user.id);if(v.caseId!==c.id)throw missing();
      const job=idempotent(req,user.id,endpoint,value,()=>createJob(user.id,c,'EXPORT',{versionId:v.id,exportFormat:value.format}));wakeWorker();return success({job_id:job.id},202);
    }
    if(parts[2]==='shares'){
      if(method==='GET')return success(db().prepare('SELECT id,version_id,expires_at,revoked,created_at FROM shares WHERE owner_id=? AND version_id IN (SELECT id FROM documents WHERE kind=\'plan\' AND json_extract(body,\'$.caseId\')=?)').all(user.id,c.id));
      if(method==='POST'){
        const value=parse(z.object({version_id:z.string(),days:z.number().int().min(1).max(7).default(7)}),await body(req));const v=owned<PlanVersion>('plan',value.version_id,user.id);if(v.caseId!==c.id)throw missing();
        const token=randomBytes(32).toString('base64url'),id=randomUUID(),expiry=Date.now()+value.days*86400000;db().prepare('INSERT INTO shares VALUES(?,?,?,?,?,0,?)').run(id,user.id,v.id,sha(token),expiry,new Date().toISOString());audit(user.id,'SHARE_CREATED',id);return success({id,url:`/shared/${token}`,expiresAt:new Date(expiry).toISOString()},201);
      }
    }
    if(parts[2]==='feedback'&&method==='POST'){
      const value=parse(z.object({version_id:z.string(),rating:z.number().int().min(1).max(5),note:z.string().max(2000)}),await body(req));const v=owned<PlanVersion>('plan',value.version_id,user.id);if(v.caseId!==c.id)throw missing();
      const id=c.id,data={id,...value,createdAt:new Date().toISOString()};if(doc('feedback',id,user.id))updateDoc('feedback',id,user.id,data);else insertDoc('feedback',id,user.id,data);return success(data);
    }
    if(parts[2]==='shipment'&&method==='PATCH'){
      const value=parse(z.object({status:z.enum(['SHIPPED','RECEIVED']),at:z.string().datetime()}),await body(req));if(value.status==='SHIPPED'&&c.status!=='PACKED'||value.status==='RECEIVED'&&c.status!=='SHIPPED')throw new ApiError(422,'INVALID_TRANSITION','Trạng thái bàn giao/nhận chưa hợp lệ.');
      updateDoc('case',c.id,user.id,{...c,status:value.status,updatedAt:new Date().toISOString()},value.status);insertDoc('shipment-event',randomUUID(),user.id,{caseId:c.id,...value});return success({status:value.status});
    }
    if(parts[2]==='chat')throw new ApiError(503,'FEATURE_DISABLED','Hỏi đáp AI chưa bật. Sửa đầu vào và tạo phiên bản mới để thay phương án.');
  }
  if(parts[0]==='shares'&&method==='DELETE'){const result=db().prepare('UPDATE shares SET revoked=1 WHERE id=? AND owner_id=?').run(parts[1],user.id);if(!result.changes)throw missing();audit(user.id,'SHARE_REVOKED',parts[1]);return success({revoked:true});}
  if(parts[0]==='jobs'){
    const j=owned<Job>('job',parts[1],user.id);
    if(parts[2]==='cancel'&&method==='POST'){if(['QUEUED','RUNNING'].includes(j.status)){j.status=j.status==='QUEUED'?'CANCELLED':'CANCEL_REQUESTED';updateDoc('job',j.id,user.id,j,j.status);}return success({status:j.status});}
    if(method==='GET')return success({id:j.id,status:j.status,stage:j.stage,error:j.error,versionId:j.versionId,result:j.result});
  }
  if(parts[0]==='exports'&&method==='GET'){
    const job=owned<Job>('job',parts[1],user.id);if(job.type!=='EXPORT'||job.status!=='SUCCEEDED')throw new ApiError(409,'EXPORT_PENDING','PDF chưa sẵn sàng.');
    const meta=exportMetadata[job.exportFormat||'PDF'];return new NextResponse(readFileSync(path.join(dataDir(),'exports',job.id+'.'+meta.extension)),{headers:{'Content-Type':meta.mime,'Content-Disposition':`attachment; filename="PlantCare-${job.id.slice(0,8)}.${meta.extension}"`,'Cache-Control':'no-store'}});
  }
  if(parts[0]==='uploads'){
    if(parts.length===1&&method==='POST'){
      const data=await req.formData(),file=data.get('file'),caseId=String(data.get('case_id')||''),purpose=String(data.get('purpose')||'PLANT');owned<CaseRecord>('case',caseId,user.id);
      if(!['PLANT','MATERIAL','CHECK','FEEDBACK'].includes(purpose))throw new ApiError(422,'UPLOAD_PURPOSE','Mục đích ảnh không hợp lệ.');
      if(!(file instanceof File)||file.size>10*1024*1024)throw new ApiError(413,'UPLOAD_TOO_LARGE','Mỗi ảnh tối đa 10 MB.');
      const existing=docs<Upload>('upload',user.id).filter(u=>u.caseId===caseId);if(existing.length>=12||(['PLANT','MATERIAL'].includes(purpose)&&existing.filter(u=>u.purpose===purpose).length>=6))throw new ApiError(422,'UPLOAD_LIMIT','Tối đa 6 ảnh cây, 6 ảnh vật tư và 12 ảnh/hồ sơ.');
      const bytes=Buffer.from(await file.arrayBuffer());let metadata:Metadata;try{metadata=await sharp(bytes,{limitInputPixels:30000000}).metadata();}catch{throw new ApiError(422,'INVALID_IMAGE','Ảnh không giải mã được hoặc vượt 30 MP.');}
      if(!['jpeg','png','webp'].includes(metadata.format||''))throw new ApiError(422,'INVALID_IMAGE','Chỉ nhận JPEG, PNG và WebP.');
      let normalized:Buffer;
      try{normalized=await sharp(bytes,{limitInputPixels:30000000}).rotate().resize(2048,2048,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}
      catch{throw new ApiError(422,'INVALID_IMAGE','Ảnh bị lỗi hoặc không giải mã được.');}
      const id=randomUUID(),filename=id+'.webp';mkdirSync(path.join(dataDir(),'uploads'),{recursive:true});writeFileSync(path.join(dataDir(),'uploads',filename),normalized);
      const upload:Upload={id,caseId,purpose,file:filename,mime:'image/webp',size:normalized.length};insertDoc('upload',id,user.id,upload,'READY');audit(user.id,'UPLOAD_READY',id);return success(upload,201);
    }
    if(parts.length===1&&method==='GET'){const caseId=req.nextUrl.searchParams.get('case_id');if(caseId)owned<CaseRecord>('case',caseId,user.id);return success(docs<Upload>('upload',user.id).filter(u=>!caseId||u.caseId===caseId).map(({file,...u})=>u));}
    const u=owned<Upload>('upload',parts[1],user.id);
    if(method==='GET'){const c=owned<CaseRecord>('case',u.caseId,user.id);if(c.status==='DELETED')throw missing();return new NextResponse(readFileSync(path.join(dataDir(),'uploads',u.file)),{headers:{'Content-Type':u.mime,'Cache-Control':'private,no-store'}});}
    if(method==='DELETE'){db().prepare('DELETE FROM documents WHERE kind=? AND id=? AND owner_id=?').run('upload',u.id,user.id);if(existsSync(path.join(dataDir(),'uploads',u.file)))unlinkSync(path.join(dataDir(),'uploads',u.file));return success({deleted:true});}
  }
  if(parts[0]==='materials'){
    if(method==='GET')return success(docs<Inventory>('material',user.id));
    if(method==='POST'||method==='PATCH'){
      const value=parse(z.object({material:inputSchema.shape.materials.element,stock:z.number().min(0).max(100000),expected_version:z.number().int().optional()}),await body(req));
      const id=parts[1]||randomUUID(),old=parts[1]?owned<Inventory>('material',id,user.id):null;
      if(old&&old.version!==value.expected_version)throw new ApiError(409,'VERSION_CONFLICT','Vật tư đã được sửa ở nơi khác.');
      const m:Inventory={...value.material,id,stock:value.stock,version:(old?.version||0)+1,updatedAt:new Date().toISOString()};if(old)updateDoc('material',id,user.id,m);else insertDoc('material',id,user.id,m);return success(m,old?200:201);
    }
    if(method==='DELETE'){owned('material',parts[1],user.id);db().prepare('DELETE FROM documents WHERE kind=? AND id=? AND owner_id=?').run('material',parts[1],user.id);return success({deleted:true});}
  }
  if(parts[0]==='templates'){
    if(method==='GET')return success(docs('template',user.id));
    if(parts.length===1&&method==='POST'){const value=parse(z.object({case_id:z.string(),name:z.string().min(2).max(120)}),await body(req));const c=owned<CaseRecord>('case',value.case_id,user.id);const reusable=structuredClone(c.input);reusable.plant.confirmed=false;reusable.shipment={...emptyInput().shipment,origin:c.input.shipment.origin,destination:c.input.shipment.destination};reusable.materials.forEach(m=>m.confirmed=false);const id=randomUUID(),t={id,name:value.name,input:reusable};insertDoc('template',id,user.id,t);return success(t,201);}
    if(parts[2]==='clone'&&method==='POST'){const t=owned<{name:string;input:CaseInput}>('template',parts[1],user.id),id=randomUUID(),now=new Date().toISOString();const c:CaseRecord={id,name:t.name,version:1,status:'DRAFT',input:t.input,updatedAt:now,createdAt:now,selectedVersion:null,demo:false};insertDoc('case',id,user.id,c,'DRAFT');return success(c,201);}
  }
  if(parts[0]==='notifications'){
    if(method==='GET')return success(docs('notification',user.id));
    if(method==='PATCH'){const n=owned<Record<string,unknown>>('notification',parts[1],user.id);updateDoc('notification',parts[1],user.id,{...n,read:true});return success({read:true});}
  }
  if(parts[0]==='tickets'){
    if(parts.length===1){
      if(method==='GET')return success(docs('ticket',user.id));
      if(method==='POST'){const value=parse(z.object({subject:z.string().min(2).max(120),body:z.string().min(2).max(4000)}).strict(),await body(req));const id=randomUUID(),ticket={id,...value,status:'OPEN',sharedScope:[],assignedExpert:null,createdAt:new Date().toISOString()};insertDoc('ticket',id,user.id,ticket);return success(ticket,201);}
    }
    const ticket=owned<{id:string;subject:string}>('ticket',parts[1],user.id);
    if(parts[2]==='messages'){
      if(method==='GET')return success(docs<{ticketId:string}>('message',user.id).filter(m=>m.ticketId===ticket.id));
      if(method==='POST'){const value=parse(z.object({body:z.string().min(1).max(4000)}),await body(req));const id=randomUUID(),message={id,ticketId:ticket.id,body:value.body,createdAt:new Date().toISOString(),author:user.name};insertDoc('message',id,user.id,message);return success(message,201);}
    }
  }
  if(parts[0]==='admin'){
    if(!['ADMIN','OPERATOR','EDITOR','EXPERT'].includes(user.role))throw new ApiError(403,'FORBIDDEN','Bạn không có quyền truy cập quản trị.');
    if(method!=='GET')throw new ApiError(503,'ADMIN_MUTATION_GATED','Chưa bật thay đổi production khi quy trình duyệt chưa được cấu hình.');
    if(parts[1]==='rules')return success([draftRulePack]);
    if(parts[1]==='jobs')return success(docs<Job>('job').map(j=>({id:j.id,type:j.type,status:j.status,stage:j.stage,createdAt:j.createdAt,error:j.error})));
    if(parts[1]==='audit')return success(db().prepare('SELECT action,resource_id,request_id,created_at FROM audit ORDER BY created_at DESC LIMIT 100').all());
    if(parts[1]==='settings')return success({aiConfigured:!!process.env.GEMINI_API_KEY,visionModel:process.env.GEMINI_VISION_MODEL||null,smsConfigured:!!process.env.SMS_ADAPTER_URL,imagesEnabled:false,ruleStatus:'DRAFT'});
  }
  if(endpoint==='me/data-export'&&method==='POST'){
    const value=parse(z.object({password:z.string().max(128)}),await body(req));const record=db().prepare('SELECT password FROM users WHERE id=?').get(user.id) as {password:string};if(!compareSync(value.password,record.password))throw new ApiError(401,'REAUTH_REQUIRED','Nhập mật khẩu hiện tại để tải dữ liệu.');
    return success({profile:{name:user.name,username:user.username},cases:docs('case',user.id),versions:docs('plan',user.id),materials:docs('material',user.id),consents:docs('consent',user.id)});
  }
  throw missing();
}
