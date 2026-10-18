import { parseArgs } from 'node:util';
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// Local operator access only; never expose this through a public API.
const {values}=parseArgs({options:{username:{type:'string'},role:{type:'string'},'data-dir':{type:'string'},help:{type:'boolean'}}});
if(values.help){console.log('node scripts/set-role.mjs --username NAME --role ADMIN|EXPERT|MEMBER|EDITOR|OPERATOR --data-dir ABSOLUTE_DATA_DIRECTORY');process.exit(0);}
if(!values.username||!['ADMIN','EXPERT','MEMBER','EDITOR','OPERATOR'].includes(values.role))throw Error('Specify an existing username and a valid role. Use --help.');
const file=path.resolve(values['data-dir']||process.env.PLANTCARE_DATA_DIR||'.data','plantcare.sqlite');
if(!existsSync(file))throw Error('Database not found. Provide the backend persistent data directory.');
const db=new DatabaseSync(file,{timeout:5000});
try{
  db.exec('BEGIN IMMEDIATE');
  const user=db.prepare('SELECT id,role,status FROM users WHERE username=?').get(values.username);
  if(!user||user.status!=='ACTIVE')throw Error('The account must exist and have a verified phone.');
  if(user.role==='ADMIN'&&values.role!=='ADMIN'&&db.prepare("SELECT COUNT(*) n FROM users WHERE role='ADMIN' AND status='ACTIVE'").get().n<=1)throw Error('Cannot remove the last active admin.');
  db.prepare('UPDATE users SET role=? WHERE id=?').run(values.role,user.id);
  db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
  db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(),'local-operator','ROLE_PROVISIONED',user.id,randomUUID(),new Date().toISOString());
  db.exec('COMMIT');console.log('Role updated; previous sessions revoked. Sign in again.');
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
