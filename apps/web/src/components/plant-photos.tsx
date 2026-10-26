'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, ScanLine } from 'lucide-react';
import type { PlantInput } from '@plantcare/domain';
import { api, useLoad, useSession, Alert } from './common';
import { visionSchema, type PlantRecognition } from '../lib/plant-recognition';
import { demoPlantProfiles } from '../lib/demo-plant-profile';

/** Bound client uploads also fit comfortably through a deployment proxy. */
async function preparePhoto(file:File):Promise<File>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Chọn ảnh JPEG, PNG hoặc WebP.');
  if(file.size>10*1024*1024)throw new Error('Ảnh tối đa 10 MB.');
  const bitmap=await createImageBitmap(file);try{
    if(bitmap.width*bitmap.height>30000000)throw new Error('Ảnh quá lớn, chọn ảnh dưới 30 megapixel.');
    const scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Không xử lý được ảnh.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',0.85));canvas.width=canvas.height=0;
    if(!blob||blob.size>3*1024*1024)throw new Error('Ảnh còn quá lớn, chọn ảnh nhỏ hơn.');return new File([blob],'plant.jpg',{type:'image/jpeg'});
  }finally{bitmap.close();}
}
export function PlantPhotos({caseId,plant,onResult,onSample,onPhotoChange,onBusyChange}:{caseId:string;plant:PlantInput;onPhotoChange?:()=>void;onBusyChange?:(busy:boolean)=>void;onResult:(result:PlantRecognition,snapshot:PlantInput)=>void;onSample?:(snapshot:PlantInput,sampleId:string)=>void}){
  const {session}=useSession(),{data,reload}=useLoad<{id:string;purpose:string}[]>('uploads?case_id='+caseId);
  const [accepted,setAccepted]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
  const [camera,setCamera]=useState(false),[opening,setOpening]=useState(false),video=useRef<HTMLVideoElement|null>(null),stream=useRef<MediaStream|null>(null),cameraSerial=useRef(0);
  const alive=useRef(true),serial=useRef(0),controller=useRef<AbortController|null>(null),latest=useRef({plant,onResult,onSample});latest.current={plant,onResult,onSample};
  function stopCamera(){cameraSerial.current++;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(video.current)video.current.srcObject=null;if(alive.current){setCamera(false);setOpening(false);}}
  useEffect(()=>{alive.current=true;const hidden=()=>{if(document.hidden)stopCamera();};document.addEventListener('visibilitychange',hidden);return()=>{alive.current=false;serial.current++;controller.current?.abort();stopCamera();document.removeEventListener('visibilitychange',hidden);};},[]);
  useEffect(()=>{if(camera&&video.current){video.current.srcObject=stream.current;void video.current.play().catch(()=>{});}},[camera]);
  async function openCamera(){if(opening||busy)return;stopCamera();const token=++cameraSerial.current;setOpening(true);setError('');try{
    const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920}},audio:false});
    if(!alive.current||token!==cameraSerial.current){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;setCamera(true);
  }catch{if(alive.current&&token===cameraSerial.current)setError('Không mở được camera. Cấp quyền camera hoặc tải ảnh lên.');}finally{if(alive.current&&token===cameraSerial.current)setOpening(false);}}
  async function capture(){const v=video.current;if(!v?.videoWidth||v.readyState<2){setError('Chờ camera có hình rồi chụp lại.');return;}
    const canvas=document.createElement('canvas');canvas.width=v.videoWidth;canvas.height=v.videoHeight;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.drawImage(v,0,0);
    const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/jpeg',0.9));canvas.width=canvas.height=0;stopCamera();if(blob&&alive.current)await upload([new File([blob],'camera.jpg',{type:'image/jpeg'})]);
  }
  const photos=(data||[]).filter(p=>p.purpose==='PLANT');
  async function recognize(ids:string[],snapshot:PlantInput,token:number){
    if((session.development||session.photoDemoEnabled)&&latest.current.onSample){
      const sample=await api<{sampleId:string|null}>(`cases/${caseId}/plant-demo`,{method:'POST',signal:controller.current?.signal,body:JSON.stringify({upload_id:ids[0]})},session.csrf);
      if(!alive.current||token!==serial.current)return;
      if(sample.sampleId&&demoPlantProfiles[sample.sampleId]){latest.current.onSample(snapshot,sample.sampleId);setNotice('Đã điền thông số mẫu. Kiểm tra và xác nhận.');return;}
    }
    if(!session.aiConfigured){setNotice('AI chưa kết nối. Bạn có thể nhập thông tin bên dưới.');return;}
    const consent=await api<{id:string}>('consents',{method:'POST',body:JSON.stringify({purpose:'AI_ANALYSIS',accepted:true}),signal:controller.current?.signal},session.csrf);
    const job=await api<{job_id:string}>(`cases/${caseId}/plant-analysis`,{method:'POST',signal:controller.current?.signal,body:JSON.stringify({upload_ids:ids,consent_id:consent.id})},session.csrf);
    for(let i=0;i<60;i++){
      if(!alive.current||token!==serial.current)return;
      const value=await api<{status:string;result:unknown;error?:string}>('jobs/'+job.job_id,{signal:controller.current?.signal});
      if(!alive.current||token!==serial.current)return;
      if(value.status==='SUCCEEDED'){
        const result=visionSchema.parse(value.result);latest.current.onResult(result,snapshot);
        const readings=result.plant_details?.readings||[],hasEstimates=readings.some(r=>r.origin==='VISUAL_ESTIMATE');
        setNotice(result.schema_version==='vision-v3'?(result.image_quality==='CLEAR'?'Kiểm tra và bổ sung thông tin.':'Chụp lại rõ toàn cây và chậu ở nơi đủ sáng, hoặc nhập tay.'):!result.plant_candidates.some(c=>c.group!=='UNKNOWN')&&!readings.some(r=>r.value!==null)?'Chưa nhìn rõ cây và chậu. Chụp lại toàn cây hoặc nhập tay.':hasEstimates?'AI đã điền thông tin và ước tính thông số. Kiểm tra lại trước khi xác nhận.':'Đã tự điền thông tin nhận diện. Kiểm tra số đo rồi xác nhận.');return;
      }
      if(['FAILED','CANCELLED'].includes(value.status))throw new Error('Chưa nhận diện được ảnh. Chụp rõ toàn cây và chậu rồi thử lại, hoặc nhập tay.');
      await new Promise(resolve=>setTimeout(resolve,800));
    }throw new Error('AI phản hồi chậm. Bạn có thể thử nhận diện lại hoặc nhập tay.');
  }
  async function upload(files:FileList|File[]|null){
    if(!files?.length||busy||!accepted)return;onPhotoChange?.();const snapshot=structuredClone(latest.current.plant),token=++serial.current;controller.current=new AbortController();setBusy(true);setError('');setNotice('');
    try{const ids:string[]=[];for(const file of Array.from(files).slice(0,1)){const data=new FormData();data.set('file',await preparePhoto(file));data.set('case_id',caseId);data.set('purpose','PLANT');data.set('storage_consent','true');const saved=await api<{id:string}>('uploads',{method:'POST',body:data,signal:controller.current.signal},session.csrf);ids.push(saved.id);}await reload();if(alive.current&&token===serial.current)await recognize(ids,snapshot,token);}
    catch(e){if(alive.current&&token===serial.current)setError((e as Error).message);}finally{if(alive.current&&token===serial.current)setBusy(false);}
  }
  async function retry(){if(busy||!photos.length||!accepted)return;const token=++serial.current;controller.current=new AbortController();setBusy(true);setError('');try{await recognize(photos.slice(0,1).map(p=>p.id),structuredClone(latest.current.plant),token);}catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}}
  return <section className="panel form-panel photo-panel"><div className="form-panel-heading"><span className="section-icon"><ScanLine size={21}/></span><div><h2>Ảnh cây & chậu</h2><p>Chụp rõ toàn cây và chậu để AI nhận diện.</p></div></div>
    <label className="check-label"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>Cho phép lưu ảnh cây và gửi AI nhận diện</label><div className="photo-upload-row"><label className="upload-zone"><Upload size={25}/><strong>Tải ảnh & nhận diện</strong><input aria-label="Tải ảnh cây" type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={busy||!accepted} onChange={e=>{void upload(e.target.files);e.target.value='';}}/></label><button className="upload-zone camera-zone" type="button" disabled={busy||opening||!accepted} onClick={()=>void openCamera()}><Camera size={25}/><strong>{opening?'Đang mở camera…':'Chụp & nhận diện'}</strong></button>
    {photos.map(p=><div className="upload-preview" key={p.id}><img src={'/api/v1/uploads/'+p.id} alt="Ảnh cây đã tải"/><button className="icon-button" aria-label="Xóa ảnh cây" disabled={busy} onClick={async()=>{try{await api('uploads/'+p.id,{method:'DELETE'},session.csrf);await reload();}catch(e){setError((e as Error).message);}}}><X size={15}/></button></div>)}</div>
    {camera&&<div className="plant-camera"><video ref={video} autoPlay muted playsInline aria-label="Camera chụp cây"/><div className="button-row"><button className="button primary" disabled={busy} onClick={()=>void capture()}>Chụp ảnh này</button><button className="button secondary" onClick={stopCamera}>Đóng camera</button></div></div>}
    {busy&&<p role="status" className="recognition-status">Đang quét ảnh và tự điền…</p>}{notice&&<Alert kind="info">{notice}</Alert>}{error&&<Alert kind="error">{error}</Alert>}
    {!!photos.length&&<button className="button secondary small" disabled={busy||!session.aiConfigured&&!(session.development||session.photoDemoEnabled)||!accepted} onClick={()=>void retry()}>Nhận diện lại</button>}
  </section>;
}
