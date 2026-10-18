import Decimal from 'decimal.js';
import type { CaseInput, MvpConfig, MvpBundle, JourneyContext } from '../../domain/src/index';

export function mvpInputIssues(input:CaseInput,now=new Date()):string[]{
  const p=input.plant,s=input.shipment,missing:string[]=[];
  if(!p.name.trim()||p.group==='UNKNOWN')missing.push('Tên và nhóm cây');
  if(['height','length','width','potDiameter','potHeight','weight'].some(k=>(p[k as keyof typeof p] as number|null)===null||Number(p[k as keyof typeof p])<=0))missing.push('Sáu số đo và khối lượng');
  if(p.height!==null&&p.potHeight!==null&&p.height<p.potHeight)missing.push('Chiều cao tổng phải bao gồm chậu');
  if(p.fragility==='UNKNOWN')missing.push('Độ dễ hư hỏng');
  if(!p.confirmed||Object.values(p.fieldEvidence||{}).some(e=>e?.status==='NEED_INPUT'))missing.push('Xác nhận thông tin cây');
  if(!s.origin.trim()||!s.destination.trim()||!s.channel)missing.push('Nơi đi, nơi đến và kênh bán');
  if(!s.departure||!Number.isFinite(Date.parse(s.departure))||Date.parse(s.departure)<now.getTime())missing.push('Ngày gửi trong tương lai');
  if(!s.duration||s.duration<=0)missing.push('Thời gian vận chuyển dự kiến');
  if(s.distanceKm===undefined||s.distanceKm===null||s.distanceKm<0)missing.push('Khoảng cách ước tính');
  if(s.minTemp===null||s.maxTemp===null||s.minTemp>s.maxTemp||!s.weatherSource.trim())missing.push('Bối cảnh nhiệt độ và nguồn');
  if(!s.confirmed)missing.push('Xác nhận hành trình');
  return missing;
}

