import { profileFields, type PlantInput, type ProfileField } from '@plantcare/domain';

export const demoPlantId='phu-quy-red-20261020-v1';
/** User-supplied sample values, not measurements or confidence inferred from the image. */
export const demoPlantFields:Pick<PlantInput,ProfileField>={name:'Cây phú quý lá đỏ',group:'FOLIAGE',height:50,length:40,width:40,potDiameter:20,potHeight:25,weight:5,fragility:'HIGH',potMaterial:'Gốm / sứ'};
export const succulentDemoPlantId='sen-da-20261023-v2';
export const succulentDemoPlantFields:Pick<PlantInput,ProfileField>={name:'Cây sen đá',group:'SUCCULENT',height:13,length:12,width:12,potDiameter:10,potHeight:8,weight:0.3,fragility:'LOW',potMaterial:'Nhựa'};
export const demoPlantProfiles:Record<string,{fields:Pick<PlantInput,ProfileField>;label:string}>={
  [demoPlantId]:{fields:demoPlantFields,label:'Phú quý'},
  [succulentDemoPlantId]:{fields:succulentDemoPlantFields,label:'sen đá'},
};
export function isSucculentDemoProfile(plant:PlantInput){
  return plant.group==='SUCCULENT'&&(plant.name.trim().toLocaleLowerCase('vi')==='cây sen đá'||Object.values(plant.fieldEvidence||{}).some(e=>e?.source==='DEMO'&&e.evidence.includes(`(${succulentDemoPlantId})`)));
}
export function applyDemoPlantProfile(current:PlantInput,start:PlantInput,sampleId=demoPlantId):PlantInput{
  const profile=demoPlantProfiles[sampleId];if(!profile)return current;
  if(current.confirmed)return current;
  const next:PlantInput={...current,confirmed:false,fieldEvidence:{...current.fieldEvidence}};
  for(const field of profileFields){
    if(current[field]!==start[field]||current.fieldEvidence?.[field]?.source==='USER'||start[field]!==null&&start[field]!==''&&start[field]!=='UNKNOWN'&&!['AI','DEMO'].includes(start.fieldEvidence?.[field]?.source||'')&&!(field==='potMaterial'&&start[field]==='Nhựa'))continue;
    const value=profile.fields[field],missing=value===null||value==='UNKNOWN'||value==='Khác / chưa rõ';
    Object.assign(next,{[field]:value});
    next.fieldEvidence![field]={source:'DEMO',confidence:null,status:missing?'NEED_INPUT':'SUGGESTED',evidence:`Thông số mẫu do người dùng cung cấp cho ảnh ${profile.label} (${sampleId}); không đo/cân từ ảnh.${missing?' Chưa có thông số trong tài liệu, cần nhập tay.':''}`};
  }
  return next;
}
