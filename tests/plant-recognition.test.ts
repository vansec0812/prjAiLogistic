import { describe, expect, it } from 'vitest';
import { emptyInput } from '../packages/domain/src/index';
import { applyPlantRecognition, plantProfileIssues, visionSchema, type PlantRecognition } from '../apps/web/src/lib/plant-recognition';
const result:PlantRecognition={schema_version:'vision-v1',plant_candidates:[{name:'Trầu bà',group:'FOLIAGE',confidence:null,evidence:'Tán cây trong ảnh.'}],material_candidates:[],plant_details:{pot_material:'Gốm / sứ',fragility:'MEDIUM',readings:[{field:'height',value:55,unit:'cm',origin:'VISIBLE_LABEL_OR_SCALE',evidence:'Nhãn ghi chiều cao 55 cm.'},{field:'weight',value:3.2,unit:'kg',origin:'VISIBLE_LABEL_OR_SCALE',evidence:'Cân chỉ 3,2 kg.'}]},warnings:[]};
describe('plant autofill keeps human measurements and confirmation',()=>{
  it('fills name, group, pot and explicit label readings without inventing other dimensions',()=>{
    const input=emptyInput().plant,next=applyPlantRecognition(input,input,result);expect(next).toMatchObject({name:'Trầu bà',group:'FOLIAGE',potMaterial:'Gốm / sứ',height:55,weight:3.2,confirmed:false});expect(next.width).toBeNull();expect(plantProfileIssues(next)).not.toEqual([]);
  });
  it('does not overwrite typed fields, edits during a request or confirmed inputs',()=>{
    const input={...emptyInput().plant,name:'Tên tôi nhập',height:60},current={...input,width:25,group:'SUCCULENT' as const};
    expect(applyPlantRecognition(current,input,result)).toMatchObject({name:'Tên tôi nhập',height:60,width:25,group:'SUCCULENT'});const confirmed={...current,confirmed:true};expect(applyPlantRecognition(confirmed,input,result)).toBe(confirmed);
  });
  it('rejects estimated origins and ignores mismatched measurement units',()=>{
    expect(visionSchema.safeParse({...result,plant_details:{...result.plant_details,readings:[{...result.plant_details!.readings[0],origin:'PIXEL_ESTIMATE'}]}}).success).toBe(false);
    const p=emptyInput().plant;expect(applyPlantRecognition(p,p,{...result,plant_details:{...result.plant_details!,readings:[{...result.plant_details!.readings[0],unit:'kg'}]}}).height).toBeNull();
  });
});
