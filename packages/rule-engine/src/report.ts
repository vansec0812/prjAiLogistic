import Decimal from 'decimal.js';
import type { CaseInput, Plan, PackingReport, RulePack, Step } from '../../domain/src/index';
import { KNOWLEDGE_VERSION, referencesFor } from '../../knowledge/src/index';
const n=(value:number|null)=>value===null?'chưa biết':new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(value);
const categories={BOX:'Hộp carton',PADDING:'Vật tư chèn',FIXING:'Cố định chậu',TAPE:'Băng keo',LABEL:'Nhãn hướng kiện'};

export function buildReport(input:CaseInput,pack:RulePack,plan:Plan):PackingReport{
  const p=input.plant,s=input.shipment,box=input.materials.find(m=>m.id===plan.boxId),total=plan.package.weight;
  return {
    schemaVersion:'packing-report-v2',knowledgeVersion:KNOWLEDGE_VERSION,generationMode:'DETERMINISTIC_RULE_TEMPLATE',
    summary:plan.outcome==='FAIL'?'Dữ liệu hiện tại không vượt kiểm hộp/vật tư. Dừng và sửa hồ sơ.':plan.outcome==='NEEDS_INPUT'?'Cần bổ sung dữ liệu trước khi lập hướng dẫn thao tác.':plan.outcome==='NEEDS_EXPERT'?'Hồ sơ ngoài phạm vi rule đã duyệt hoặc cần chuyên gia.':'Một phương án cho snapshot đã xác nhận; đọc cảnh báo và kiểm kiện thực tế trước khi hoàn tất.',
    preflight:[
      {label:'Cao tổng / tán / chậu',value:`${n(p.height)} / ${n(p.length)} × ${n(p.width)} / ${n(p.potDiameter)} × ${n(p.potHeight)} cm`,status:[p.height,p.length,p.width,p.potDiameter,p.potHeight].every(v=>v!==null)?'KNOWN':'UNKNOWN'},
      {label:'Cây + chậu + đất',value:`${n(p.weight)} kg`,status:p.weight===null?'UNKNOWN':'KNOWN'},
      {label:'Bao hình có đệm fixture',value:`${n(plan.package.length)} × ${n(plan.package.width)} × ${n(plan.package.height)} cm`,status:plan.package.length===null?'UNKNOWN':'KNOWN'},
      {label:'Hộp trong / tải trọng',value:box?`${n(box.length)} × ${n(box.width)} × ${n(box.height)} cm / ${n(box.maxLoad)} kg`:'Chưa chọn hộp vượt kiểm',status:box?'KNOWN':'UNKNOWN'},
      {label:'Khối lượng tính / phần tải còn',value:total===null?'Chưa tính được':`${n(total)} kg / ${box?.maxLoad!==null&&box?.maxLoad!==undefined?n(new Decimal(box.maxLoad).minus(total).toNumber())+' kg':'chưa biết'}`,status:total===null?'UNKNOWN':'KNOWN'},
      {label:'Bối cảnh khai báo',value:`${n(s.duration)} giờ; ${n(s.minTemp)}–${n(s.maxTemp)} °C; ${s.coverage}`,status:s.duration!==null&&s.minTemp!==null&&s.maxTemp!==null?'KNOWN':'UNKNOWN'}
    ],
    materials:input.materials.filter(m=>plan.usedMaterialIds.includes(m.id)).map(m=>{const quantity=m.category==='BOX'?1:m.quantity;return {id:m.id,name:m.name,category:m.category,quantity,unit:m.unit,unitPrice:m.price,subtotal:m.price===null?null:new Decimal(m.price).times(quantity).toNumber(),weight:m.weight};}),
    assumptions:[
      `Tính bao hình thẳng đứng với đệm ${pack.paddingCm} cm mỗi phía từ rule ${pack.version}; đây là fixture, không phải số đo ngoài kiện.`,
      'Chỉ dùng số đo/cân do người dùng xác nhận; ảnh minh họa và nhận diện không cung cấp số đo.',
      'Khối lượng vật tư/giá theo lượng đã chọn; đơn giá chưa biết không phải miễn phí.',
      'Dữ liệu môi trường là bối cảnh khai báo, không đo nhiệt độ/độ ẩm trong kiện hoặc bảo đảm toàn tuyến.'
    ],
    stopConditions:[
      ...plan.missingFields.map(f=>'Thiếu: '+f),...plan.missingMaterials.map(f=>'Thiếu vật tư: '+f),
      'Dừng khi hộp biến dạng, chậu xê dịch, đất rơi, lá bị ép/gập hoặc xuất hiện nước tự do.',
      'Dừng khi số cân thực vượt tải trọng đã biết, vật tư thay đổi hoặc đầu vào không còn khớp phiên bản.',
      'Nhà vận chuyển không chấp nhận điều kiện cần thiết: cập nhật bối cảnh và xin đánh giá lại.'
    ],
    handover:[
      'Đối chiếu loại cây/chậu, trạng thái kiện và yêu cầu nhận gửi của hãng; không mặc định dịch vụ thường là cold chain.',
      'Nhãn hướng lên chỉ là nhãn xử lý, không bảo đảm tư thế trong mạng lưới vận chuyển.',
      'Lưu số đo/cân kiện thực và ảnh kiểm tra của chính hồ sơ; không dùng ảnh AI làm bằng chứng.',
      'Ghi thời điểm bàn giao thực tế. Dữ liệu SHIPPED do người dùng tự khai báo, không phải tracking tự động.'
    ],
    recipientChecks:[
      'Ghi nhận bên ngoài kiện trước khi mở: móp, ướt, rách hoặc dấu nghiêng đổ.',
      'Mở từ phía phù hợp, không cắt sát tán/thân/chậu; ghi nhận trạng thái chậu, bầu đất và lá.',
      'Ảnh/video mở kiện nên là dữ liệu thật; không suy nguyên nhân hư hỏng chỉ từ một ảnh.',
      'Cây có dấu hư hại hoặc nhóm chưa rõ: liên hệ người bán/chuyên gia; không tự chẩn đoán từ report.'
    ],
    references:referencesFor(['FEDEX','EMS','UFP','CAYXINH','NTC']),
    limits:[
      'Nguồn thực hành được diễn giải, có phạm vi riêng và chưa được chuyên gia PlantCare duyệt.',
      'Không áp dụng ngưỡng 5 kg của hướng dẫn EMS cũ hoặc 8°C/60% của dự án container làm ngưỡng chung.',
      'Ảnh chụp thật được mô phỏng bằng AI: generic, không đúng danh tính cây/vật tư và không chứng nhận kỹ thuật.',
      'Report do Rule Engine/template tạo với tri thức tham khảo; không tuyên bố đã fine-tune hoặc đo accuracy model.'
    ]
  };
}

