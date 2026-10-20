// The application has synchronous transaction callbacks. Keep all statements of
// each callback on one PostgreSQL connection; network I/O runs in this worker.
const { workerData } = require('node:worker_threads');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { Client, types } = require('pg');
types.setTypeParser(20, value => {
  const n=Number(value); if(!Number.isSafeInteger(n))throw new Error('UNSAFE_DATABASE_INTEGER'); return n;
});
const port=workerData.port;
let client, ready=false, chain=Promise.resolve();
async function connect(){
  if(client)return client;
  const url=new URL(workerData.url);
  for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key);
  client=new Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:15000,statement_timeout:20000,query_timeout:25000,application_name:'plantcare'});
  client.on('error',()=>{client=undefined;ready=false;});
  try{await client.connect();}catch(e){client=undefined;throw e;}
  return client;
}
async function initialize(c){
  if(ready)return;
  try{
    const installed=await c.query('SELECT version FROM plantcare.schema_migrations WHERE version=3');
    if(installed.rowCount){ready=true;return;}
  }catch(error){if(error.code!=='42P01'&&error.code!=='3F000')throw error;}
  await c.query('BEGIN');
  try{
    await c.query("SELECT pg_advisory_xact_lock(724684003)");
    await c.query(readFileSync(path.join(__dirname,'postgres-schema.sql'),'utf8'));
    await c.query('COMMIT'); ready=true;
  }catch(e){await c.query('ROLLBACK');throw e;}
}
function translate(sql){
  // Only these three literal JSON paths occur in application SQL.
  sql=sql.replace(/json_extract\(body,\s*'\$\.(leaseUntil|version|caseId)'\)/g,(_,key)=>key==='caseId'?"(body::jsonb->>'caseId')":`((body::jsonb->>'${key}')::bigint)`);
  let n=0,quoted=false,result='';
  for(let i=0;i<sql.length;i++){
    const ch=sql[i];
    if(ch==="'"){
      result+=ch;
      if(quoted&&sql[i+1]==="'"){result+=sql[++i];continue;}
      quoted=!quoted;
    }else result+=ch==='?'&&!quoted?'$'+(++n):ch;
  }
  return result;
}
async function execute(message){
  if(message.operation==='close'){if(client)await client.end();client=undefined;ready=false;return null;}
  // Never report a commit on a replacement connection after a network loss.
  if(/^(COMMIT|ROLLBACK)$/i.test(message.sql.trim())&&!client)throw Object.assign(new Error('Transaction connection lost.'),{code:'DATABASE_TRANSACTION_LOST'});
  const c=await connect();await initialize(c);
  // SET LOCAL works with Neon's transaction pooler; never rely on session SET.
  const sql=message.sql.trim(),control=/^(BEGIN IMMEDIATE|COMMIT|ROLLBACK)$/i.test(sql);
  if(/^BEGIN IMMEDIATE$/i.test(sql)){
    await c.query('BEGIN');
    try{await c.query('SET LOCAL search_path TO plantcare, public');await c.query('SELECT pg_advisory_xact_lock(724684004)');}
    catch(e){await c.query('ROLLBACK');throw e;}
    return {rows:[],rowCount:0};
  }
  if(control){await c.query(sql);return {rows:[],rowCount:0};}
  // Qualify tables instead of relying on session state in transaction pooling.
  const tables='schema_migrations|users|sessions|challenges|otp_locks|documents|shares|idempotency|completions|movements|outbox|audit|limits|ai_calls|private_files';
  const qualified=translate(sql).replace(new RegExp(`\\b(FROM|JOIN|INTO|UPDATE)\\s+(${tables})\\b`,'gi'),'$1 plantcare.$2');
  const params=(message.params||[]).map(v=>v instanceof Uint8Array?Buffer.from(v):v);
  const result=await c.query(qualified,params);
  return {rows:result.rows,rowCount:result.rowCount};
}
port.on('message',message=>{
  chain=chain.then(async()=>{
    let reply;
    try{reply={value:await execute(message)};}
    catch(error){reply={error:{name:'DatabaseError',code:error.code||'DATABASE_UNAVAILABLE'}};}
    port.postMessage(reply);
    const signal=new Int32Array(message.signal);Atomics.store(signal,0,1);Atomics.notify(signal,0);
  });
});
