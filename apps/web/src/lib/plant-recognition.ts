import { z } from 'zod';
import type { PlantInput } from '@plantcare/domain';

export const measuredFields=['height','length','width','potDiameter','potHeight','weight'] as const;
const readingSchema=z.object({field:z.enum(measuredFields),value:z.number().finite().positive().max(100000),unit:z.enum(['cm','kg']),origin:z.literal('VISIBLE_LABEL_OR_SCALE'),evidence:z.string().min(5).max(500)}).strict();
const plantDetailsSchema=z.object({pot_material:z.enum(['Nhựa','Gốm / sứ','Đất nung','Khác / chưa rõ']).nullable(),fragility:z.enum(['LOW','MEDIUM','HIGH','UNKNOWN']),readings:z.array(readingSchema).max(6)}).strict();
const legacyVisionSchema=z.object({
  schema_version:z.literal('vision-v1'),
  plant_candidates:z.array(z.object({name:z.string().max(100),group:z.enum(['FOLIAGE','FLOWERING','SUCCULENT','UNKNOWN']),confidence:z.number().min(0).max(1).nullable(),evidence:z.string().max(500)})).max(3),
  material_candidates:z.array(z.object({name:z.string().max(100),category:z.enum(['BOX','PADDING','FIXING','TAPE','LABEL']),confidence:z.number().min(0).max(1).nullable(),evidence:z.string().max(500)})).max(20),
  plant_details:plantDetailsSchema.optional(),
  warnings:z.array(z.string().max(500)).max(10)
});
/** Every field is evaluated; an unreadable image must keep unknown values explicit. */
export const fullPlantScanSchema=legacyVisionSchema.extend({
  schema_version:z.literal('vision-v2'),
  plant_details:plantDetailsSchema.extend({readings:z.array(readingSchema.extend({value:readingSchema.shape.value.nullable(),origin:z.enum(['VISIBLE_LABEL_OR_SCALE','VISUAL_ESTIMATE','UNKNOWN'])})).length(6)})
}).superRefine((result,ctx)=>{
  const readings=result.plant_details.readings;
  if(new Set(readings.map(r=>r.field)).size!==measuredFields.length)ctx.addIssue({code:'custom',path:['plant_details','readings'],message:'Mỗi thông số phải xuất hiện đúng một lần.'});
  readings.forEach((r,i)=>{
    if((r.origin==='UNKNOWN')!==(r.value===null)||r.unit!==(r.field==='weight'?'kg':'cm'))ctx.addIssue({code:'custom',path:['plant_details','readings',i],message:'Nguồn, giá trị hoặc đơn vị không khớp.'});
  });
});
export const visionSchema=z.discriminatedUnion('schema_version',[legacyVisionSchema,fullPlantScanSchema]);
export type PlantRecognition=z.infer<typeof visionSchema>;

/** Fill editable fields only; a late result cannot undo edits or confirmation. */
export function applyPlantRecognition(current:PlantInput,atStart:PlantInput,result:PlantRecognition):PlantInput{
  if(current.confirmed)return current;
  const next={...current},candidate=result.plant_candidates.find(c=>c.group!=='UNKNOWN'),details=result.plant_details;
  if(candidate?.name&&current.name===atStart.name&&!atStart.name.trim())next.name=candidate.name;
  if(candidate&&candidate.group!=='UNKNOWN'&&current.group===atStart.group&&atStart.group==='UNKNOWN')next.group=candidate.group;
  if(details?.pot_material&&current.potMaterial===atStart.potMaterial&&['','Nhựa','Khác / chưa rõ'].includes(atStart.potMaterial))next.potMaterial=details.pot_material;
  if(details&&details.fragility!=='UNKNOWN'&&current.fragility===atStart.fragility&&atStart.fragility==='UNKNOWN')next.fragility=details.fragility;
  for(const reading of details?.readings||[]){
    if(reading.value===null||reading.origin==='UNKNOWN'||reading.unit!==(reading.field==='weight'?'kg':'cm')||current[reading.field]!==null||atStart[reading.field]!==null)continue;
    next[reading.field]=reading.value;
  }
  return {...next,confirmed:false};
}
export function plantProfileIssues(plant:PlantInput):string[]{
  const issues:string[]=[];
  if(!plant.name.trim()||plant.group==='UNKNOWN')issues.push('Nhập tên và nhóm cây.');
  if(measuredFields.some(k=>plant[k]===null||plant[k]!<=0))issues.push('Bổ sung số đo và khối lượng cây, chậu.');
  if(!plant.confirmed)issues.push('Kiểm tra và xác nhận thông tin cây.');
  return issues;
}
