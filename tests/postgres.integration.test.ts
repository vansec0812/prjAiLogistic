import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db, doc, insertDoc, transaction, updateDoc } from '../apps/web/src/server/db';
import { postgresDatabase } from '../apps/web/src/server/postgres';
import { readPrivateFile, writePrivateFile, deletePrivateFile } from '../apps/web/src/server/private-files';
import { NextRequest } from 'next/server';
import { hashSync } from 'bcryptjs';
import sharp from 'sharp';
import { handle } from '../apps/web/src/server/api';
import { docs } from '../apps/web/src/server/db';
import type { Upload } from '../apps/web/src/server/jobs';
import { sha } from '../apps/web/src/server/security';

// Explicit opt-in: creates and removes only UUID-scoped disposable fixtures.
describe.skipIf(process.env.PLANTCARE_POSTGRES_TEST!=='1')('real PostgreSQL persistence',()=>{
  const owner='test-'+randomUUID().replaceAll('-','').slice(0,20),id=randomUUID(),file=id+'.webp';
  const password=randomUUID()+randomUUID(),origin='https://app.test';
  const globals=globalThis as typeof globalThis&{plantcareDb?:ReturnType<typeof db>};
  beforeAll(()=>{
    globals.plantcareDb?.close();globals.plantcareDb=undefined;
    process.env.PLANTCARE_STORAGE='postgres';
    process.env.VERCEL='1';process.env.PLANTCARE_MODE='production';process.env.APP_ORIGIN=origin;process.env.PLANTCARE_OTP_SECRET=randomUUID()+randomUUID();
    db().prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?,?)').run(owner,owner,'+'+Date.now()+String(Math.random()).slice(2,5),'Disposable fixture',hashSync(password,4),'ACTIVE','MEMBER',new Date().toISOString());
  });
  afterAll(()=>{
    try{
      deletePrivateFile('uploads',file);
      for(const u of docs<Upload>('upload',owner))deletePrivateFile('uploads',u.file);
      db().prepare('DELETE FROM sessions WHERE user_id=?').run(owner);
      db().prepare('DELETE FROM documents WHERE owner_id=?').run(owner);
      db().prepare('DELETE FROM audit WHERE actor_id=?').run(owner);
      db().prepare('DELETE FROM limits WHERE bucket=?').run('login:'+sha(owner));
      db().prepare('DELETE FROM users WHERE id=?').run(owner);
    }finally{globals.plantcareDb?.close();globals.plantcareDb=undefined;for(const k of ['PLANTCARE_STORAGE','VERCEL','PLANTCARE_MODE','APP_ORIGIN','PLANTCARE_OTP_SECRET'])delete process.env[k];}
  });
  it('retains JSON snapshots, numeric comparisons and optimistic updates',()=>{
    insertDoc('test',id,owner,{id,version:1,leaseUntil:Date.now()-1000});
    expect(doc<{version:number}>('test',id,owner)?.version).toBe(1);
    expect(updateDoc('test',id,owner,{id,version:2},'ACTIVE',1)).toBe(1);
    expect(updateDoc('test',id,owner,{id,version:3},'ACTIVE',1)).toBe(0);
    expect(db().prepare("SELECT body FROM documents WHERE owner_id=? AND json_extract(body,'$.version')>?").all(owner,1)).toHaveLength(1);
  });
  it('rolls back every document and private file change in a transaction',()=>{
    expect(()=>transaction(()=>{
      updateDoc('test',id,owner,{id,version:9});
      writePrivateFile('uploads',file,Buffer.from('private image fixture'));
      throw new Error('rollback fixture');
    })).toThrow('rollback fixture');
    expect(doc<{version:number}>('test',id,owner)?.version).toBe(2);
    expect(()=>readPrivateFile('uploads',file)).toThrow('PRIVATE_FILE_NOT_FOUND');
  });
  it('reads private bytes from a fresh database connection and enforces immutable versions',()=>{
    writePrivateFile('uploads',file,Buffer.from('persisted across instances'));
    globals.plantcareDb?.close();globals.plantcareDb=undefined;
    expect(readPrivateFile('uploads',file).toString()).toBe('persisted across instances');
    const plan=randomUUID();insertDoc('plan',plan,owner,{id:plan});
    expect(()=>updateDoc('plan',plan,owner,{id:plan,changed:true})).toThrow();
    const independent=postgresDatabase(process.env.DATABASE_URL!);
    try{expect(independent.prepare('SELECT COUNT(*) AS n FROM documents WHERE owner_id=?').get(owner)?.n).toBe(2);}
    finally{independent.close();}
  });
  it('serves production auth, CSRF-protected case creation and private image bytes',async()=>{
    const request=(route:string,method='GET',value?:unknown,cookie='',csrf='')=>handle(new NextRequest(origin+'/api/v1/'+route,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{}),...(value instanceof FormData?{}:{'Content-Type':'application/json'})},...(value===undefined?{}:{body:value instanceof FormData?value:JSON.stringify(value)})}),route.split('/'));
    expect((await request('auth/dev','POST',{})).status).toBe(404);
    const login=await request('auth/login','POST',{username:owner,password});expect(login.status).toBe(200);
    expect(login.headers.get('set-cookie')).toContain('Secure');expect(login.headers.get('set-cookie')).toContain('HttpOnly');
    const cookie=login.headers.get('set-cookie')!.split(';')[0],csrf=(await login.json()).data.csrf;
    expect((await request('cases','POST',{name:'Missing CSRF'},cookie)).status).toBe(403);
    const created=await request('cases','POST',{name:'Disposable cloud case'},cookie,csrf);expect(created.status).toBe(201);const c=(await created.json()).data;
    const form=new FormData();form.set('case_id',c.id);form.set('purpose','PLANT');form.set('storage_consent','true');form.set('file',new Blob([new Uint8Array(await sharp({create:{width:30,height:30,channels:3,background:'#22aa55'}}).png().toBuffer())],{type:'image/png'}),'fixture.png');
    const uploaded=await request('uploads','POST',form,cookie,csrf);expect(uploaded.status).toBe(201);const u=(await uploaded.json()).data;
    expect((await request('uploads/'+u.id)).status).toBe(401);
    const image=await request('uploads/'+u.id,'GET',undefined,cookie);expect(image.status).toBe(200);expect((await image.arrayBuffer()).byteLength).toBeGreaterThan(0);
    globals.plantcareDb?.close();globals.plantcareDb=undefined;
    expect((await request('cases/'+c.id,'GET',undefined,cookie)).status).toBe(200);
  });
});