export function enrichSteps(input:CaseInput,plan:Plan,base:Step[]):Step[]{
  const p=input.plant,b=plan.package,used=input.materials.filter(m=>plan.usedMaterialIds.includes(m.id));
  const materialIds=(categories:string[])=>used.filter(m=>categories.includes(m.category)).map(m=>m.id);
  const detail=[
    {goal:'Đối chiếu đúng cây/chậu và đầy đủ dụng cụ trước khi thao tác.',actions:[`Đo cao tổng ${n(p.height)} cm, tán ${n(p.length)} × ${n(p.width)} cm và chậu ${n(p.potDiameter)} × ${n(p.potHeight)} cm; không ép lá để đạt số đo.`,`Cân cả cây, chậu và đất: dữ liệu snapshot ${n(p.weight)} kg. Nếu lệch, sửa hồ sơ và tạo phiên bản mới.`,`Chuẩn bị đúng các vật tư đã chọn trong bảng; để riêng hộp hư và vật tư chưa xác nhận.`],checkpoints:['Sáu số đo/cân khớp cây thực và đã xác nhận.','Không có cành gãy, đất rơi hoặc nước tự do trước thao tác.'],stopConditions:['Thiếu dụng cụ đo/cân hoặc cây thực khác snapshot.'],tools:['Thước đo','Cân'],materialIds:plan.usedMaterialIds,evidenceIds:['CAYXINH','EMS']},
    {goal:'Giữ chậu/bầu đất ổn định, tách lực cố định khỏi thân và tán.',actions:['Kiểm tra chậu, bầu đất và bề mặt giá thể; không tự tách đất, chuyển rễ trần hoặc tưới theo lịch không có nguồn.','Dùng giải pháp cố định chậu trong template đã chọn; kiểm tiếp xúc tại chậu/insert, không siết dây hoặc dán keo vào thân cây.','Giữ giá thể không tràn và tránh nước tự do; kiểm chậu ổn định bằng thao tác nhẹ, không lắc mạnh.'],checkpoints:['Chậu không xê dịch trong vùng cố định.','Cổ/thân cây không chịu lực buộc hoặc áp lực từ insert.'],stopConditions:['Chậu nứt, khóa chậu không ổn định hoặc bầu đất vỡ.'],tools:['Dụng cụ kiểm tra chậu'],materialIds:materialIds(['FIXING','PADDING']),evidenceIds:['FEDEX','EMS']},
    {goal:'Bảo vệ tán và khoảng trống mà không nén lá hoặc gập cành.',actions:['Kiểm các điểm dễ dập/gãy trước khi đặt đệm; không tự tỉa lá sống để vừa hộp.',`Bố trí vật tư chèn bên thành hộp theo khoảng đệm fixture; bao hình yêu cầu ${n(b.length)} × ${n(b.width)} × ${n(b.height)} cm.`,'Giữ đệm khỏi ép trực tiếp lên tán; không quấn kín tán trong túi nhựa hoặc suy yêu cầu thông khí từ ảnh minh họa.'],checkpoints:['Lá/cành không bị ép, gập hoặc mắc vào thành hộp.','Đệm không biến thành lực nén lên cây.'],stopConditions:['Cần bẻ/gập cây hoặc bỏ đệm chỉ để làm vừa hộp.'],tools:['Quan sát toàn bộ tán'],materialIds:materialIds(['PADDING']),evidenceIds:['UFP','CAYXINH']},
    {goal:'Đặt cây thẳng đứng trong đúng hộp đã vượt kiểm của snapshot.',actions:['Giữ và nâng tại chậu, không kéo thân hoặc tán; đặt vào vùng cố định ở đáy hộp.','Đối chiếu kích thước trong/tải trọng của đúng hộp trong bảng vật tư, không dùng hộp thay thế chưa xác nhận.','Kiểm tra đường đóng nắp không chạm lá; nếu cần thay hộp/vật tư, cập nhật đầu vào và tạo lại.'],checkpoints:['Đúng hộp, đúng tư thế khai báo, chậu giữ ổn định.','Nắp và thành hộp không chạm/ép tán.'],stopConditions:['Hộp cần nén cây hoặc tư thế thực khác dữ liệu xác nhận.'],tools:['Thước kiểm kích thước trong'],materialIds:materialIds(['BOX','FIXING','PADDING']),evidenceIds:['FEDEX','UFP']},
    {goal:'Đo/cân kiện thật và kiểm lại cấu trúc trước khi hoàn tất.',actions:[`Cân kiện sau khi dùng đủ vật tư. Khối lượng tính trong report là ${n(b.weight)} kg; số cân thực phải được người dùng nhập riêng.`,'Đo kích thước ngoài kiện để ghi nhận thực tế; không lấy bao hình có đệm làm số đo ngoài hộp.','Kiểm nắp, đáy và độ ổn định nhẹ; không tiến hành phép thử rơi/lắc mạnh chưa có quy trình được duyệt.'],checkpoints:['Số cân thực không vượt tải trọng hộp đã xác nhận.','Kiện không biến dạng; chậu/giá thể không xê dịch hoặc rơi.'],stopConditions:['Cân vượt tải trọng, số liệu không khớp hoặc vật tư thay đổi.'],tools:['Cân kiện','Thước đo ngoài kiện'],materialIds:materialIds(['BOX','TAPE']),evidenceIds:['FEDEX','UFP']},
    {goal:'Hoàn tất checklist và giữ bằng chứng thật cho bàn giao.',actions:['Dán nhãn xử lý theo yêu cầu hãng; không coi mũi tên là bảo đảm kiện được giữ thẳng.','Chụp kiện thật sau kiểm, đối chiếu đủ sáu bước và nhập số đo/cân thực tế khi xác nhận hoàn tất.','Kiểm điều kiện nhận gửi và thời điểm bàn giao; không tự cam kết nhiệt/ẩm hoặc ETA chắc chắn.'],checkpoints:['Nhãn rõ, các bước bắt buộc đã xác nhận đúng phiên bản.','Ảnh chứng cứ là ảnh thật của hồ sơ, không phải ảnh AI.'],stopConditions:['Checklist thiếu, phiên bản STALE hoặc hãng không chấp nhận điều kiện cần thiết.'],tools:['Thiết bị chụp ảnh thật','Checklist'],materialIds:materialIds(['TAPE','LABEL']),evidenceIds:['FEDEX','EMS','NTC']}
  ];
  return base.map((step,i)=>({...step,...detail[i],instruction:detail[i].actions.join(' '),check:detail[i].checkpoints.join(' '),warning:detail[i].stopConditions.join(' '),expectedResult:detail[i].checkpoints.join(' '),schematic:step.illustration,illustration:input.plant.group==='FOLIAGE'?`/photos/step-${i+1}-v2.webp`:step.illustration,illustrationKind:input.plant.group==='FOLIAGE'?'AI_PHOTOREALISTIC':'SCHEMATIC',illustrationNotice:input.plant.group==='FOLIAGE'?'Ảnh AI cây mẫu trầu bà · không phải ảnh cây/kiện của bạn · kỹ thuật chưa duyệt chuyên môn':'Sơ đồ generic · không đúng danh tính cây thực · kỹ thuật chưa duyệt chuyên môn'}));
}
