import { MessageChannel, receiveMessageOnPort } from 'node:worker_threads';
import path from 'node:path';
import type { createWorker as WorkerFactory } from '@plantcare/postgres-store';

type Parameter=string|number|bigint|null|Uint8Array;
interface Result {rows:Record<string,unknown>[];rowCount:number;}
export interface Database {
  readonly closed?:boolean;
  exec(sql:string):void;
  prepare(sql:string):{
    run(...params:Parameter[]):{changes:number|bigint};
    get(...params:Parameter[]):Record<string,unknown>|undefined;
    all(...params:Parameter[]):Record<string,unknown>[];
  };
  close():void;
}
// Compatibility boundary for the existing synchronous transaction API. This
// blocks the caller during SQL I/O; keep it to the current small MVP workload.
// PostgreSQL is the source of truth; there is no database copy in /tmp.
export function postgresDatabase(url:string):Database{
  if(!/^postgres(?:ql)?:/.test(url))throw new Error('DATABASE_URL must be PostgreSQL.');
  const root=process.cwd().endsWith(path.join('apps','web'))?path.resolve(process.cwd(),'../..'):process.cwd();
  // Load the native runtime package unchanged. Next otherwise rewrites __dirname
  // to a server chunk directory, where the worker's sibling file does not exist.
  const load=process.getBuiltinModule('module').createRequire(path.join(root,'package.json'));
  const {createWorker}=load(path.join(root,'packages/postgres-store/index.cjs')) as {createWorker:typeof WorkerFactory};
  const {port1,port2}=new MessageChannel();
  const worker=createWorker(port2,url);
  worker.unref();port1.unref();
  let closed=false;
  // Avoid an unhandled worker error and never include connection strings in logs.
  worker.on('error',()=>{closed=true;});
  function request(sql:string,params:Parameter[]=[],operation='query'):Result{
    if(closed)throw new Error('DATABASE_CONNECTION_CLOSED');
    const signal=new Int32Array(new SharedArrayBuffer(4));
    port1.postMessage({sql,params,operation,signal:signal.buffer});
    if(Atomics.wait(signal,0,0,45000)==='timed-out'){
      closed=true;void worker.terminate();port1.close();throw new Error('DATABASE_TIMEOUT');
    }
    const reply=receiveMessageOnPort(port1)?.message;
    if(!reply)throw new Error('DATABASE_RESPONSE_MISSING');
    if(reply.error)throw Object.assign(new Error('Database request failed.'),reply.error);
    return reply.value;
  }
  return {
    get closed(){return closed;},
    exec(sql){request(sql);},
    prepare(sql){return {
      run(...params){return {changes:request(sql,params).rowCount||0};},
      get(...params){return request(sql,params).rows[0];},
      all(...params){return request(sql,params).rows;}
    };},
    close(){if(!closed){try{request('',[],'close');}finally{closed=true;port1.close();void worker.terminate();}}}
  };
}
