import { z } from 'zod';
import { profileFields, type PlantInput, type ProfileField } from '@plantcare/domain';

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
const confidenceSchema=z.object({confidence:z.number().min(0).max(100).nullable(),evidence:z.string().min(5).max(500)}).strict();
const confidenceFields=z.object(Object.fromEntries(profileFields.map(k=>[k,confidenceSchema])) as Record<ProfileField,typeof confidenceSchema>).strict();
export const prdPlantScanSchema=z.object({...fullPlantScanSchema.shape,schema_version:z.literal('vision-v3'),image_quality:z.enum(['CLEAR','RETAKE','NO_PLANT']),field_confidences:confidenceFields}).superRefine((r,ctx)=>{if(new Set(r.plant_details.readings.map(f=>f.field)).size!==6||r.plant_details.readings.some(r=>(r.origin==='UNKNOWN')!==(r.value===null)||r.unit!==(r.field==='weight'?'kg':'cm')))ctx.addIssue({code:'custom',message:'Thông số không khớp nguồn hoặc đơn vị.'});});
export const visionSchema=z.discriminatedUnion('schema_version',[legacyVisionSchema,fullPlantScanSchema,prdPlantScanSchema]);
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
  if(plant.fragility==='UNKNOWN')issues.push('Chọn độ dễ hư hỏng của cây.');
  if(plant.height!==null&&plant.potHeight!==null&&plant.height<plant.potHeight)issues.push('Chiều cao tổng phải bao gồm chậu.');
  if(measuredFields.some(k=>plant[k]===null||plant[k]!<=0))issues.push('Bổ sung số đo và khối lượng cây, chậu.');
  if(!plant.confirmed)issues.push('Kiểm tra và xác nhận thông tin cây.');
  if(Object.values(plant.fieldEvidence||{}).some(e=>e?.status==='NEED_INPUT'))issues.push('Nhập tay các trường AI chưa đủ tin cậy.');
  return issues;
}

export function editPlantField<K extends ProfileField>(plant:PlantInput,field:K,value:PlantInput[K]):PlantInput{return {...plant,[field]:value,confirmed:false,fieldEvidence:{...plant.fieldEvidence,[field]:{source:'USER',confidence:null,status:value===null||value===''||value==='UNKNOWN'?'NEED_INPUT':'SUGGESTED',evidence:'Người dùng nhập hoặc chỉnh sửa.'}}};}
export function applyMvpRecognition(current:PlantInput,start:PlantInput,result:PlantRecognition,threshold=70):PlantInput{
  if(current.confirmed)return current;
  const suggested=applyPlantRecognition(current,start,result),next:PlantInput={...current,confirmed:false,fieldEvidence:{...current.fieldEvidence}},candidate=result.plant_candidates.find(c=>c.group!=='UNKNOWN');
  for(const key of profileFields){
    if(current.fieldEvidence?.[key]?.source==='USER'||current[key]!==start[key]||start[key]!==null&&start[key]!==''&&start[key]!=='UNKNOWN'&&start.fieldEvidence?.[key]?.source!=='AI'&&!(key==='potMaterial'&&start[key]==='Nhựa'))continue;
    const confidence=result.schema_version==='vision-v3'?result.field_confidences[key].confidence:null;
    const evidence=result.schema_version==='vision-v3'?result.field_confidences[key].evidence:'Kết quả cũ không có mức tin cậy từng trường.';
    const value=result.schema_version==='vision-v3'?(key==='name'?candidate?.name:key==='group'?candidate?.group:key==='fragility'?result.plant_details.fragility:key==='potMaterial'?result.plant_details.pot_material:result.plant_details.readings.find(r=>r.field===key)?.value):suggested[key],good=result.schema_version==='vision-v3'&&result.image_quality==='CLEAR'&&confidence!==null&&confidence>=threshold&&value!==undefined&&value!==null&&value!==''&&value!=='UNKNOWN';
    if(good)Object.assign(next,{[key]:value});
    else Object.assign(next,{[key]:measuredFields.includes(key as typeof measuredFields[number])?null:key==='group'||key==='fragility'?'UNKNOWN':key==='potMaterial'?'Khác / chưa rõ':''});
    next.fieldEvidence![key]={source:'AI',confidence,status:good?'SUGGESTED':'NEED_INPUT',evidence};
  }
  return next;
}
