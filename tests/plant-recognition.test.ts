import { describe, expect, it } from 'vitest';
import { emptyInput } from '../packages/domain/src/index';
import { applyPlantRecognition, plantProfileIssues, visionSchema, fullPlantScanSchema, measuredFields, type PlantRecognition } from '../apps/web/src/lib/plant-recognition';
const result:PlantRecognition={schema_version:'vision-v1',plant_candidates:[{name:'Trầu bà',group:'FOLIAGE',confidence:null,evidence:'Tán cây trong ảnh.'}],material_candidates:[],plant_details:{pot_material:'Gốm / sứ',fragility:'MEDIUM',readings:[{field:'height',value:55,unit:'cm',origin:'VISIBLE_LABEL_OR_SCALE',evidence:'Nhãn ghi chiều cao 55 cm.'},{field:'weight',value:3.2,unit:'kg',origin:'VISIBLE_LABEL_OR_SCALE',evidence:'Cân chỉ 3,2 kg.'}]},warnings:[]};
const values={height:55,length:30,width:25,potDiameter:18,potHeight:16,weight:3.2};
const full=fullPlantScanSchema.parse({...result,schema_version:'vision-v2',plant_details:{...result.plant_details,readings:Object.entries(values).map(([field,value])=>({field,value,unit:field==='weight'?'kg':'cm',origin:'VISUAL_ESTIMATE',evidence:'Ước tính từ tỷ lệ cây/chậu; cần đo và cân lại.'}))}});
describe('plant autofill keeps human measurements and confirmation',()=>{
  it('fills all six visual estimates as an unconfirmed draft and preserves manual values',()=>{
    const p=emptyInput().plant;expect(applyPlantRecognition(p,p,full)).toMatchObject({...values,name:'Trầu bà',group:'FOLIAGE',potMaterial:'Gốm / sứ',confirmed:false});
    const typed={...p,height:62};expect(applyPlantRecognition(typed,p,full).height).toBe(62);const confirmed={...typed,confirmed:true};expect(applyPlantRecognition(confirmed,p,full)).toBe(confirmed);
  });
  it('requires exactly one result for each field and coherent source/value/units',()=>{
    const readings=full.plant_details.readings;
    for(const invalid of [readings.slice(1),[...readings.slice(1),readings[1]],readings.map((r,i)=>i? r:{...r,unit:'kg'}),readings.map((r,i)=>i? r:{...r,origin:'UNKNOWN'}),readings.map((r,i)=>i? r:{...r,value:null})])expect(fullPlantScanSchema.safeParse({...full,plant_details:{...full.plant_details,readings:invalid}}).success).toBe(false);
  });
  it('evaluates all fields but leaves unknowns empty when the image cannot support an estimate',()=>{
    const blank=fullPlantScanSchema.parse({...full,plant_candidates:[{name:'Không xác định',group:'UNKNOWN',confidence:null,evidence:'Không thấy cây.'}],plant_details:{pot_material:null,fragility:'UNKNOWN',readings:full.plant_details.readings.map(r=>({...r,value:null,origin:'UNKNOWN',evidence:'Không nhìn thấy cây hoặc chậu trong ảnh.'}))}}),p=emptyInput().plant,next=applyPlantRecognition(p,p,blank);
    expect(measuredFields.every(k=>next[k]===null)).toBe(true);expect(next.name).toBe('');expect(next.confirmed).toBe(false);
  });
  it('fills name, group, pot and explicit label readings without inventing other dimensions',()=>{
    const input=emptyInput().plant,next=applyPlantRecognition(input,input,result);expect(next).toMatchObject({name:'Trầu bà',group:'FOLIAGE',potMaterial:'Gốm / sứ',height:55,weight:3.2,confirmed:false});expect(next.width).toBeNull();expect(plantProfileIssues(next)).not.toEqual([]);
  });
  it('does not overwrite typed fields, edits during a request or confirmed inputs',()=>{
    const input={...emptyInput().plant,name:'Tên tôi nhập',height:60},current={...input,width:25,group:'SUCCULENT' as const};
    expect(applyPlantRecognition(current,input,result)).toMatchObject({name:'Tên tôi nhập',height:60,width:25,group:'SUCCULENT'});const confirmed={...current,confirmed:true};expect(applyPlantRecognition(confirmed,input,result)).toBe(confirmed);
  });
  it('keeps legacy origins strict and ignores mismatched measurement units',()=>{
    expect(visionSchema.safeParse({...result,plant_details:{...result.plant_details,readings:[{...result.plant_details!.readings[0],origin:'PIXEL_ESTIMATE'}]}}).success).toBe(false);
    const p=emptyInput().plant;expect(applyPlantRecognition(p,p,{...result,plant_details:{...result.plant_details!,readings:[{...result.plant_details!.readings[0],unit:'kg'}]}}).height).toBeNull();
  });
});
