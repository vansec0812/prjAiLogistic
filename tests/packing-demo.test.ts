import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { emptyInput } from '../packages/domain/src/index';
import { demoAlternatives, demoPhotoByPath, proposePackingDemo } from '../apps/web/src/lib/demo-packing';
import { packingReferenceParts } from '../apps/web/src/server/packing-reference';
import { selectSop, checkpointPrompt, type LiveStep } from '../apps/web/src/lib/live-packing';
import { packingNarration } from '../apps/web/src/lib/packing-narration';
import type { MvpBundle } from '../packages/domain/src/index';
import { demoPricingVersion, withDemoBundlePricing } from '../apps/web/src/lib/demo-pricing';

const now=new Date('2026-10-20T00:00:00Z');
function input(){const i=emptyInput();i.plant={...i.plant,name:'Cây demo',group:'FOLIAGE',height:45,length:20,width:20,potDiameter:12,potHeight:10,weight:1,fragility:'MEDIUM',confirmed:true};i.shipment={...i.shipment,origin:'Hà Nội',destination:'Bắc Ninh',departure:'2026-11-01T00:00:00Z',channel:'DIRECT',distanceKm:35,duration:24,minTemp:15,maxTemp:25,weatherSource:'Người dùng kiểm tra',confirmed:true};return i;}
function referenceStep():LiveStep{const s=demoAlternatives[0].steps[0],photo=demoPhotoByPath.get(s.image)!;return {...selectSop('potted','POTTED').steps[1],id:s.id,title:s.title,instruction:s.instruction,criteria:s.criteria,reference_image:{path:photo.image,sha256:photo.sha256}};}
describe('Supplied photo demo',()=>{
  it('keeps both examples with user-supplied prices without pretending applicability or expert approval; does not mutate inputs or historical steps',()=>{
    const i=input(),before=structuredClone(i),first=proposePackingDemo(i,70,now);expect(first).toMatchObject({demo:true,developmentOnly:true,outcome:'READY'});expect(first.alternatives.map(a=>a.steps.length)).toEqual([6,8]);expect(first.alternatives.map(a=>a.cost)).toEqual([{known:3400,total:3400},{known:900,total:900}]);expect(i).toEqual(before);
    first.alternatives[0].steps[0].instruction='Changed copy';expect(proposePackingDemo(i,70,now).alternatives[0].steps[0].instruction).not.toBe('Changed copy');
  });
  it('charges exactly the requested four and three materials, with matching line subtotals and totals',()=>{
    expect(demoAlternatives.map(a=>a.bom.map(m=>[m.name,m.price,m.quantity,m.subtotal]))).toEqual([
      [['Thùng xốp',2000,1,2000],['Vật liệu chèn lót',1000,1,1000],['Màng bọc',200,1,200],['Băng keo',200,1,200]],
      [['Bìa carton',500,1,500],['Màng bọc',200,1,200],['Băng keo',200,1,200]]
    ]);
    for(const a of demoAlternatives)expect(a.bom.reduce((sum,m)=>sum+m.subtotal!,0)).toBe(a.cost.total);
  });
  it('displays prices for old unpriced demos without changing stored snapshots, instructions or known historical prices',()=>{
    const original:MvpBundle={...proposePackingDemo(input(),70,now),id:'old-demo',caseId:'case',inputHash:'snapshot',createdAt:now.toISOString()};
    original.alternatives=original.alternatives.map(a=>({...a,cost:{known:0,total:null},bom:a.bom.map(m=>({...m,price:null,subtotal:null}))}));
    original.alternatives[0].bom.push({...original.alternatives[0].bom[0],id:'waybill',name:'Vận đơn'});
    const before=structuredClone(original),display=withDemoBundlePricing(original);
    expect(display.alternatives.map(a=>a.cost.total)).toEqual([3400,900]);expect(display.alternatives.map(a=>a.bom.length)).toEqual([4,3]);
    expect(original).toEqual(before);expect(display.alternatives[0].steps).toBe(original.alternatives[0].steps);expect(display.trace).toContainEqual(expect.objectContaining({id:demoPricingVersion}));
    const ordinary={...original,demo:false};expect(withDemoBundlePricing(ordinary)).toBe(ordinary);
    display.alternatives[0].cost={known:5000,total:5000};expect(withDemoBundlePricing(display)).toBe(display);
  });
  it('still requires confirmations, complete measurements and confidence, including repeated demo generation',()=>{
    const i=input();i.plant.confirmed=false;expect(proposePackingDemo(i,70,now).alternatives).toHaveLength(0);i.plant.confirmed=true;i.shipment.confirmed=false;expect(proposePackingDemo(i,70,now).outcome).toBe('NEED_INPUT');i.shipment.confirmed=true;i.plant.fieldEvidence={weight:{source:'AI',status:'CONFIRMED',confidence:69,evidence:'Uncertain'}};expect(proposePackingDemo(i,70,now).alternatives).toHaveLength(0);i.plant.fieldEvidence.weight!.confidence=70;expect(proposePackingDemo(i,70,now).alternatives).toHaveLength(2);
  });
  it('narrates the selected photo step exactly, using spoken Vietnamese for the supplied fraction and measurements',()=>{
    for(const a of demoAlternatives){const sop={...selectSop('potted','POTTED'),steps:a.steps.map(s=>({...referenceStep(),id:s.id,title:s.title,instruction:s.instruction,speech_vi:s.speech,manual:s.manual}))};for(const [i,s] of a.steps.entries()){const narration=packingNarration(sop,i);expect(narration).toBe(`Bước ${i+1}. ${s.speech}`);expect(narration).not.toMatch(/2\/3|nói.*đã xong/i);expect(narration.length).toBeLessThan(3000);}}
  });
  it('delivers every full portrait photo with a pinned checksum and original provenance',async()=>{
    expect(demoPhotoByPath.size).toBe(22);
    for(const a of demoAlternatives)for(const s of a.steps){const p=demoPhotoByPath.get(s.image)!;expect(p.alternative).toBe(a.id);const bytes=await readFile('apps/web/public'+s.image),m=await sharp(bytes).metadata();expect(createHash('sha256').update(bytes).digest('hex')).toBe(p.sha256);expect(m.width).toBe(941);expect(m.height).toBe(1672);expect(p.source).toMatch(/^source\/pa[12]\/bước [1-8]\.png$/);}
  });
  it('passes the exact current sample to vision separately from the user frame; rejects path and hash substitution',async()=>{
    const step=referenceStep(),parts=await packingReferenceParts(step);expect(parts[0]).toHaveProperty('text',expect.stringContaining('KHÔNG phải ảnh người dùng'));expect(parts[1]).toHaveProperty('inlineData.mimeType','image/webp');expect(createHash('sha256').update(Buffer.from((parts[1] as {inlineData:{data:string}}).inlineData.data,'base64')).digest('hex')).toBe(step.reference_image!.sha256);
    const prompt=checkpointPrompt(selectSop('potted','POTTED'),step,{species:'Demo',shop_scope_confirmed:true,pot_cm:12,height_cm:45,packed_kg:null});expect(prompt).toContain('Chỉ đánh giá bằng chứng trong ẢNH THỰC HIỆN');
    await expect(packingReferenceParts({...step,reference_image:{...step.reference_image!,path:'/../../.env'}})).rejects.toThrow('PACKING_REFERENCE_INVALID');await expect(packingReferenceParts({...step,reference_image:{...step.reference_image!,sha256:'0'.repeat(64)}})).rejects.toThrow('PACKING_REFERENCE_INVALID');expect(await packingReferenceParts({...step,reference_image:undefined})).toEqual([]);
  });
});