/** Catalog proposals, never an assertion that a user's actual box fits or bears a load. */
export function proposeMvp(input:CaseInput,config:MvpConfig,trial:boolean,now=new Date()):Omit<MvpBundle,'id'|'caseId'|'inputHash'|'createdAt'>{
  const r:ReturnType<typeof proposeMvp>={snapshot:structuredClone(input),configVersion:config.version,developmentOnly:config.status!=='APPROVED',outcome:'READY',missing:mvpInputIssues(input,now),alternatives:[],suppressed:[],trace:[]};
  if(r.missing.length){r.outcome='NEED_INPUT';return r;}
  const p=input.plant,s=input.shipment,l=config.limits;
  if(Object.values(p.fieldEvidence||{}).some(e=>e?.source==='AI'&&(e.confidence===null||e.confidence<config.confidenceThreshold))){r.outcome='NEED_INPUT';r.missing.push('Nhập tay các trường AI dưới ngưỡng tin cậy');return r;}
  if(!trial&&config.status!=='APPROVED'||!config.groups.includes(p.group)||p.fragility==='HIGH'||p.potDiameter!>l.potBands.at(-1)!||p.weight!>l.weightBands.at(-1)!||s.minTemp!<l.minTemp||s.maxTemp!>l.maxTemp||s.duration!>l.maxDuration||s.orientation!=='UPRIGHT'){
    r.outcome='NEEDS_EXPERT';r.trace.push({id:'SCOPE',reason:'Chưa có quy tắc được duyệt cho điều kiện này. Cần chuyên gia, không sinh phương án áp dụng.'});return r;
  }
  const plant=config.plants.find(x=>x.name.toLocaleLowerCase('vi')===p.name.trim().toLocaleLowerCase('vi'));
  if(plant&&plant.group!==p.group){r.outcome='NEED_INPUT';r.missing.push('Nhóm cây không khớp tên trong danh mục');return r;}
  if(plant?.fragility==='HIGH'){r.outcome='NEEDS_EXPERT';r.trace.push({id:'PLANT_FRAGILITY',reason:'Danh mục xếp cây vào nhóm dễ hư cao; xác nhận người dùng không được hạ mức bảo vệ.'});return r;}
  r.trace.push({id:'CONFIRMED_INPUT',reason:'Cây và hành trình đã được xác nhận.'},{id:'PLANT_GROUP',reason:plant?'Áp dụng thuộc tính cây trong danh mục.':'Tên chưa có trong danh mục; áp dụng nhóm cây đã xác nhận.'},{id:'SAFETY_FIRST',reason:'Cố định chậu, bảo vệ cây và đóng kín là bắt buộc ở cả hai phương án.'});
  for(const a of config.alternatives){
    if(a.id==='PA2'&&(!plant||p.fragility!=='LOW'||plant.fragility!=='LOW'||plant.thorns||plant.lightSensitive||p.weight!>l.costMaxWeight||p.potDiameter!>l.costMaxPot||s.duration!>l.costMaxDuration)){
      r.suppressed.push({id:a.id,reason:'PA2 không đáp ứng phạm vi tiết kiệm: thiếu thuộc tính cây trong danh mục, cây nhạy cảm, có gai, kích thước/khối lượng hoặc thời gian vượt ngưỡng cấu hình.'});continue;
    }
    const bom=a.bom.map(b=>{const m=config.materials.find(m=>m.id===b.materialId&&m.active);return m?{...m,quantity:b.quantity,subtotal:m.price===null?null:new Decimal(m.price).times(b.quantity).toNumber()}:null;});
    if(bom.some(m=>!m)){r.suppressed.push({id:a.id,reason:'Danh mục có vật tư bị tắt hoặc thiếu. Liên hệ quản trị viên.'});continue;}
    const items=bom.map(m=>m!),known=items.reduce((s,m)=>s.plus(m.subtotal??0),new Decimal(0)).toNumber();
    r.alternatives.push({...a,bom:items,cost:{known,total:items.some(m=>m.price===null)?null:known},steps:structuredClone(a.steps),ruleIds:['CONFIRMED_INPUT','PLANT_GROUP','SAFETY_FIRST',a.id==='PA1'?'FULL_PROTECTION':'COST_ELIGIBILITY'],notes:[`Chậu nhóm ${l.potBands.findIndex(n=>p.potDiameter!<=n)+1}; khối lượng nhóm ${l.weightBands.findIndex(n=>p.weight!<=n)+1}.`,'Chọn thùng theo kích thước cây và tải trọng thực. Giá chỉ gồm vật tư, không gồm cước.',...(plant?[]:['Dùng quy tắc theo nhóm; kiểm tra đặc điểm riêng của cây.']),...(r.developmentOnly?['Quy tắc nháp, cần duyệt chuyên môn trước áp dụng thực tế.']:[])]});
  }
  if(r.alternatives.length===2){const safety=r.alternatives.find(a=>a.id==='PA1')!,cost=r.alternatives.find(a=>a.id==='PA2')!;
    const signature=(a:typeof safety)=>a.bom.map(m=>m.id+':'+m.quantity).sort().join('|');
    if(signature(safety)===signature(cost)||safety.cost.total!==null&&cost.cost.total!==null&&cost.cost.total>=safety.cost.total){r.alternatives=r.alternatives.filter(a=>a.id!=='PA2');r.suppressed.push({id:'PA2',reason:'PA2 trùng vật tư hoặc không tiết kiệm hơn PA1 theo đơn giá hiện tại.'});}
    else if(cost.cost.total===null||safety.cost.total===null)cost.notes.push('Chưa đủ đơn giá để xác nhận mức tiết kiệm.');
  }
  if(!r.alternatives.some(a=>a.id==='PA1')){r.alternatives=[];r.outcome='NEEDS_EXPERT';r.trace.push({id:'PA1_REQUIRED',reason:'Thiếu phương án bảo vệ đầy đủ; không đề xuất chỉ PA2.'});}
  return r;
}

const places:[string,number,number][]=[['ha noi',21.0285,105.8542],['bac ninh',21.1861,106.0763],['da nang',16.0544,108.2022],['ho chi minh',10.8231,106.6297],['hai phong',20.8449,106.6881],['can tho',10.0452,105.7469],['hue',16.4637,107.5909],['da lat',11.9404,108.4583],['nha trang',12.2388,109.1967]];
const normalized=(s:string)=>s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d');
export function inferJourney(origin:string,destination:string,departure:string,channel:string,config:MvpConfig):JourneyContext{
  const find=(s:string)=>places.find(([n])=>normalized(s).includes(n));const from=find(origin),to=find(destination);
  let distanceKm:number|null=null;
  if(from&&to){const rad=(n:number)=>n*Math.PI/180,a=Math.sin(rad(to[1]-from[1])/2)**2+Math.cos(rad(from[1]))*Math.cos(rad(to[1]))*Math.sin(rad(to[2]-from[2])/2)**2;distanceKm=Math.round(6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));}
  const c=config.channels.find(c=>c.id===channel),month=new Date(Date.parse(departure)+7*3600000).getUTCMonth()+1,season=config.seasons.find(s=>s.months.includes(month));
  return {distanceKm,distanceKind:'STRAIGHT_LINE',duration:c&&distanceKm!==null?(distanceKm<=100?c.nearHours:c.farHours):null,minTemp:season?.minTemp??null,maxTemp:season?.maxTemp??null,source:`${season?.label||'Chưa có giả định mùa'}; ETA theo cấu hình ${config.version}. Khoảng cách đường chim bay giữa tâm địa danh, không phải quãng đường giao hàng.`,seasonalFallback:true,configVersion:config.version};
}
