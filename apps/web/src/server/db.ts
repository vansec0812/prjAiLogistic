import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { postgresDatabase, type Database } from './postgres';

export const development = () => process.env.NODE_ENV !== 'production' && process.env.PLANTCARE_MODE !== 'production';
export const dataDir = () => process.env.PLANTCARE_DATA_DIR || path.resolve(/* turbopackIgnore: true */ process.cwd(), process.cwd().endsWith(path.join('apps','web'))?'../../.data':'.data');
const globalDb = globalThis as typeof globalThis & { plantcareDb?: Database };
export function db(){
  if(globalDb.plantcareDb&&!globalDb.plantcareDb.closed)return globalDb.plantcareDb;
  if(process.env.PLANTCARE_STORAGE==='postgres'){
    if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.');
    return globalDb.plantcareDb=postgresDatabase(process.env.DATABASE_URL);
  }
  mkdirSync(dataDir(),{recursive:true});
  const d=new DatabaseSync(path.join(dataDir(),'plantcare.sqlite'),{timeout:5000});
  d.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, phone TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password TEXT NOT NULL, status TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'MEMBER', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), purpose TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, used INTEGER NOT NULL DEFAULT 0, sent_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS otp_locks(user_id TEXT NOT NULL REFERENCES users(id),purpose TEXT NOT NULL,locked_until INTEGER NOT NULL,PRIMARY KEY(user_id,purpose));
    CREATE TABLE IF NOT EXISTS documents(kind TEXT NOT NULL, id TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES users(id), version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL, body TEXT NOT NULL CHECK(json_valid(body)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(kind,id));
    CREATE INDEX IF NOT EXISTS docs_owner ON documents(kind,owner_id,updated_at,id);
    CREATE INDEX IF NOT EXISTS docs_status ON documents(kind,status,updated_at);
    CREATE TRIGGER IF NOT EXISTS immutable_plan BEFORE UPDATE ON documents WHEN OLD.kind='plan' BEGIN SELECT RAISE(ABORT,'plan version is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS immutable_mvp BEFORE UPDATE ON documents WHEN OLD.kind IN ('mvp-bundle','mvp-config') BEGIN SELECT RAISE(ABORT,'MVP version is immutable'); END;
    CREATE TABLE IF NOT EXISTS shares(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), version_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS idempotency(owner_id TEXT NOT NULL, endpoint TEXT NOT NULL, key TEXT NOT NULL, request_hash TEXT NOT NULL, response TEXT NOT NULL CHECK(json_valid(response)), PRIMARY KEY(owner_id,endpoint,key));
    CREATE TABLE IF NOT EXISTS completions(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), case_id TEXT NOT NULL, version_id TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(case_id,version_id));
    CREATE TABLE IF NOT EXISTS movements(id TEXT PRIMARY KEY, completion_id TEXT NOT NULL REFERENCES completions(id), material_id TEXT NOT NULL, quantity TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(completion_id,material_id));
    CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY, job_id TEXT NOT NULL UNIQUE, dispatched_at TEXT);
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, resource_id TEXT NOT NULL, request_id TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_calls(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, day TEXT NOT NULL, status TEXT NOT NULL, usage TEXT NOT NULL, created_at TEXT NOT NULL);
    INSERT OR IGNORE INTO schema_migrations VALUES(1,datetime('now'));
    INSERT OR IGNORE INTO schema_migrations VALUES(2,datetime('now'));
  `);
  globalDb.plantcareDb=d; return d;
}
export function transaction<T>(fn:()=>T):T{const d=db();d.exec('BEGIN IMMEDIATE');try{const result=fn();d.exec('COMMIT');return result;}catch(e){d.exec('ROLLBACK');throw e;}}
export function insertDoc(kind:string,id:string,owner:string,body:unknown,status='ACTIVE'){
  const now=new Date().toISOString();db().prepare('INSERT INTO documents(kind,id,owner_id,status,body,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(kind,id,owner,status,JSON.stringify(body),now,now);
}
export function doc<T>(kind:string,id:string,owner?:string):T|null{
  const row=(owner?db().prepare('SELECT body FROM documents WHERE kind=? AND id=? AND owner_id=?').get(kind,id,owner):db().prepare('SELECT body FROM documents WHERE kind=? AND id=?').get(kind,id)) as {body:string}|undefined;
  return row?JSON.parse(row.body) as T:null;
}
export function docs<T>(kind:string,owner?:string):T[]{
  const rows=(owner?db().prepare('SELECT body FROM documents WHERE kind=? AND owner_id=? ORDER BY updated_at DESC').all(kind,owner):db().prepare('SELECT body FROM documents WHERE kind=? ORDER BY updated_at DESC').all(kind)) as {body:string}[];
  return rows.map(row=>JSON.parse(row.body) as T);
}
export function updateDoc(kind:string,id:string,owner:string,body:unknown,status='ACTIVE',expected?:number){
  const statement=expected===undefined?'UPDATE documents SET body=?,status=?,version=version+1,updated_at=? WHERE kind=? AND id=? AND owner_id=?':'UPDATE documents SET body=?,status=?,version=version+1,updated_at=? WHERE kind=? AND id=? AND owner_id=? AND json_extract(body,\'$.version\')=?';
  const args=[JSON.stringify(body),status,new Date().toISOString(),kind,id,owner];
  return db().prepare(statement).run(...(expected===undefined?args:[...args,expected])).changes;
}
export function audit(actor:string,action:string,resource:string,requestId=randomUUID()){
  db().prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(),actor,action,resource,requestId,new Date().toISOString());
}
