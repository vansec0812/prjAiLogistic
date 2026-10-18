import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const suffix=randomUUID().slice(0,8),container='plantcare-smoke-'+suffix,volume=container+'-data',image=process.argv[2]||'plantcare-backend:flow-v2';
function docker(args,quiet=false){return execFileSync('docker',args,{encoding:'utf8',stdio:quiet?['ignore','pipe','pipe']:['ignore','pipe','pipe'],timeout:180000});}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
  docker(['volume','create',volume]);docker(['run','-d','--name',container,'--mount',`type=volume,src=${volume},dst=/data`,'-p','127.0.0.1:3004:3000','-e','APP_ORIGIN=https://frontend-smoke.test','-e','PLANTCARE_OTP_SECRET=SMOKE_ONLY_STABLE_TEST_SECRET_0000000000000000','-e','SMS_ADAPTER_URL=https://sms-smoke.test/send','-e','SMS_ADAPTER_TOKEN=SMOKE_ONLY_TOKEN','-e','GEMINI_API_KEY=SMOKE_ONLY_NO_PROVIDER_CALL','-e','GEMINI_VISION_MODEL=smoke-no-provider','-e','PLANTCARE_REFERENCE_GUIDE_ENABLED=true',image]);
  let ready=false;for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3004/api/v1/health')).ok){ready=true;break;}}catch{}await wait(500);}if(!ready)console.error(docker(['logs','--tail','30',container]));assert(ready,'Container did not become ready.');
  docker(['cp','deploy/smoke-container.cjs',container+':/app/smoke-container.cjs']);console.log(docker(['exec',container,'node','smoke-container.cjs','create']).trim());
  docker(['restart',container]);await wait(10000);console.log(docker(['exec',container,'node','smoke-container.cjs','verify']).trim());
}finally{
  if(!/^plantcare-smoke-[a-f0-9]{8}$/.test(container)||volume!==container+'-data')throw Error('Unsafe smoke cleanup target.');
  try{docker(['rm','-f',container],true);}catch{}try{docker(['volume','rm',volume],true);}catch{}
}
