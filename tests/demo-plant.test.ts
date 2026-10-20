import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { emptyInput } from '../packages/domain/src/index';
import { matchesDemoPlantPhoto } from '../apps/web/src/server/demo-plant';
import { demoPlantFields, applyDemoPlantProfile } from '../apps/web/src/lib/demo-plant-profile';
import { applyMvpRecognition, editPlantField, plantProfileIssues, prdPlantScanSchema } from '../apps/web/src/lib/plant-recognition';
import { inputSchema } from '../apps/web/src/server/schemas';
import reference from '../apps/web/src/data/demo-plant-photo.json';
import { defaultMvpConfig } from '../apps/web/src/lib/mvp-config';
import { proposePackingDemo } from '../apps/web/src/lib/demo-packing';
import { proposeMvp } from '../packages/rule-engine/src/mvp';

const photo=()=>readFile('tests/fixtures/cayphuquy-demo.jpg');
describe('Phu quy photo demonstration',()=>{
  it('matches the supplied photo through browser JPEG and server WebP normalization, not its filename',async()=>{
    const original=await photo();expect(createHash('sha256').update(original).digest('hex')).toBe(reference.sourceSha256);expect(await matchesDemoPlantPhoto(original)).toBe(true);
    for(const width of [380,757,1200]){const jpeg=await sharp(original).resize({width}).jpeg({quality:75}).toBuffer(),webp=await sharp(jpeg).webp({quality:85}).toBuffer();expect(await matchesDemoPlantPhoto(webp)).toBe(true);}
  });
  it('rejects blank, malformed, a different red-leaf packing photo and a stretched copy',async()=>{
    const blank=await sharp({create:{width:757,height:746,channels:3,background:'white'}}).jpeg().toBuffer();expect(await matchesDemoPlantPhoto(blank)).toBe(false);expect(await matchesDemoPlantPhoto(Buffer.from('not a plant'))).toBe(false);expect(await matchesDemoPlantPhoto(await readFile('apps/web/public/photos/packing-demo/v1/pa1/step-1.webp'))).toBe(false);expect(await matchesDemoPlantPhoto(await sharp(await photo()).resize(300,700).jpeg().toBuffer())).toBe(false);
  });
  it('fills every user-specified field as sample data without fake AI confidence or automatic confirmation',()=>{
    const p=emptyInput().plant,next=applyDemoPlantProfile(p,p);expect(next).toMatchObject({...demoPlantFields,confirmed:false});expect(Object.values(next.fieldEvidence!).every(e=>e?.source==='DEMO'&&e.confidence===null&&e.status==='SUGGESTED')).toBe(true);expect(plantProfileIssues(next)).toEqual(['Kiểm tra và xác nhận thông tin cây.']);expect(inputSchema.safeParse({...emptyInput(),plant:next}).success).toBe(true);
  });
  it('preserves manual and in-flight edits and confirmed profiles, and lets subsequent real scans replace sample suggestions',()=>{
    const p=emptyInput().plant,manual=editPlantField(p,'height',61),next=applyDemoPlantProfile(manual,p);expect(next.height).toBe(61);expect(next.weight).toBe(5);const confirmed={...next,confirmed:true};expect(applyDemoPlantProfile(confirmed,confirmed)).toBe(confirmed);
    const blankScan=prdPlantScanSchema.parse({schema_version:'vision-v3',image_quality:'NO_PLANT',plant_candidates:[],material_candidates:[],plant_details:{pot_material:null,fragility:'UNKNOWN',readings:['height','length','width','potDiameter','potHeight','weight'].map(field=>({field,value:null,unit:field==='weight'?'kg':'cm',origin:'UNKNOWN',evidence:'Không nhìn rõ đối tượng.'}))},field_confidences:Object.fromEntries(['name','group','height','length','width','potDiameter','potHeight','weight','fragility','potMaterial'].map(field=>[field,{confidence:null,evidence:'Không nhìn rõ đối tượng.'}])),warnings:[]});
    const reset=applyMvpRecognition(next,next,blankScan);expect(reset.height).toBe(61);expect(reset.weight).toBeNull();expect(reset.name).toBe('');
  });
  it('keeps HIGH fragility and ceramic pot while allowing both photo examples only through the demo proposal',()=>{
    const input=emptyInput(),now=new Date('2026-10-20T00:00:00Z');input.plant={...applyDemoPlantProfile(input.plant,input.plant),confirmed:true};input.shipment={...input.shipment,origin:'Hà Nội',destination:'Bắc Ninh',channel:'DIRECT',distanceKm:35,departure:'2026-11-01T00:00:00Z',duration:24,minTemp:20,maxTemp:30,weatherSource:'Người dùng xác nhận',confirmed:true};expect(proposePackingDemo(input,70,now).alternatives.map(a=>a.steps.length)).toEqual([6,8]);expect(proposeMvp(input,defaultMvpConfig,true,now).outcome).toBe('NEEDS_EXPERT');expect(input.plant).toMatchObject({weight:5,fragility:'HIGH',potMaterial:'Gốm / sứ'});
  });
});
