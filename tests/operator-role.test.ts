import { it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
it('operator provisioning revokes sessions and cannot remove the last admin or promote an unverified account',()=>{
  const root=mkdtempSync(path.join(tmpdir(),'plantcare-role-')),db=new DatabaseSync(path.join(root,'plantcare.sqlite'));
  try{db.exec("CREATE TABLE users(id TEXT,username TEXT,role TEXT,status TEXT);CREATE TABLE sessions(user_id TEXT);CREATE TABLE audit(id TEXT,actor_id TEXT,action TEXT,resource_id TEXT,request_id TEXT,created_at TEXT);INSERT INTO users VALUES('a','owner','MEMBER','ACTIVE'),('b','second','MEMBER','ACTIVE'),('p','pending','MEMBER','PENDING_PHONE');INSERT INTO sessions VALUES('a');");
    const set=(username:string,role:string)=>execFileSync(process.execPath,['scripts/set-role.mjs','--data-dir',root,'--username',username,'--role',role],{stdio:'pipe'});
    set('owner','ADMIN');expect(db.prepare('SELECT COUNT(*) n FROM sessions').get()?.n).toBe(0);expect(()=>set('owner','MEMBER')).toThrow();expect(db.prepare("SELECT role FROM users WHERE id='a'").get()?.role).toBe('ADMIN');expect(()=>set('pending','EXPERT')).toThrow();set('second','ADMIN');set('owner','EXPERT');expect(db.prepare('SELECT COUNT(*) n FROM audit').get()?.n).toBe(3);
  }finally{db.close();if(!path.resolve(root).startsWith(path.resolve(tmpdir())+path.sep)||!path.basename(root).startsWith('plantcare-role-'))throw Error('UNSAFE_CLEANUP');rmSync(root,{recursive:true});}
});
