import Decimal from 'decimal.js';
import type { CaseInput, Plan, RulePack, Step } from '../../domain/src/index';

export const draftRulePack: RulePack = {
  id:'LOCAL_PACK',version:'draft-local-1',status:'DRAFT',approvedBy:null,
  source:'SRS p.11-13, 38; fixture phát triển, chưa duyệt chuyên môn',
  groups:['FOLIAGE','FLOWERING','SUCCULENT'],paddingCm:2,templateVersion:'draft-steps-1'
};
export function evaluate(input:CaseInput, pack:RulePack=draftRulePack, development=false):Plan {
  const p:Plan={outcome:'PASS',risk:'UNKNOWN',warnings:[],missingFields:[],missingMaterials:[],trace:[],steps:[],boxId:null,usedMaterialIds:[],
    package:{length:null,width:null,height:null,weight:null},cost:{known:0,completeness:'UNKNOWN'},ruleVersion:pack.version,templateVersion:pack.templateVersion,developmentOnly:pack.status!=='PUBLISHED'};
  const trace=(ruleId:string,name:string,outcome:string,reason:string)=>p.trace.push({ruleId,version:pack.version,name,outcome,reason,source:pack.source});
  if ((!development && (pack.status!=='PUBLISHED'||!pack.approvedBy)) || !pack.groups.includes(input.plant.group)) {
    p.outcome='NEEDS_EXPERT';trace('RULE_APPROVAL','Phạm vi chuyên môn','BLOCK','Chưa có bộ quy tắc đã duyệt cho nhóm cây này.');return p;
  }
  if(development && pack.status==='DRAFT') p.warnings.push({code:'DEVELOPMENT_ONLY',text:'Bộ quy tắc và sơ đồ thử nghiệm; chưa dùng cho vận chuyển thực tế.',acknowledgeable:true});
  const fields:['height'|'length'|'width'|'potDiameter'|'potHeight'|'weight',string][]=[['height','Chiều cao tổng'],['length','Chiều dài tán'],['width','Chiều rộng tán'],['potDiameter','Đường kính chậu'],['potHeight','Chiều cao chậu'],['weight','Khối lượng cây và chậu']];
  for(const [key,label] of fields) if(input.plant[key]===null || input.plant[key]!<=0)p.missingFields.push(label);
  if(input.plant.height!==null&&input.plant.potHeight!==null&&input.plant.height<input.plant.potHeight)p.missingFields.push('Chiều cao tổng không được nhỏ hơn chiều cao chậu');
  if(!input.plant.confirmed)p.missingFields.push('Xác nhận số đo/cân thực tế');
  if(input.plant.fragility==='UNKNOWN')p.missingFields.push('Phân nhóm độ dễ hư hỏng');
  if(!input.shipment.origin||!input.shipment.destination||!input.shipment.departure)p.missingFields.push('Nơi đi, nơi đến và ngày gửi');
  if(!input.shipment.duration||input.shipment.duration<=0)p.missingFields.push('Thời lượng hành trình');
  if(input.shipment.minTemp===null||input.shipment.maxTemp===null||!input.shipment.weatherSource)p.missingFields.push('Nhiệt độ min/max có nguồn');
  if(input.shipment.minTemp!==null&&input.shipment.maxTemp!==null&&input.shipment.minTemp>input.shipment.maxTemp)p.missingFields.push('Nhiệt độ min không được lớn hơn max');
  if(!input.shipment.confirmed)p.missingFields.push('Xác nhận bối cảnh hành trình');
  trace('CONFIRMED_INPUT','Dữ liệu đã xác nhận',p.missingFields.length?'BLOCK':'PASS',p.missingFields.join('; ')||'Số đo và dữ liệu hành trình đã được người dùng xác nhận.');
  if(p.missingFields.length){p.outcome='NEEDS_INPUT';return p;}
  p.risk=input.plant.fragility;
  if(input.plant.fragility==='HIGH'){
    p.outcome='NEEDS_EXPERT';trace('HIGH_RISK','Nhóm rủi ro cao','BLOCK','Fixture local chưa có quy tắc chuyên môn cho cây dễ hư hỏng cao.');return p;
  }
  const s=input.shipment;
  if(s.orientation!=='UPRIGHT'){p.outcome='NEEDS_EXPERT';trace('ORIENTATION','Tư thế vận chuyển','BLOCK','Chưa xác nhận được hướng kiện thẳng đứng.');return p;}
  // These ranges are draft-only fixtures, never activated by default in production.
  if(s.minTemp!<10||s.maxTemp!>32||s.duration!>48){p.outcome='NEEDS_EXPERT';trace('CONTEXT_SCOPE','Phạm vi fixture','BLOCK','Điều kiện nằm ngoài fixture local. Cần quy tắc chuyên môn được duyệt.');return p;}
  const dec=(v:number)=>new Decimal(v);
  const length=dec(Math.max(input.plant.length!,input.plant.potDiameter!)).plus(dec(pack.paddingCm).times(2)).toNumber();
  const width=dec(Math.max(input.plant.width!,input.plant.potDiameter!)).plus(dec(pack.paddingCm).times(2)).toNumber();
  const height=dec(input.plant.height!).plus(dec(pack.paddingCm).times(2)).toNumber();
  p.package={length,width,height,weight:null};
  const boxes=input.materials.filter(m=>m.category==='BOX'&&m.quantity>=1&&m.condition==='GOOD'&&m.confirmed);
  const fitting=boxes.filter(b=>b.length!==null&&b.width!==null&&b.height!==null&&b.length>=length&&b.width>=width&&b.height>=height);
  if(!fitting.length){p.outcome='FAIL';p.missingMaterials.push('Hộp có kích thước trong phù hợp');trace('BOX_FIT','Kích thước trong hộp','FAIL',`Cần tối thiểu ${length} × ${width} × ${height} cm theo fixture đệm ${pack.paddingCm} cm mỗi phía.`);return p;}
  const categories=['PADDING','FIXING','TAPE','LABEL'] as const;
  const labels={PADDING:'Vật tư chèn',FIXING:'Tấm cố định chậu',TAPE:'Băng keo',LABEL:'Nhãn hướng kiện'};
  const chosen=categories.map(category=>input.materials.find(m=>m.category===category&&m.quantity>0&&m.confirmed&&m.condition==='GOOD'));
  categories.forEach((c,i)=>{if(!chosen[i])p.missingMaterials.push(labels[c]);});
  if(p.missingMaterials.length){p.outcome='NEEDS_INPUT';trace('MATERIALS_AVAILABLE','Vật tư thực có','BLOCK',p.missingMaterials.join(', '));return p;}
  if(chosen.some(m=>m!.weight===null)||fitting.every(b=>b.weight===null||b.maxLoad===null)){
    p.outcome='NEEDS_INPUT';p.missingFields.push('Khối lượng vật tư và tải trọng hộp có nguồn');trace('BOX_LOAD','Kiểm tải trọng','BLOCK','Thiếu thành phần khối lượng hoặc tải trọng: chưa được phép kết luận đủ tải.');return p;
  }
  const matching=fitting.map(b=>({box:b,total:chosen.reduce((sum,m)=>sum.plus(dec(m!.weight!).times(m!.quantity)),dec(input.plant.weight!)).plus(b.weight??0)})).filter(x=>x.box.weight!==null&&x.box.maxLoad!==null&&x.total.lte(x.box.maxLoad));
  if(!matching.length){p.outcome='FAIL';trace('BOX_LOAD','Kiểm tải trọng','FAIL','Tổng khối lượng cây/chậu và vật tư vượt tải trọng hộp đã khai báo.');return p;}
  matching.sort((a,b)=>input.priority==='COST'?(a.box.price??Number.MAX_SAFE_INTEGER)-(b.box.price??Number.MAX_SAFE_INTEGER):input.priority==='REUSE'?Number(b.box.reusable)-Number(a.box.reusable):a.box.id.localeCompare(b.box.id));
  const best=matching[0];p.boxId=best.box.id;p.package.weight=best.total.toNumber();
  trace('BOX_FIT','Kích thước trong hộp','PASS',`${best.box.length} × ${best.box.width} × ${best.box.height} cm phù hợp bao hình ${length} × ${width} × ${height} cm.`);
  trace('BOX_LOAD','Kiểm tải trọng','PASS',`${best.total.toString()} kg không vượt ${best.box.maxLoad} kg.`);
  trace('MATERIALS_AVAILABLE','Vật tư thực có','PASS','Chỉ dùng vật tư số lượng đã xác nhận, không tự tạo vật tư đang có.');
  trace('ORIENTATION','Tư thế vận chuyển','PASS','Giữ thẳng đứng theo dữ liệu người dùng xác nhận.');
  p.warnings.push({code:'WEATHER_CONTEXT',text:'Nhiệt độ ngoài trời không phải nhiệt độ trong kiện; dữ liệu chỉ phủ phạm vi đã khai báo.',acknowledgeable:true});
  const used=[best.box,...chosen.map(m=>m!)];
  p.usedMaterialIds=used.map(m=>m.id);
  p.cost.known=used.reduce((sum,m)=>m.price===null?sum:sum.plus(dec(m.price).times(m.category==='BOX'?1:m.quantity)),dec(0)).toNumber();
  const known=used.filter(m=>m.price!==null).length;p.cost.completeness=known===used.length?'FULL':known===0?'UNKNOWN':'PARTIAL';
  p.steps=steps();p.outcome=p.warnings.some(w=>w.acknowledgeable)?'WARN_ACK':'PASS';
  trace('STEP_TEMPLATE','Mẫu bước đóng gói','PASS',`6 bước có sơ đồ từ template ${pack.templateVersion}; fixture chưa duyệt chuyên môn.`);
  return p;
}
export function steps():Step[]{
  const data=[
    ['PREPARE','Kiểm tra cây và đầu vào','Đối chiếu số đo, khối lượng và tình trạng cây với dữ liệu đã xác nhận. Chuẩn bị đúng vật tư được liệt kê.','Số đo và vật tư đúng với hồ sơ.','Không thay số đo để làm vừa hộp.','CONFIRMED_INPUT'],
    ['FIX_POT','Cố định chậu','Theo sơ đồ thử nghiệm, dùng tấm cố định phù hợp quanh chậu; kiểm chậu không xê dịch.','Chậu đứng vững, không xê dịch.','Không siết dây trực tiếp vào thân cây.','ORIENTATION'],
    ['PROTECT','Chèn và bảo vệ tán','Đặt vật tư chèn theo mẫu, giữ khoảng đệm được chỉ định; không ép hoặc gập tán.','Tán không bị ép/gập.','Kỹ thuật cần được duyệt trước sử dụng thực tế.','MATERIALS_AVAILABLE'],
    ['BOX','Đặt cây vào hộp','Đặt chậu thẳng đứng vào hộp đã vượt kiểm kích thước và tải trọng. Giữ các khoảng đệm.','Đúng tư thế và đủ khoảng đệm.','Không dùng hộp nhỏ hơn bao hình yêu cầu.','BOX_FIT'],
    ['CHECK','Kiểm tra kích thước và tải trọng','Đo/cân kiện thực tế; đối chiếu giới hạn đã xác nhận và kiểm độ ổn định.','Kích thước/khối lượng thực tế đúng giới hạn.','Dừng nếu vượt giới hạn hoặc có vật tư chưa xác nhận.','BOX_LOAD'],
    ['LABEL','Dán nhãn và kiểm tra lần cuối','Dán nhãn hướng kiện, ghi cảnh báo của phương án; chụp ảnh kiểm tra nếu cần và rà soát checklist.','Nhãn rõ, checklist bắt buộc đầy đủ.','Không tự đặt vận chuyển hoặc cam kết nhà vận chuyển nhận kiện.','STEP_TEMPLATE']
  ];
  return data.map(([code,title,instruction,check,warning,ruleId],i)=>({id:`step-${i+1}`,order:i+1,code,title,instruction,check,warning,ruleIds:[ruleId],illustration:`/illustrations/step-${i+1}.svg`}));
}
