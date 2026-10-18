'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { CaseRecord } from '@plantcare/domain';
import { Camera, Mic, Volume2, ArrowRight, AlertTriangle } from 'lucide-react';
import { api, useSession, useLoad, Spinner, Alert, Empty, PageHeading } from './common';
import { useVietnameseSpeech } from './use-vietnamese-speech';
import { usePackingCommands } from './use-packing-commands';
import { instructionImage } from './packing-results';
import { MvpProgress } from './mvp-flow';
import { packingNarration } from '../lib/packing-narration';
import { confirmationDecision, type GuidanceSession } from '../lib/guidance';
import { sopCatalog, validateResult, type CheckpointResult, type StepRecord } from '../lib/live-packing';
import type { PackingIntent } from '../lib/packing-voice-commands';

const labels={passed:'Đạt phần nhìn thấy',needs_adjustment:'Cần sửa trước khi tiếp tục',unverifiable:'Chưa nhìn rõ để kiểm tra'};
export function CaseGuidedPacking({caseId}:{caseId:string}){
  const {data,error}=useLoad<CaseRecord>('cases/'+caseId);
  return error?<Alert kind="error">{error}</Alert>:data?<LivePacking key={caseId} caseRecord={data}/>:<Spinner/>;
}
export function LivePacking({caseRecord}:{caseRecord:CaseRecord}){
  const {session}=useSession(),params=useSearchParams(),requested=params.get('session');
  const [guidance,setGuidance]=useState<GuidanceSession|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [active,setActive]=useState(false),[online,setOnline]=useState(true);
  const warnings=useRef(new Map<string,number>());
  const [camera,setCamera]=useState(false),[consent,setConsent]=useState(false),[monitor,setMonitor]=useState(false),[voice,setVoice]=useState(true),[volume,setVolume]=useState(1);
  const [phase,setPhase]=useState<'idle'|'positioning'|'checking'|'saving'>('idle'),[countdown,setCountdown]=useState<number|null>(null),[manual,setManual]=useState(false),[manualNote,setManualNote]=useState('');
  const [override,setOverride]=useState<StepRecord|undefined>(),[lastChecked,setLastChecked]=useState('');
  const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),controller=useRef<AbortController|null>(null),mounted=useRef(true),starting=useRef(false),generation=useRef(0),run=useRef(0),locked=useRef(false),saving=useRef(false),waitCancel=useRef<(()=>void)|null>(null),ack=useRef('');
  const checkRef=useRef<(auto:boolean,advance:boolean)=>Promise<void>>(async()=>{}),frameSignature=useRef<number[]|null>(null);
  const {speak:say,cancel:cancelSpeech,activate,voiceName,audioState,speaking,isSpeaking,notice:voiceNotice}=useVietnameseSpeech(voice&&volume>0,session.csrf,volume);
  const sop=guidance?.boundSop||sopCatalog.sops.find(s=>s.id===guidance?.sopId&&s.version===guidance?.sopVersion)||sopCatalog.sops[0],index=guidance?.index||0,step=sop.steps[index],finished=!!guidance&&guidance.status!=='ACTIVE',busy=phase!=='idle';
  const record=override||(guidance?.checks[step.id]?{kind:'ai' as const,result:guidance.checks[step.id]}:guidance?.records[step.id]);
  const enabled=!!guidance&&!finished&&online&&(guidance.mode==='MVP'?active&&guidance.executionState==='RUNNING':session.development||session.referenceGuideEnabled===true);
  const commands=usePackingCommands({ready:enabled,paused:busy||isSpeaking,speaking,onCommand:intent=>{void handleVoiceCommand(intent);}});
  const suspend=commands.suspend,resume=commands.resume,speak=useCallback((text:string)=>{suspend();return say(text).finally(resume);},[say,suspend,resume]);
  function apply(g:GuidanceSession){setGuidance(g);setOverride(undefined);}
  useEffect(()=>{let active=true;void api<GuidanceSession[]>('cases/'+caseRecord.id+'/guidance').then(list=>{
    if(!active)return;const g=requested?list.find(x=>x.id===requested&&!x.stale):list.filter(x=>!x.stale).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
    if(g)apply(g);else if(list.some(x=>x.stale))setError('Thông tin cây đã đổi. Mở lại hướng dẫn để bắt đầu phiên mới.');
  }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[caseRecord.id,requested]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;stop();};},[]);
  useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
  useEffect(()=>{if(enabled&&!locked.current){const prefix=ack.current;ack.current='';void speak(prefix+packingNarration(sop,index));}return cancelSpeech;},[index,guidance?.id,finished,voice,voiceName,speak,cancelSpeech,enabled,sop]);
  useEffect(()=>{const offline=()=>{setOnline(false);stop();setError('Mất kết nối. Hướng dẫn đã tải vẫn xem được; AI tạm dừng.');},online=()=>{setOnline(true);setMessage('Đã có mạng. Chọn Tiếp tục phiên khi sẵn sàng.');};window.addEventListener('offline',offline);window.addEventListener('online',online);return()=>{window.removeEventListener('offline',offline);window.removeEventListener('online',online);};},[]);
  useEffect(()=>{frameSignature.current=null;},[guidance?.id,index]);
  useEffect(()=>{
    if(!monitor||!camera||!consent||!enabled||step.mode!=='visual')return;
    const timer=setInterval(()=>{if(!locked.current&&!speaking.current&&!document.hidden)void checkRef.current(true,false);},12000);
    return()=>clearInterval(timer);
  },[monitor,camera,consent,enabled,index,step.mode,speaking]);
  function cancelCheck(){run.current++;controller.current?.abort();waitCancel.current?.();waitCancel.current=null;cancelSpeech();if(!saving.current){locked.current=false;if(mounted.current){setPhase('idle');setCountdown(null);}}}
  function stop(){commands.disable();generation.current++;cancelCheck();stream.current?.getTracks().forEach(t=>{t.onended=null;t.stop();});stream.current=null;if(video.current)video.current.srcObject=null;if(mounted.current){setCamera(false);setMonitor(false);setActive(false);}}
  async function start(){
    if(starting.current||locked.current)return;starting.current=true;const token=++generation.current;
    try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera chưa được hỗ trợ.');const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      if(!mounted.current||token!==generation.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current?.getTracks().forEach(t=>{t.onended=null;t.stop();});stream.current=media;media.getVideoTracks().forEach(t=>{t.onended=()=>{stop();if(mounted.current)setError('Camera bị ngắt. Bật lại camera để tiếp tục.');};});
      if(video.current){video.current.srcObject=media;await video.current.play();}if(!mounted.current||token!==generation.current){media.getTracks().forEach(t=>t.stop());return;}setCamera(true);setError('');
    }catch{stop();if(mounted.current)setError('Không mở được camera. Cấp quyền camera rồi thử lại trên HTTPS hoặc localhost.');}finally{starting.current=false;}
  }
  async function control(action:'BEGIN'|'PAUSE'|'RESUME'|'END'){if(!guidance||busy)return;stop();setError('');if(action==='RESUME'&&guidance.executionState==='RUNNING'){setActive(true);return;}setPhase('saving');try{const g=await api<GuidanceSession>(`cases/${caseRecord.id}/guidance/${guidance.id}/control`,{method:'POST',body:JSON.stringify({expected_revision:guidance.revision,action})},session.csrf);apply(g);setActive(action==='BEGIN'||action==='RESUME');}catch(e){setError((e as Error).message);}finally{setPhase('idle');}}
  async function mutate(action:'CONFIRM'|'MANUAL'|'SKIP'|'REPORT_ISSUE'|'RESOLVE_ISSUE',method:'BUTTON'|'VOICE',base=guidance,note=manualNote.trim()){
    if(!base||locked.current||finished)return;locked.current=true;saving.current=true;commands.suspend();setPhase('saving');setError('');cancelSpeech();
    try{const g=await api<GuidanceSession>(`cases/${caseRecord.id}/guidance/${base.id}`,{method:'PATCH',body:JSON.stringify({expected_revision:base.revision,step_id:sop.steps[base.index].id,action,method,manual_checked:!['REPORT_ISSUE','RESOLVE_ISSUE'].includes(action),note})},session.csrf);
      if(!mounted.current)return;locked.current=false;
      if(action==='REPORT_ISSUE'){apply(g);const text='Tạm dừng bước này. '+step.remedy_vi;setMessage(text);await speak(text);return;}
      if(action==='RESOLVE_ISSUE'){apply(g);setMessage('Đã ghi nhận xử lý lỗi. Kiểm tra xong, nói đã xong bước này.');return;}
      ack.current=action==='SKIP'?'Đã ghi bước chưa hoàn tất. ':'Đã xác nhận. ';apply(g);setManual(false);setManualNote('');setMessage('');
      if(g.status!=='ACTIVE'){stop();await speak(g.status==='REVIEW_REQUIRED'?'Phiên kết thúc, còn bước cần xem lại.':'Bạn đã hoàn tất các bước hướng dẫn. Kiểm lại kiện trước khi bàn giao.');}
    }catch(e){if(mounted.current){setError((e as Error).message);await speak('Chưa lưu được. Giữ nguyên bước này và thử lại.');}}
    finally{locked.current=false;saving.current=false;if(mounted.current)setPhase('idle');commands.resume();}
  }
  async function done(method:'BUTTON'|'VOICE'){
    if(!enabled||locked.current)return;
    if(guidance?.currentIssue&&step.mode==='manual'){const text='Bạn đang báo lỗi ở bước này. Xử lý xong, nói đã xử lý lỗi trước khi tiếp tục.';setMessage(text);await speak(text);return;}
    const decision=confirmationDecision(step,record);
    if(decision==='CONFIRM'){await mutate(record?.kind==='manual'?'MANUAL':'CONFIRM',method);return;}
    if(decision==='REPAIR'){const text=(record?.result?labels[record.result.status]+'. '+record.result.reason+'. ':'')+step.remedy_vi;setMessage(text);await speak(text);return;}
    await check(false,true,method);
  }
  async function handleVoiceCommand(intent:PackingIntent){
    try{if(!enabled||locked.current)return;
      if(intent==='STOP'){stop();setMessage('Đã dừng camera và nghe lệnh.');return;}
      if(intent==='ISSUE'){await mutate('REPORT_ISSUE','VOICE');return;}
      if(intent==='RESOLVED'){await mutate('RESOLVE_ISSUE','VOICE');return;}
      if(intent==='MANUAL_CONFIRM'){if(guidance?.currentIssue||record?.result?.status==='needs_adjustment'){await speak('Còn lỗi cần xử lý. '+step.remedy_vi);return;}await mutate('MANUAL','VOICE',guidance,'Người dùng xác nhận bằng giọng nói đã kiểm tra trực tiếp.');return;}
      if(intent==='HELP'||intent==='REPEAT'){const notes=(sop.reference_notes||[]).filter(n=>n.step_id===step.id).map(n=>n.text).join(' ');await speak(packingNarration(sop,index)+(intent==='HELP'?' '+step.remedy_vi+' '+notes:''));return;}
      if(intent==='CONFIRM'||step.mode==='manual')await done('VOICE');else await check(false,false,'VOICE');
    }finally{commands.resume();}
  }
  async function check(auto=false,advance=false,method:'VOICE'|'BUTTON'='BUTTON'){
    if(locked.current||!guidance||!enabled||step.mode!=='visual')return;
    if(!camera||!consent||!session.aiConfigured){const text=!camera?'Bật camera để kiểm tra.':!consent?'Bật Cho AI kiểm tra hình ảnh.':'AI chưa kết nối. Dùng xác nhận thủ công để tiếp tục.';setError(text);if(!auto)await speak(text);return;}
    locked.current=true;const token=++run.current;commands.suspend();const active=()=>mounted.current&&token===run.current&&locked.current;
    setPhase(auto?'checking':'positioning');setError('');setMessage('');setOverride(undefined);
    try{
      if(!auto){await speak(step.camera_prompt_vi);if(!active())return;for(let seconds=3;seconds>0;seconds--){setCountdown(seconds);await new Promise<void>(resolve=>{const timer=setTimeout(()=>{waitCancel.current=null;resolve();},1000);waitCancel.current=()=>{clearTimeout(timer);resolve();};});if(!active())return;}}
      setCountdown(null);const v=video.current;if(!v||v.readyState<2||!v.videoWidth||!stream.current?.getVideoTracks().some(t=>t.readyState==='live'))throw new Error('Camera chưa có hình. Bật lại camera rồi thử.');
      const canvas=document.createElement('canvas'),scale=Math.min(1,1280/Math.max(v.videoWidth,v.videoHeight));canvas.width=Math.round(v.videoWidth*scale);canvas.height=Math.round(v.videoHeight*scale);const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Không lấy được ảnh.');ctx.drawImage(v,0,0,canvas.width,canvas.height);
      const tiny=document.createElement('canvas');tiny.width=tiny.height=8;const tctx=tiny.getContext('2d')!;tctx.drawImage(canvas,0,0,8,8);const signature=Array.from(tctx.getImageData(0,0,8,8).data);tiny.width=tiny.height=0;
      const old=frameSignature.current;if(auto&&old&&signature.reduce((sum,n,i)=>sum+Math.abs(n-old[i]),0)/signature.length<4)return;
      const image=canvas.toDataURL('image/jpeg',0.8);canvas.width=canvas.height=0;frameSignature.current=signature;
      if(!active())return;setPhase('checking');controller.current=new AbortController();
      const raw=await api<CheckpointResult&{guidance?:GuidanceSession}>('live-packing/check',{method:'POST',signal:controller.current.signal,body:JSON.stringify({case_id:caseRecord.id,session_id:guidance.id,session_revision:guidance.revision,sop_id:sop.id,shipping_form:sop.shipping_form,context:guidance.context,step_id:step.id,sop_version:sop.version,approved_for_trial:true,...(guidance.mode==='REFERENCE'?{reference_guidance:true}:{}),consent:true,image})},session.csrf);
      if(!active())return;const {guidance:updated,...value}=raw,result=validateResult(value,step);if(updated)apply(updated);else setOverride({kind:'ai',result});setLastChecked(new Date().toLocaleTimeString('vi-VN'));
      if(result.status!=='passed'){setMessage(result.reason);const warningKey=step.id+':'+result.status;if(!auto||Date.now()-(warnings.current.get(warningKey)||0)>=5000){warnings.current.set(warningKey,Date.now());await speak(labels[result.status]+'. '+result.reason+'. '+step.remedy_vi);}}
      else if(advance&&updated){locked.current=false;await mutate('CONFIRM',method,updated);}
      else if(!auto)await speak('Phần nhìn thấy đạt. Kiểm tra trực tiếp xong, nói đã xong bước này để tiếp tục.');
    }catch(e){if(!active())return;frameSignature.current=null;setError((e as Error).message);if(auto)setMonitor(false);else await speak('Chưa kiểm tra được ảnh. Thử lại hoặc kiểm tra thủ công.');}
    finally{if(active()){locked.current=false;setPhase('idle');setCountdown(null);}commands.resume();}
  }
  checkRef.current=(auto,advance)=>check(auto,advance);
  function exportSession(){const url=URL.createObjectURL(new Blob([JSON.stringify({schema_version:'plantmove-guidance-v4',case_id:caseRecord.id,session:guidance,approved_professionally:sop.status==='PUBLISHED',transport_safe:null},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='PlantCare-huong-dan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  if(loading)return <Spinner/>;
  if(!guidance)return <><PageHeading title="AI hướng dẫn đóng gói"/>{error&&<Alert kind="error">{error}</Alert>}<Empty title="Mở hướng dẫn trước khi bắt đầu" description="Xem các bước đóng gói cho hồ sơ này." action={<Link className="button primary" href={`/app/cases/${caseRecord.id}/instructions`}>Xem hướng dẫn</Link>}/></>;
  return <div className="guided-workspace"><PageHeading title="AI hướng dẫn đóng gói" description={`${caseRecord.name}${guidance.alternativeId?' · '+guidance.alternativeId:''}`} action={<Link className="button secondary" href={`/app/cases/${caseRecord.id}/instructions`}>Xem các bước</Link>}/>
    {guidance.mode==='MVP'&&<MvpProgress active={3}/>}
    {error&&<Alert kind="error">{error}</Alert>}
    {finished?<section className="panel guidance-finished"><h2>{guidance.status==='REVIEW_REQUIRED'?'Còn bước cần kiểm tra lại':'Đã hoàn tất hướng dẫn'}</h2><p>Kiểm lại kiện trước khi bàn giao.</p>{sop.steps.map(s=><p key={s.id}>{s.title}: {guidance.records[s.id]?.kind==='skipped'?'Chưa hoàn tất':'Đã xác nhận'}</p>)}<div className="button-row"><button className="button secondary" onClick={exportSession}>Tải biên bản</button><Link className="button primary" href={guidance.mode==='MVP'&&guidance.status==='FINISHED'?`/app/cases/${caseRecord.id}/postcheck?session=${guidance.id}`:`/app/cases/${caseRecord.id}/options`}>{guidance.mode==='MVP'&&guidance.status==='FINISHED'?'Hậu kiểm kiện':'Về phương án'}</Link></div></section>:<>
    <div className="guidance-progress" aria-label="Tiến độ đóng gói">{sop.steps.map((s,i)=><span key={s.id} className={i<index?'done':i===index?'current':''}>{i+1}<small>{s.title}</small></span>)}</div>
    <div className="guided-layout"><section className="panel live-camera"><video ref={video} muted playsInline autoPlay aria-label="Camera đóng gói"/><div className="button-row"><button className="button secondary" disabled={busy} onClick={()=>void start()}><Camera size={16}/>{camera?'Mở lại camera':'Mở camera'}</button><button className="button subtle" onClick={stop}>Tắt camera</button></div>
      <label className="check-label"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);setMonitor(e.target.checked);if(!e.target.checked)cancelCheck();}}/>Cho AI kiểm tra hình ảnh</label>
      <label className="check-label"><input type="checkbox" checked={commands.enabled} disabled={!commands.supported||!enabled} onChange={e=>e.target.checked?commands.enable():commands.disable()}/><Mic size={16}/>Bật micro nhận lệnh</label>
      <p className="field-hint" role="status">{commands.enabled?commands.state:'Micro đang tắt'}{camera&&monitor&&step.mode==='visual'?' · Kiểm ảnh định kỳ':''}</p>
      {commands.error&&<Alert kind="error">{commands.error}</Alert>}
      <details className="privacy-details"><summary>Quyền riêng tư & chế độ kiểm tra</summary><p>AI nhận khung hình qua Google Gemini khi bạn yêu cầu hoặc bật kiểm ảnh định kỳ. Chế độ định kỳ kiểm khoảng 12 giây khi hình thay đổi; không xác minh mọi diễn biến. Không lưu video/âm thanh. Micro dùng nhận giọng của trình duyệt. Tắt camera hoặc rời tab để dừng.</p><label className="check-label"><input type="checkbox" checked={monitor} disabled={!consent} onChange={e=>setMonitor(e.target.checked)}/>Kiểm ảnh định kỳ khi thao tác</label></details>
    </section><section className="panel live-controls live-step"><span className="eyebrow">{guidance.alternativeId||''} · BƯỚC {index+1}/{sop.steps.length}</span>{guidance.mode==='MVP'&&<div className="button-row">{!enabled&&<button className="button primary" disabled={busy||!online} onClick={()=>void control(guidance.executionState==='READY'?'BEGIN':'RESUME')}>{guidance.executionState==='READY'?'Bắt đầu':'Tiếp tục phiên'}</button>}{enabled&&<button className="button secondary" disabled={busy} onClick={()=>void control('PAUSE')}>Tạm dừng</button>}<button className="button subtle" disabled={busy||!online} onClick={()=>void control('END')}>Kết thúc</button></div>}<h2>{step.title}</h2><p>{step.instruction}</p><p className="physical-check">{step.manual}</p>
      <div className="button-row"><button className="button secondary" disabled={busy} onClick={async()=>{setVoice(true);if(!voiceName)await activate();await speak(packingNarration(sop,index));}}><Volume2 size={16}/>Nghe hướng dẫn</button><button className="button subtle" disabled={busy||!enabled} onClick={()=>void mutate('REPORT_ISSUE','BUTTON')}><AlertTriangle size={16}/>Tôi gặp lỗi</button></div>
      <label className="check-label"><input type="checkbox" checked={voice} onChange={e=>setVoice(e.target.checked)}/>Đọc hướng dẫn bằng tiếng Việt</label>
      <label className="field">Âm lượng<input aria-label="Âm lượng hướng dẫn" type="range" min="0" max="1" step="0.1" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label>{voiceNotice&&<p className="field-hint">{voiceNotice}</p>}
      {busy&&<div className="guidance-status" role="status">{phase==='saving'?'Đang lưu…':phase==='positioning'?step.camera_prompt_vi:'AI đang kiểm tra ảnh…'}{countdown!==null&&<strong>Kiểm tra sau {countdown} giây</strong>}{phase!=='saving'&&<button className="button subtle small" onClick={cancelCheck}>Hủy kiểm tra</button>}</div>}
      {(guidance.currentIssue||record?.result&&record.result.status!=='passed')&&<Alert kind="error"><strong>{guidance.currentIssue?'Đang tạm dừng vì lỗi':labels[record!.result!.status]}</strong><p>{record?.result?.reason||guidance.currentIssue?.note}</p><p>{step.remedy_vi}</p>{step.mode==='manual'&&<button className="button secondary" disabled={busy} onClick={()=>void mutate('RESOLVE_ISSUE','BUTTON')}>Tôi đã xử lý lỗi</button>}</Alert>}
      {record?.result?.status==='passed'&&<Alert kind="success">Ảnh đạt phần nhìn thấy. Kiểm tra trực tiếp trước khi chuyển bước.</Alert>}
      {message&&<p role="status">{message}</p>}
      <p className="voice-hint">Nói “Đã xong bước này” để xác nhận. “Nhắc lại”, “Tôi gặp lỗi” hoặc “Dừng lại” khi cần.</p>
      <div className="button-row">{step.mode==='visual'&&<button className="button secondary" disabled={busy||!camera||!consent||!session.aiConfigured} onClick={()=>void check()}>Kiểm tra ảnh</button>}<button className="button primary" disabled={busy||!enabled} onClick={()=>void done('BUTTON')}>Đã xong bước này <ArrowRight size={17}/></button></div>
      <details className="manual-override"><summary>Xác nhận thủ công</summary><label className="check-label"><input type="checkbox" checked={manual} disabled={busy} onChange={e=>setManual(e.target.checked)}/>Tôi đã kiểm tra trực tiếp</label><label>Lý do / ghi nhận<textarea value={manualNote} maxLength={500} onChange={e=>setManualNote(e.target.value)}/></label><button className="button secondary" disabled={busy||!enabled||!manual||step.mode==='visual'&&manualNote.trim().length<10} onClick={()=>void mutate('MANUAL','BUTTON')}>Dùng kiểm tay & tiếp tục</button><button className="button subtle" disabled={busy||!enabled} onClick={()=>void mutate('SKIP','BUTTON')}>Bỏ qua và ghi chưa hoàn tất</button></details>
      <details><summary>Ảnh minh họa & nguồn SOP</summary><img className="guide-reference-image" src={guidance.boundSop?'/illustrations/step-'+({prepare:1,wrap:3,fix:2,padding:3,close:6}[step.id]||1)+'.svg':instructionImage(sop,step,index,caseRecord.input.plant.group)} alt={'Minh họa '+step.title}/><p>{step.source_id} · {step.source_locator}</p><p>{sop.version} · {sop.status==='PUBLISHED'?'đã được duyệt trong phạm vi cấu hình':'nguồn tham khảo chưa duyệt chuyên môn'}.</p>{step.criteria.map(c=><p key={c.id}>{c.visible_pass} Lỗi: {c.visible_fail}</p>)}{sop.reference_notes?.filter(n=>n.step_id===step.id).map(n=><p key={n.source_id}>{n.text}</p>)}</details>
      {!!lastChecked&&<small className="muted">Kiểm ảnh gần nhất {lastChecked}</small>}<details><summary>Âm thanh</summary><p>{audioState}</p><button className="button secondary" onClick={async()=>{setVoice(true);await activate();await speak(packingNarration(sop,index));}}>Dùng giọng AI</button><p>Nội dung đọc được gửi tới Gemini khi dùng giọng AI.</p></details>
    </section></div></>}
  </div>;
}
