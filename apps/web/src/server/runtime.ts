import path from 'node:path';
import { accessSync, constants } from 'node:fs';
import { db, dataDir } from './db';
import { wakeWorker } from './jobs';

export function validateBackendEnvironment(env:Record<string,string|undefined>){
  const missing=['APP_ORIGIN','PLANTCARE_DATA_DIR','PLANTCARE_OTP_SECRET','SMS_ADAPTER_URL','SMS_ADAPTER_TOKEN','GEMINI_API_KEY','GEMINI_VISION_MODEL'].filter(k=>!env[k]||/^(replace|change|example)/i.test(env[k]!));
  if(missing.length)throw new Error('Missing backend configuration: '+missing.join(', '));
  const origin=new URL(env.APP_ORIGIN!),sms=new URL(env.SMS_ADAPTER_URL!);
  if(origin.protocol!=='https:'||origin.origin!==env.APP_ORIGIN||sms.protocol!=='https:'||sms.username||sms.password)throw new Error('Production origins and SMS must use HTTPS.');
  if(!path.isAbsolute(env.PLANTCARE_DATA_DIR!)||env.PLANTCARE_OTP_SECRET!.length<32||env.PLANTCARE_BACKEND_URL)throw new Error('Backend requires absolute persistent data directory, a stable OTP secret and no proxy upstream.');
}
const runtime=globalThis as typeof globalThis&{pcDispatchTimer?:ReturnType<typeof setInterval>};
export function startBackendRuntime(){
  if(runtime.pcDispatchTimer)return;validateBackendEnvironment(process.env);db();accessSync(dataDir(),constants.W_OK);
  wakeWorker();runtime.pcDispatchTimer=setInterval(wakeWorker,5000);runtime.pcDispatchTimer.unref();
}
