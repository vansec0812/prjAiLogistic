'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Camera, CheckCircle2 } from 'lucide-react';
import type { CaseRecord } from '@plantcare/domain';
import { api, useSession, useLoad, PageHeading, Spinner, Alert, Empty } from './common';
import { plantProfileIssues } from '../lib/plant-recognition';
import { selectSop, type LiveSop, type LiveStep } from '../lib/live-packing';
import type { GuidanceSession } from '../lib/guidance';

export function instructionImage(sop:LiveSop,step:LiveStep,index:number,group:string){
  const number=sop.plant==='potted'?[1,2,4,3,6][index]:Math.min(index+1,6);
  return group==='FOLIAGE'&&sop.shipping_form==='POTTED'?`/photos/step-${number}-v2.webp`:`/illustrations/step-${number}.svg`;
}
export function PackingResults({caseId}:{caseId:string}){
  const {data:c,error}=useLoad<CaseRecord>('cases/'+caseId),{session}=useSession(),router=useRouter();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),locked=useRef(false),key=useRef('');
  const sop=selectSop('potted','POTTED');
  if(error)return <Alert kind="error">{error}</Alert>;if(!c)return <Spinner/>;
  const issues=plantProfileIssues(c.input.plant);
  if(issues.length)return <Empty title="Hoàn thiện thông tin cây" description={issues.join(' ')} action={<Link className="button primary" href={`/app/cases/${caseId}/plant`}>Sửa thông tin cây</Link>}/>;
  async function begin(){if(!c||locked.current)return;locked.current=true;setBusy(true);setMessage('');key.current||=crypto.randomUUID();
    try{const g=await api<GuidanceSession>(`cases/${caseId}/guidance`,{method:'POST',headers:{'Idempotency-Key':key.current},body:JSON.stringify({case_version:c.version,sop_id:sop.id,sop_version:sop.version,mode:'REFERENCE',reference_ack:true,context:{species:c.input.plant.name,shop_scope_confirmed:true,pot_cm:c.input.plant.potDiameter,height_cm:c.input.plant.height,packed_kg:null}})},session.csrf);router.push(`/app/cases/${caseId}/guide?session=${g.id}`);}catch(e){setMessage((e as Error).message);locked.current=false;setBusy(false);}
  }
  return <><PageHeading eyebrow="HƯỚNG DẪN ĐÓNG GÓI" title={c.input.plant.name} description={`${c.input.plant.height} cm · chậu ${c.input.plant.potDiameter} cm · ${c.input.plant.weight} kg`} action={<Link className="button secondary" href={`/app/cases/${caseId}/plant`}>Sửa thông tin</Link>}/>
    <section className="guide-intro panel"><div><span className="eyebrow">LÀM CÙNG AI</span><h2>Đóng gói từng bước</h2><p>AI đọc hướng dẫn, kiểm ảnh và nhắc bạn sửa khi thấy lỗi. Làm xong, nói “Đã xong bước này” hoặc “Tiếp tục bước tiếp theo”.</p><button className="button primary" disabled={busy||!(session.development||session.referenceGuideEnabled)} onClick={()=>void begin()}><Camera size={18}/>{busy?'Đang mở…':'Bắt đầu với AI'}<ArrowRight size={17}/></button></div><div className="guide-summary"><CheckCircle2 size={24}/><strong>{sop.steps.length} bước đóng gói</strong><span>Có thể xem ảnh và làm thủ công.</span></div></section>
    {message&&<Alert kind="error">{message}</Alert>}{!(session.development||session.referenceGuideEnabled)&&<Alert kind="info">Trợ lý chưa được bật trên máy chủ. Bạn vẫn có thể xem hướng dẫn.</Alert>}
    <div className="instruction-gallery">{sop.steps.map((step,i)=><article className="panel instruction-card" key={step.id}><figure><img loading={i?'lazy':'eager'} src={instructionImage(sop,step,i,c.input.plant.group)} alt={'Minh họa: '+step.title}/><figcaption>{c.input.plant.group==='FOLIAGE'?'Ảnh minh họa AI':'Sơ đồ minh họa'} · bước {i+1}</figcaption></figure><div><span className="eyebrow">BƯỚC {i+1}</span><h2>{step.title}</h2><p>{step.instruction}</p><details><summary>Điều cần kiểm tra</summary><p>{step.manual}</p></details></div></article>)}</div>
    <details className="panel guide-details"><summary>Nguồn và phạm vi hướng dẫn</summary><p>Hướng dẫn tham khảo cho một cây nguyên chậu; không tự xác nhận kiện đủ điều kiện vận chuyển. Loài và yêu cầu dịch vụ cần kiểm tra riêng. Hình minh họa không phải ảnh kiện thực.</p><p>SOP {sop.id} · {sop.version} · chưa duyệt chuyên môn.</p><Link href="/app/knowledge">Tra cứu nguồn</Link></details>
    <div className="button-row"><Link className="button secondary" href={`/app/cases/${caseId}/materials`}>Bổ sung vật tư & hành trình</Link><Link className="button subtle" href={`/app/cases/${caseId}/plans`}>Phương án vận chuyển</Link></div>
  </>;
}
