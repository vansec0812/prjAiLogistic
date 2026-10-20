import { randomBytes, createHash, createHmac, timingSafeEqual, randomInt } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { db, dataDir, development, transaction } from './db';

export class ApiError extends Error {constructor(public status:number,public code:string,message:string,public fields?:Record<string,string>){super(message);}}
export interface User {id:string;username:string;phone:string;name:string;status:string;role:string;}
export const sha=(data:string)=>createHash('sha256').update(data).digest('hex');
export function canonical(value:unknown):string{
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
  return JSON.stringify(value);
}
export const inputHash=(value:unknown)=>sha(canonical(value));
function pepper(){
  if(process.env.PLANTCARE_OTP_SECRET){if(process.env.PLANTCARE_OTP_SECRET.length<32)throw new Error('OTP secret is too short.');return process.env.PLANTCARE_OTP_SECRET;}
  if(process.env.PLANTCARE_STORAGE==='postgres')throw new Error('PLANTCARE_OTP_SECRET is required.');
  mkdirSync(dataDir(),{recursive:true});const file=path.join(dataDir(),'otp-secret');
  if(!existsSync(file))writeFileSync(file,randomBytes(32).toString('hex'),{flag:'wx',mode:0o600});
  return readFileSync(file,'utf8');
}
export const otpHash=(challenge:string,code:string)=>createHmac('sha256',pepper()).update(challenge+':'+code).digest('hex');
export const newOtp=()=>String(randomInt(0,1000000)).padStart(6,'0');
export function equalHash(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function session(req:NextRequest){
  const token=req.cookies.get('pc-session')?.value;if(!token)return null;
  const result=db().prepare('SELECT u.id,u.username,u.phone,u.name,u.status,u.role,s.csrf,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(sha(token)) as (User&{csrf:string;expires_at:number})|undefined;
  return result&&result.expires_at>Date.now()&&result.status==='ACTIVE'?result:null;
}
export function requireUser(req:NextRequest){const u=session(req);if(!u)throw new ApiError(401,'UNAUTHENTICATED','Đăng nhập để tiếp tục.');return u;}
export function checkOrigin(req:NextRequest){
  const origin=req.headers.get('origin');
  const allowed=process.env.APP_ORIGIN?[process.env.APP_ORIGIN]:(development()?['http://127.0.0.1:3000','http://localhost:3000']:[]);
  if(!origin||!allowed.includes(origin))throw new ApiError(403,'CSRF_ORIGIN','Yêu cầu không hợp lệ. Tải lại trang và thử lại.');
}
export function checkMutation(req:NextRequest,user:User&{csrf:string}){checkOrigin(req);if(!equalHash(req.headers.get('x-csrf-token')||'',user.csrf))throw new ApiError(403,'CSRF','Phiên xác nhận hết hạn. Tải lại trang.');}
export function issueSession(user:User,data:unknown){
  const token=randomBytes(32).toString('base64url'),csrf=randomBytes(24).toString('base64url');
  db().prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(sha(token),user.id,csrf,Date.now()+7*86400000,new Date().toISOString());
  const res=NextResponse.json({data:{user:{id:user.id,name:user.name,username:user.username,role:user.role},csrf,...(data as object)},meta:{request_id:crypto.randomUUID()}});
  res.cookies.set('pc-session',token,{httpOnly:true,secure:!development(),sameSite:'lax',path:'/',maxAge:7*86400});return res;
}
export function rateLimit(bucket:string,max:number,windowMs:number){
  transaction(()=>{
    const now=Date.now();const row=db().prepare('SELECT count,reset_at FROM limits WHERE bucket=?').get(bucket) as {count:number;reset_at:number}|undefined;
    if(row&&row.reset_at>now&&row.count>=max)throw new ApiError(429,'RATE_LIMIT','Thử lại sau khi hết thời gian chờ.');
    db().prepare('INSERT INTO limits VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET count=excluded.count,reset_at=excluded.reset_at').run(bucket,row&&row.reset_at>now?row.count+1:1,row&&row.reset_at>now?row.reset_at:now+windowMs);
  });
}
