import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { emptyInput, type CaseRecord } from '../packages/domain/src/index';
import { db, doc, insertDoc, updateDoc, transaction } from '../apps/web/src/server/db';
import { startGuidance, advanceGuidance, ownedGuidance, listGuidance, saveGuidanceCheck, clearGuidanceCheck } from '../apps/web/src/server/guidance';
import { confirmationDecision } from '../apps/web/src/lib/guidance';
import { selectSop, type CheckpointResult } from '../apps/web/src/lib/live-packing';
import { sampleInput } from '../apps/web/src/server/seed';
import { propose } from '../apps/web/src/server/mvp';
const directory=mkdtempSync(path.join(tmpdir(),'plantcare-guidance-'));
const sop=selectSop('potted','POTTED'),context={species:'Cây shop xác nhận',shop_scope_confirmed:true as const,pot_cm:null,height_cm:null,packed_kg:null};
let c:CaseRecord;
beforeAll(()=>{process.env.PLANTCARE_DATA_DIR=directory;process.env.PLANTCARE_MODE='development';for(const id of ['a','b'])db().prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?,?)').run(id,id,id,id,'unused','ACTIVE','MEMBER',new Date().toISOString());});
beforeEach(()=>{process.env.PLANTCARE_MODE='development';delete process.env.PLANTCARE_REFERENCE_GUIDE_ENABLED;delete process.env.PLANTCARE_PHOTO_DEMO_ENABLED;c={id:crypto.randomUUID(),name:'Cây kiểm thử',version:1,status:'DRAFT',input:emptyInput(),selectedVersion:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),demo:false};insertDoc('case',c.id,'a',c,'DRAFT');});
afterAll(()=>{db().close();delete (globalThis as {plantcareDb?:unknown}).plantcareDb;delete process.env.PLANTCARE_DATA_DIR;delete process.env.PLANTCARE_MODE;if(!path.resolve(directory).startsWith(path.resolve(tmpdir())+path.sep)||!path.basename(directory).startsWith('plantcare-guidance-'))throw Error('UNSAFE_CLEANUP');rmSync(directory,{recursive:true});});
const begin=()=>transaction(()=>startGuidance('a',c,{case_version:1,sop_id:sop.id,sop_version:sop.version,context,approved_for_trial:true}));
const confirm=(revision:number,step_id:string,extra={})=>({expected_revision:revision,step_id,action:'CONFIRM',method:'VOICE',manual_checked:true,...extra});
describe('case-bound instructor confirmations',()=>{
  it('rejects explicitly requested photo demos in production before creating a bundle',()=>{process.env.PLANTCARE_MODE='production';expect(()=>propose('a',c,true)).toThrow('Bộ ảnh demo chưa được bật.');expect(doc('case',c.id,'a')).toMatchObject({status:'DRAFT'});});
  it('persists a reported problem and blocks acknowledgement until a manual issue is resolved',()=>{
    let g=begin();g=advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[0].id,{action:'REPORT_ISSUE',manual_checked:false,note:'Chậu bị nứt khi thao tác.'}));expect(g.currentIssue?.stepId).toBe(sop.steps[0].id);expect(g.index).toBe(0);expect(()=>advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[0].id))).toThrow();g=advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[0].id,{action:'RESOLVE_ISSUE',manual_checked:false}));g=advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[0].id));expect(g.index).toBe(1);expect(g.currentIssue).toBeUndefined();
  });
  it('allows explicitly enabled reference coaching with confirmed plant inputs without publishing any SOP',()=>{
    c.input=sampleInput();updateDoc('case',c.id,'a',c,'DRAFT');process.env.PLANTCARE_MODE='production';process.env.PLANTCARE_REFERENCE_GUIDE_ENABLED='true';
    const value={case_version:c.version,sop_id:sop.id,sop_version:sop.version,mode:'REFERENCE',reference_ack:true,context:{...context,species:c.input.plant.name,pot_cm:c.input.plant.potDiameter,height_cm:c.input.plant.height}};
    const g=transaction(()=>startGuidance('a',c,value));expect(g.mode).toBe('REFERENCE');expect(sop.production_enabled).toBe(false);expect(()=>transaction(()=>startGuidance('a',c,{...value,reference_ack:false}))).toThrow();expect(()=>begin()).toThrow();c.input.plant.confirmed=false;updateDoc('case',c.id,'a',c,'DRAFT');expect(()=>transaction(()=>startGuidance('a',c,value))).toThrow();delete process.env.PLANTCARE_REFERENCE_GUIDE_ENABLED;
  });
  it('saves one voice confirmation, rejects replay/stale checkpoint, and never completes case or inventory',()=>{
    const g=begin(),next=advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[0].id));expect(next.index).toBe(1);expect(next.records[sop.steps[0].id].confirmation?.method).toBe('VOICE');
    expect(()=>advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[0].id))).toThrow();expect(()=>advanceGuidance('a',c,g.id,confirm(next.revision,sop.steps[0].id))).toThrow();
    expect(doc<CaseRecord>('case',c.id,'a')?.status).toBe('DRAFT');expect(db().prepare('SELECT COUNT(*) n FROM movements').get()).toEqual({n:0});
  });
  it('requires server-validated passed image or an explicit reasoned manual override',()=>{
    let g=begin();g=advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[0].id));const step=sop.steps[1];
    expect(()=>advanceGuidance('a',c,g.id,confirm(g.revision,step.id))).toThrow();
    const result:CheckpointResult={step_id:step.id,status:'needs_adjustment',observed:'Lỗi thử',reason:'Lỗi thử',manual_check_required:true,criterion_results:[{criterion_id:step.criteria[0].id,status:'needs_adjustment',observation:'Lỗi thử'}]};
    g=saveGuidanceCheck('a',c,g.id,g.revision,step.id,result);expect(()=>advanceGuidance('a',c,g.id,confirm(g.revision,step.id))).toThrow();
    expect(()=>advanceGuidance('a',c,g.id,confirm(g.revision,step.id,{action:'MANUAL',note:'ngắn'}))).toThrow();
    g=advanceGuidance('a',c,g.id,confirm(g.revision,step.id,{action:'MANUAL',note:'Đã kiểm trực tiếp và ghi nhận lý do.'}));expect(g.records[step.id].result?.status).toBe('needs_adjustment');expect(g.index).toBe(2);
  });
  it('invalidates old passes before a recheck; late results cannot land on another step',()=>{
    let g=begin();g=advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[0].id));const step=sop.steps[1],result:CheckpointResult={step_id:step.id,status:'passed',observed:'Thử',reason:'Thử',manual_check_required:true,criterion_results:step.criteria.map(x=>({criterion_id:x.id,status:'passed',observation:'Thử'}))};
    g=saveGuidanceCheck('a',c,g.id,g.revision,step.id,result);clearGuidanceCheck('a',c,g.id,g.revision,step.id);expect(()=>advanceGuidance('a',c,g.id,confirm(g.revision,step.id))).toThrow();
    g=advanceGuidance('a',c,g.id,confirm(g.revision,step.id,{action:'SKIP'}));expect(()=>saveGuidanceCheck('a',c,g.id,g.revision-1,step.id,result)).toThrow();
  });
  it('isolates owners, marks changed inputs stale and blocks terminal/production sessions',()=>{
    const g=begin();expect(()=>ownedGuidance('b',c,g.id)).toThrow();expect(listGuidance('b',c)).toEqual([]);
    c.input.plant.name='Đã sửa';updateDoc('case',c.id,'a',c,'DRAFT');expect(listGuidance('a',c)[0].stale).toBe(true);expect(()=>ownedGuidance('a',c,g.id)).toThrow();
    c.status='PACKED';updateDoc('case',c.id,'a',c,'PACKED');expect(()=>begin()).toThrow();process.env.PLANTCARE_MODE='production';expect(()=>begin()).toThrow();process.env.PLANTCARE_MODE='development';
  });
  it('keeps skipped sessions review-required without declaring shipping complete',()=>{
    let g=begin();for(const step of sop.steps)g=advanceGuidance('a',c,g.id,confirm(g.revision,step.id,{action:'SKIP',method:'BUTTON'}));expect(g.status).toBe('REVIEW_REQUIRED');expect(()=>advanceGuidance('a',c,g.id,confirm(g.revision,sop.steps[4].id))).toThrow();
  });
  it('interprets agreement in the current step without converting a failed image into pass',()=>{
    expect(confirmationDecision(sop.steps[0],undefined)).toBe('CONFIRM');expect(confirmationDecision(sop.steps[1],undefined)).toBe('CHECK');expect(confirmationDecision(sop.steps[1],{kind:'skipped'})).toBe('REPAIR');expect(confirmationDecision(sop.steps[1],{kind:'manual',note:'short'})).toBe('REPAIR');
  });
});
