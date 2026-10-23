import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { emptyInput, type MvpBundle } from '../packages/domain/src/index';
import { identifyDemoPlantPhoto } from '../apps/web/src/server/demo-plant';
import { demoPlantId, succulentDemoPlantId, succulentDemoPlantFields, applyDemoPlantProfile } from '../apps/web/src/lib/demo-plant-profile';
import { editPlantField, plantProfileIssues } from '../apps/web/src/lib/plant-recognition';
import { demoPhotoByPath, proposePackingDemo } from '../apps/web/src/lib/demo-packing';
import { succulentDemoAlternatives, succulentPackingVersion, succulentPackingSource } from '../apps/web/src/lib/demo-succulent';
import { withDemoBundlePricing } from '../apps/web/src/lib/demo-pricing';
import { packingReferenceParts } from '../apps/web/src/server/packing-reference';
import { selectSop, type LiveStep } from '../apps/web/src/lib/live-packing';
import { inputSchema } from '../apps/web/src/server/schemas';
import reference from '../apps/web/src/data/demo-succulent-photo-v2.json';

const photo=()=>readFile('tests/fixtures/sen-da-demo.png');
const now=new Date('2026-10-23T00:00:00Z');
function input(){const i=emptyInput();i.plant={...applyDemoPlantProfile(i.plant,i.plant,succulentDemoPlantId),confirmed:true};i.shipment={...i.shipment,origin:'Hoàng Hoa Thám - Hà Nội',destination:'Từ Sơn - Bắc Ninh',channel:'SHOPEE',departure:'2026-11-01T00:00:00Z',distanceKm:35,duration:24,minTemp:20,maxTemp:30,weatherSource:'Fixture người dùng xác nhận',confirmed:true};return i;}
describe('Updated succulent photo demonstration',()=>{
  it('matches the latest supplied image and its compressed copies to its own preset, keeping Phu quy distinct',async()=>{
    const bytes=await photo();expect(createHash('sha256').update(bytes).digest('hex')).toBe(reference.sourceSha256);expect(await identifyDemoPlantPhoto(bytes)).toBe(succulentDemoPlantId);
    for(const width of [380,757,1200]){const jpeg=await sharp(bytes).resize({width}).jpeg({quality:75}).toBuffer();expect(await identifyDemoPlantPhoto(await sharp(jpeg).webp({quality:85}).toBuffer())).toBe(succulentDemoPlantId);}
    expect(await identifyDemoPlantPhoto(await readFile('tests/fixtures/cayphuquy-demo.jpg'))).toBe(demoPlantId);
    expect(await identifyDemoPlantPhoto(await sharp(bytes).resize(300,700).png().toBuffer())).toBeNull();
    expect(await identifyDemoPlantPhoto(await readFile('apps/web/public'+succulentDemoAlternatives[0].steps[0].image))).toBeNull();
  });
  it('fills the updated plastic pot, low fragility and measurements, requiring user confirmation',()=>{
    const p=emptyInput().plant,next=applyDemoPlantProfile(p,p,succulentDemoPlantId);
    expect(next).toMatchObject({...succulentDemoPlantFields,height:13,potHeight:8,weight:0.3,potMaterial:'Nhựa',fragility:'LOW',confirmed:false});
    expect(plantProfileIssues(next)).toEqual(['Kiểm tra và xác nhận thông tin cây.']);expect(inputSchema.safeParse({...emptyInput(),plant:next}).success).toBe(true);
    expect(Object.values(next.fieldEvidence!).every(e=>e?.source==='DEMO'&&e.confidence===null&&e.status==='SUGGESTED')).toBe(true);
  });
  it('switches presets without leaking old values, preserves manual/late edits and confirmed data',()=>{
    const p=emptyInput().plant,phu=applyDemoPlantProfile(p,p),sen=applyDemoPlantProfile(phu,phu,succulentDemoPlantId);
    expect(sen).toMatchObject(succulentDemoPlantFields);expect(applyDemoPlantProfile(sen,sen)).toMatchObject({weight:5,potHeight:25,fragility:'HIGH'});
    const edited=editPlantField(p,'height',22);expect(applyDemoPlantProfile(edited,p,succulentDemoPlantId).height).toBe(22);
    const confirmed={...sen,confirmed:true};expect(applyDemoPlantProfile(confirmed,confirmed)).toBe(confirmed);expect(applyDemoPlantProfile(p,p,'unknown')).toBe(p);
  });
  it('selects both four-step succulent plans and exact Decimal BOM totals, without applying old demo prices',()=>{
    const i=input(),before=structuredClone(i),b=proposePackingDemo(i,70,now);expect(b).toMatchObject({configVersion:succulentPackingVersion,demo:true,developmentOnly:true,outcome:'READY'});expect(b.alternatives.map(a=>a.steps.length)).toEqual([4,4]);expect(b.alternatives.map(a=>a.cost.total)).toEqual([15000,8000]);expect(b.trace[0].id).toBe(succulentPackingSource);expect(i).toEqual(before);
    expect(b.alternatives.map(a=>a.bom.find(m=>m.id==='succulent-tape'))).toMatchObject([{price:500,quantity:1.2,subtotal:600},{price:500,quantity:0.8,subtotal:400}]);
    expect(b.alternatives.map(a=>a.bom.find(m=>m.id==='succulent-auxiliary'))).toMatchObject([{price:null,subtotal:400},{price:null,subtotal:100}]);
    for(const a of b.alternatives){expect(a.bom.reduce((n,m)=>n+m.subtotal!,0)).toBe(a.cost.total);expect(a.bom.every(m=>m.specification)).toBe(true);}
    b.alternatives[0].steps[0].title='Local change';expect(proposePackingDemo(i,70,now).alternatives[0].steps[0].title).not.toBe('Local change');
    const old:MvpBundle={...b,id:'old',caseId:'case',inputHash:'hash',createdAt:now.toISOString(),alternatives:b.alternatives.map(a=>({...a,cost:{known:0,total:null}}))};expect(withDemoBundlePricing(old)).toBe(old);
    i.plant.confirmed=false;expect(proposePackingDemo(i,70,now).alternatives).toHaveLength(0);
  });
  it('pins all eight full-frame photos and the exact selected image sent to Vision',async()=>{
    for(const a of succulentDemoAlternatives)for(const s of a.steps){const p=demoPhotoByPath.get(s.image)!,bytes=await readFile('apps/web/public'+s.image),meta=await sharp(bytes).metadata();expect(p.alternative).toBe(a.id);expect(meta).toMatchObject({width:941,height:1672});expect(createHash('sha256').update(bytes).digest('hex')).toBe(p.sha256);
      const step:LiveStep={...selectSop('potted','POTTED').steps[1],id:s.id,reference_image:{path:p.image,sha256:p.sha256}},parts=await packingReferenceParts(step);expect(createHash('sha256').update(Buffer.from((parts[1] as {inlineData:{data:string}}).inlineData.data,'base64')).digest('hex')).toBe(p.sha256);
    }
  });
});
