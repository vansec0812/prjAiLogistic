import { profileFields, type PlantInput, type ProfileField } from '@plantcare/domain';

export const demoPlantId='phu-quy-red-20261020-v1';
/** User-supplied sample values, not measurements or confidence inferred from the image. */
export const demoPlantFields:Pick<PlantInput,ProfileField>={name:'Cây phú quý lá đỏ',group:'FOLIAGE',height:50,length:40,width:40,potDiameter:20,potHeight:25,weight:5,fragility:'HIGH',potMaterial:'Gốm / sứ'};
export function applyDemoPlantProfile(current:PlantInput,start:PlantInput):PlantInput{
  if(current.confirmed)return current;
  const next:PlantInput={...current,confirmed:false,fieldEvidence:{...current.fieldEvidence}};
  for(const field of profileFields){
    if(current[field]!==start[field]||current.fieldEvidence?.[field]?.source==='USER'||start[field]!==null&&start[field]!==''&&start[field]!=='UNKNOWN'&&!['AI','DEMO'].includes(start.fieldEvidence?.[field]?.source||'')&&!(field==='potMaterial'&&start[field]==='Nhựa'))continue;
    Object.assign(next,{[field]:demoPlantFields[field]});
    next.fieldEvidence![field]={source:'DEMO',confidence:null,status:'SUGGESTED',evidence:'Thông số mẫu do người dùng cung cấp cho ảnh Phú quý; không đo/cân từ ảnh.'};
  }
  return next;
}
