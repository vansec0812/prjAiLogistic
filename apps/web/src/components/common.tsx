'use client';
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { Leaf, ArrowRight, AlertCircle, CheckCircle2, LoaderCircle, X, ShieldCheck, Sprout } from 'lucide-react';
import Link from 'next/link';

export interface Session {user:{id:string;name:string;username:string;role:string}|null;csrf:string|null;development:boolean;photoDemoEnabled?:boolean;aiConfigured:boolean;referenceGuideEnabled?:boolean;}
export class ClientError extends Error {constructor(message:string,public status:number,public code:string,public fields?:Record<string,string>){super(message);}}
export const SessionContext=createContext<{session:Session;refresh:()=>Promise<void>;toast:(message:string)=>void}>({session:{user:null,csrf:null,development:false,aiConfigured:false},refresh:async()=>{},toast:()=>{}});
export const useSession=()=>useContext(SessionContext);
export async function api<T>(url:string,options:RequestInit={},csrf?:string|null):Promise<T>{
  const headers=new Headers(options.headers);if(options.body&&!(options.body instanceof FormData))headers.set('Content-Type','application/json');if(csrf)headers.set('x-csrf-token',csrf);
  let response:Response;try{response=await fetch('/api/v1/'+url,{...options,headers,cache:'no-store'});}catch{throw new ClientError('Mất kết nối. Nội dung tại trang được giữ; hãy thử lại.',0,'OFFLINE');}
  let value;try{value=await response.json();}catch{throw new ClientError(response.status===413?'Ảnh quá lớn. Chọn ảnh nhỏ hơn.':'Dịch vụ phản hồi không hợp lệ. Thử lại sau.',response.status,'INVALID_RESPONSE');}if(!response.ok)throw new ClientError(value.error?.message||'Không thể xử lý yêu cầu.',response.status,value.error?.code||'ERROR',value.error?.field_errors);return value.data as T;
}
export function useLoad<T>(url:string){
  const [data,setData]=useState<T|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const revision=useRef(0);
  const load=async()=>{const token=++revision.current;setLoading(true);try{const value=await api<T>(url);if(token===revision.current){setData(value);setError('');}}catch(e){if(token===revision.current)setError(e instanceof Error?e.message:'Không thể tải dữ liệu.');}finally{if(token===revision.current)setLoading(false);}};
  useEffect(()=>{void load();return()=>{revision.current++;};},[url]);return {data,error,loading,reload:load,setData};
}
export function Logo({small=false}:{small?:boolean}){return <Link className="brand" href="/"><span className="brand-symbol"><Leaf size={small?21:25} strokeWidth={1.8}/></span><span>PlantCare<span className="brand-dot">.</span></span></Link>;}
export function Spinner(){return <div className="loading" role="status"><LoaderCircle className="spin" size={28}/><span>Đang tải dữ liệu…</span></div>;}
export function Alert({children,kind='warning'}:{children:ReactNode;kind?:'warning'|'error'|'success'|'info'}){return <div className={`alert ${kind}`} role={kind==='error'?'alert':'status'}>{kind==='success'?<CheckCircle2 size={19}/>:kind==='info'?<ShieldCheck size={19}/>:<AlertCircle size={19}/>}<div>{children}</div></div>;}
export function Empty({title,description,action}:{title:string;description:string;action?:ReactNode}){return <div className="empty"><span className="empty-icon"><Sprout size={34}/></span><h3>{title}</h3><p>{description}</p>{action}</div>;}
export const statusLabels:Record<string,string>={DRAFT:'Bản nháp',PLAN_READY:'Có phương án',NEEDS_INPUT:'Cần bổ sung',NEEDS_EXPERT:'Cần chuyên gia',PACKING:'Đang đóng gói',PACKED:'Đã đóng gói',SHIPPED:'Đã bàn giao',RECEIVED:'Đã nhận',PASS:'Vượt kiểm tra',WARN_ACK:'Cần xác nhận cảnh báo',FAIL:'Không phù hợp',STALE:'Dữ liệu đã thay đổi',OPEN:'Đang chờ xử lý'};
export function Badge({status}:{status:string}){return <span className={`badge badge-${status.toLowerCase()}`}><span className="status-dot"/>{statusLabels[status]||status}</span>;}
export const date=(value:string,full=false)=>new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',...(full?{year:'numeric',hour:'2-digit',minute:'2-digit'}:{})}).format(new Date(value));
export const money=(value:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(value);
export const number=(value:number|null)=>value===null?'Chưa biết':new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(value);
export const num=(value:string)=>{if(!value.trim())return null;const n=Number(value.replace(',','.'));return Number.isFinite(n)?n:null;};
export function Field({label,required,hint,children}:{label:string;required?:boolean;hint?:string;children:ReactNode}){return <label className="field"><span className="field-label">{label}{required&&<span className="required"> *</span>}</span>{children}{hint&&<span className="field-hint">{hint}</span>}</label>;}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
  useEffect(()=>{const old=document.activeElement as HTMLElement|null;const modal=document.querySelector<HTMLElement>('.modal');modal?.focus();const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='Tab'&&modal){const items=[...modal.querySelectorAll<HTMLElement>('button,a,input,select,textarea,[tabindex="0"]')].filter(el=>!el.hasAttribute('disabled'));if(!items.length)return;const first=items[0],last=items.at(-1)!;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener('keydown',escape);return()=>{document.removeEventListener('keydown',escape);old?.focus();};},[]);
  return <div className="modal-backdrop" onClick={onClose}><section className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onClick={e=>e.stopPropagation()}><header><h2>{title}</h2><button className="icon-button" aria-label="Đóng" onClick={onClose}><X size={20}/></button></header>{children}</section></div>;
}
export function PageHeading({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:ReactNode}){return <div className="page-heading"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>;}
export function ArrowLink({href,children}:{href:string;children:ReactNode}){return <Link className="text-link" href={href}>{children}<ArrowRight size={16}/></Link>;}
