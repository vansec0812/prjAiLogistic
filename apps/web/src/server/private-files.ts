import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { db, dataDir } from './db';

type Folder='uploads'|'exports';
function key(folder:Folder,name:string){
  if(!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(name))throw new Error('INVALID_PRIVATE_FILE');
  return folder+'/'+name;
}
export function writePrivateFile(folder:Folder,name:string,bytes:Uint8Array){
  const id=key(folder,name);
  if(bytes.byteLength>20*1024*1024)throw new Error('PRIVATE_FILE_TOO_LARGE');
  if(process.env.PLANTCARE_STORAGE==='postgres'){
    db().prepare('INSERT INTO private_files(key,content,created_at) VALUES(?,?,?)').run(id,bytes,new Date().toISOString());return;
  }
  mkdirSync(path.join(dataDir(),folder),{recursive:true});writeFileSync(path.join(dataDir(),folder,name),bytes);
}
export function readPrivateFile(folder:Folder,name:string):Buffer{
  const id=key(folder,name);
  if(process.env.PLANTCARE_STORAGE==='postgres'){
    const row=db().prepare('SELECT content FROM private_files WHERE key=?').get(id) as {content:Uint8Array}|undefined;
    if(!row)throw new Error('PRIVATE_FILE_NOT_FOUND');return Buffer.from(row.content);
  }
  return readFileSync(path.join(dataDir(),folder,name));
}
export function deletePrivateFile(folder:Folder,name:string){
  const id=key(folder,name);
  if(process.env.PLANTCARE_STORAGE==='postgres'){db().prepare('DELETE FROM private_files WHERE key=?').run(id);return;}
  const file=path.join(dataDir(),folder,name);if(existsSync(file))unlinkSync(file);
}
