import { describe, expect, it } from 'vitest';
import { evaluate, draftRulePack } from '../packages/rule-engine/src/index';
import { sampleInput } from '../apps/web/src/server/seed';

describe('Deterministic packing rules',()=>{
  it('requires approval in production',()=>expect(evaluate(sampleInput()).outcome).toBe('NEEDS_EXPERT'));
  it('creates six illustrated, traced steps for confirmed local data',()=>{
    const input=sampleInput(),before=structuredClone(input),p=evaluate(input,draftRulePack,true);
    expect(p.outcome).toBe('WARN_ACK');expect(p.steps).toHaveLength(6);
    expect(p.package).toEqual({length:34,width:34,height:59,weight:4.01});
    expect(p.cost).toEqual({known:39000,completeness:'PARTIAL'});
    expect(p.trace.every(t=>t.version===draftRulePack.version)).toBe(true);
    expect(input).toEqual(before);expect(evaluate(input,draftRulePack,true)).toEqual(p);
  });
  it('rejects a box below the dimensional boundary',()=>{
    const i=sampleInput();Object.assign(i.materials[0],{length:33.99,width:34,height:59});
    expect(evaluate(i,draftRulePack,true).outcome).toBe('FAIL');
    i.materials[0].length=34;expect(evaluate(i,draftRulePack,true).outcome).toBe('WARN_ACK');
  });
  it('does not treat unknown load as zero or a passing box',()=>{
    const i=sampleInput();i.materials[0].maxLoad=null;
    const p=evaluate(i,draftRulePack,true);expect(p.outcome).toBe('NEEDS_INPUT');expect(p.package.weight).toBeNull();
  });
  it('uses exact decimal load comparisons',()=>{
    const i=sampleInput();i.materials[0].maxLoad=4.01;
    expect(evaluate(i,draftRulePack,true).outcome).toBe('WARN_ACK');
    i.materials[0].maxLoad=4.009;expect(evaluate(i,draftRulePack,true).outcome).toBe('FAIL');
  });
  it.each(['height','length','width','potDiameter','potHeight','weight'] as const)('requires actual %s',key=>{
    const i=sampleInput();i.plant[key]=null;expect(evaluate(i,draftRulePack,true).outcome).toBe('NEEDS_INPUT');
  });
  it('blocks unconfirmed measurements and materials',()=>{
    const i=sampleInput();i.plant.confirmed=false;expect(evaluate(i,draftRulePack,true).outcome).toBe('NEEDS_INPUT');
    i.plant.confirmed=true;i.materials[1].confirmed=false;expect(evaluate(i,draftRulePack,true).outcome).toBe('NEEDS_INPUT');
  });
  it('never invents unavailable fixing supplies',()=>{
    const i=sampleInput();i.materials[2].quantity=0;const p=evaluate(i,draftRulePack,true);
    expect(p.outcome).toBe('NEEDS_INPUT');expect(p.missingMaterials).toHaveLength(1);
  });
  it('rejects contradictory pot and overall heights',()=>{
    const i=sampleInput();i.plant.potHeight=60;expect(evaluate(i,draftRulePack,true).outcome).toBe('NEEDS_INPUT');
  });
  it('routes unknown and high risk plants to expert review',()=>{
    const i=sampleInput();i.plant.group='UNKNOWN';expect(evaluate(i,draftRulePack,true).outcome).toBe('NEEDS_EXPERT');
    i.plant.group='FOLIAGE';i.plant.fragility='HIGH';expect(evaluate(i,draftRulePack,true).outcome).toBe('NEEDS_EXPERT');
  });
  it('requires weather provenance and ordered min/max',()=>{
    const i=sampleInput();i.shipment.weatherSource='';expect(evaluate(i,draftRulePack,true).outcome).toBe('NEEDS_INPUT');
    i.shipment.weatherSource='manual';i.shipment.minTemp=32;i.shipment.maxTemp=24;expect(evaluate(i,draftRulePack,true).outcome).toBe('NEEDS_INPUT');
  });
  it('applies cost priorities only after feasibility',()=>{
    const i=sampleInput();i.priority='COST';i.materials.push({...i.materials[0],id:'cheap',price:1,length:10});
    expect(evaluate(i,draftRulePack,true).boxId).toBe('box');
  });
  it('reports all unknown prices as UNKNOWN, never a free estimate',()=>{
    const i=sampleInput();i.materials.forEach(m=>m.price=null);expect(evaluate(i,draftRulePack,true).cost.completeness).toBe('UNKNOWN');
  });
});
