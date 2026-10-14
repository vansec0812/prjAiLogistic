import type { CaseInput } from './index';
export interface ReadinessItem {id:string;label:string;stage:'plant'|'materials'|'shipment';complete:boolean;reason:string;}
export function getReadiness(input:CaseInput,now=Date.now()){
  const p=input.plant,s=input.shipment,materials=input.materials;
  const positive=(v:number|null)=>v!==null&&Number.isFinite(v)&&v>0;
  const available=(category:string)=>materials.filter(m=>m.category===category&&m.quantity>0&&m.confirmed&&m.condition==='GOOD');
  const boxes=available('BOX').filter(m=>m.quantity>=1);
  const items:ReadinessItem[]=[
    {id:'plant-group',label:'Nhóm và mức dễ hư',stage:'plant',complete:p.group!=='UNKNOWN'&&p.fragility!=='UNKNOWN',reason:'Chọn nhóm và mức dễ hư; chưa rõ thì liên hệ hỗ trợ.'},
    {id:'measurements',label:'Sáu số đo/cân thực tế',stage:'plant',complete:[p.height,p.length,p.width,p.potDiameter,p.potHeight,p.weight].every(positive)&&p.height!>=p.potHeight!,reason:'Đo cao tổng/tán/chậu và cân cả cây, chậu, đất; cao tổng không nhỏ hơn chậu.'},
    {id:'plant-confirmed',label:'Xác nhận dữ liệu cây',stage:'plant',complete:p.confirmed,reason:'Đánh dấu xác nhận sau khi đo/cân; AI không thay thế bước này.'},
    {id:'box',label:'Hộp có số đo trong và tải trọng',stage:'materials',complete:boxes.some(m=>[m.length,m.width,m.height,m.maxLoad].every(positive)&&m.weight!==null),reason:'Ít nhất một hộp dùng được, số lượng ≥1, đã xác nhận, có kích thước trong/tải trọng/khối lượng.'},
    {id:'supplies',label:'Chèn, cố định, keo và nhãn',stage:'materials',complete:['PADDING','FIXING','TAPE','LABEL'].every(c=>available(c).some(m=>m.weight!==null)),reason:'Khai báo ít nhất một vật tư đã xác nhận/khối lượng cho mỗi loại; không tự coi thiếu là đang có.'},
    {id:'route',label:'Hành trình và ngày gửi hợp lệ',stage:'shipment',complete:!!s.origin.trim()&&!!s.destination.trim()&&positive(s.duration)&&Number.isFinite(Date.parse(s.departure))&&Date.parse(s.departure)>now,reason:'Nơi đi/đến, thời lượng >0 và ngày gửi trong tương lai.'},
    {id:'weather',label:'Min/max nhiệt độ có nguồn',stage:'shipment',complete:s.minTemp!==null&&s.maxTemp!==null&&s.minTemp<=s.maxTemp&&!!s.weatherSource.trim(),reason:'Nhập min/max đúng thứ tự và ghi nguồn; nhiệt ngoài trời không phải trong kiện.'},
    {id:'context-confirmed',label:'Xác nhận bối cảnh hành trình',stage:'shipment',complete:s.confirmed&&!!s.observedAt,reason:'Xác nhận bối cảnh, lưu thời điểm khai báo nguồn.'}
  ];
  const done=items.filter(i=>i.complete).length;
  return {ready:done===items.length,done,total:items.length,items,missing:items.filter(i=>!i.complete)};
}
