import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { PlanVersion } from '@plantcare/domain';

export function publicAsset(asset:string){
  if(!/^\/(?:photos\/(?:hero|step-[1-6])-v2\.(?:png|webp)|illustrations\/step-[1-6]\.svg)$/.test(asset))throw new Error('INVALID_REPORT_ASSET');
  return process.cwd().endsWith(path.join('apps','web'))
    ?path.join(process.cwd(),'public',asset.slice(1))
    :path.join(process.cwd(),'apps/web/public',asset.slice(1));
}
export async function renderPdf(version:PlanVersion):Promise<Uint8Array>{
  const fontPath=[process.env.PLANTCARE_PDF_FONT,path.join(process.cwd(),process.cwd().endsWith(path.join('apps','web'))?'public/fonts/NotoSans.ttf':'apps/web/public/fonts/NotoSans.ttf'),'C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].find(p=>p&&existsSync(p));
  if(!fontPath)throw new Error('PDF_FONT_UNAVAILABLE');
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  const font=await pdf.embedFont(readFileSync(fontPath),{subset:true});
  const green=rgb(.08,.39,.27),ink=rgb(.13,.20,.16);let page=pdf.addPage([595,842]),y=778;
  const amount=(v:number|null)=>v===null?'Chưa biết':new Intl.NumberFormat('vi-VN',{maximumFractionDigits:3}).format(v);
  function newPage(){page=pdf.addPage([595,842]);y=778;}
  function room(height:number){if(y-height<60)newPage();}
  function text(value:string,size=10.5){
    const tokens=value.replace(/[\u2010-\u2015]/g,'-').split(/\s+/).flatMap(word=>{
      const pieces:string[]=[];let current='';for(const char of word){if(font.widthOfTextAtSize(current+char,size)>493){pieces.push(current);current='';}current+=char;}if(current)pieces.push(current);return pieces;
    });let line='';
    function draw(value:string){room(size+6);page.drawText(value,{x:48,y,size,font,color:size>=14?green:ink});y-=size+6;}
    for(const token of tokens){const next=line?line+' '+token:token;if(font.widthOfTextAtSize(next,size)>493){draw(line);line=token;}else line=next;}if(line)draw(line);y-=4;
  }
  function heading(value:string){room(55);y-=9;text(value,15);}
  function bullets(items:string[]){for(const item of items)text('• '+item);}
  const {plan,snapshot}=version,report=plan.report;
  text('PlantCare',26);text('Hồ sơ hướng dẫn đóng gói chi tiết',19);
  text(`Phiên bản ${version.number} · ${new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(version.createdAt))}`);
  text(`Snapshot: ${version.inputHash} · Rule ${plan.ruleVersion} · Template ${plan.templateVersion}`,9);
  text(`Kết quả: ${plan.outcome}. ${report?.summary||'Kết quả theo dữ liệu đã xác nhận của snapshot.'}`,12);
  if(plan.developmentOnly)text('DRAFT — quy tắc, nội dung và ảnh minh họa chưa được duyệt cho vận chuyển thực tế.',11);
  text('Ảnh có phong cách chụp thật được tạo bởi AI. Không phải ảnh cây/kiện của bạn, không chứng minh đóng gói an toàn.',10);
  heading('01 · Điều kiện và thông số đầu vào');
  const p=snapshot.plant,s=snapshot.shipment;
  text(`Nhóm ${p.group}; chiều cao tổng ${amount(p.height)} cm; tán ${amount(p.length)} × ${amount(p.width)} cm; chậu ${amount(p.potDiameter)} × ${amount(p.potHeight)} cm; cây/chậu/đất ${amount(p.weight)} kg.`);
  text(`Hành trình khai báo: ${s.origin} → ${s.destination}; ${amount(s.duration)} giờ; tư thế ${s.orientation}; min/max ${amount(s.minTemp)} / ${amount(s.maxTemp)} °C.`);
  text(`Ngày gửi UTC: ${s.departure||'Chưa biết'}. Nguồn môi trường: ${s.weatherSource||'Chưa biết'}; thời điểm ${s.observedAt||'Chưa biết'}; phạm vi ${s.coverage}.`);
  heading('02 · Kết quả tính và điều kiện dừng');
  text(`Bao hình yêu cầu: ${amount(plan.package.length)} × ${amount(plan.package.width)} × ${amount(plan.package.height)} cm. Khối lượng tính: ${amount(plan.package.weight)} kg. Đây không phải số đo ngoài kiện hoặc số cân kiện thực tế.`);
  bullets([...plan.missingFields,...plan.missingMaterials,...plan.warnings.map(w=>w.text)]);
  if(report)bullets(report.stopConditions);
  newPage();text('Bảng vật tư và cơ sở tính',19);
  const materials=report?.materials||snapshot.materials.filter(m=>plan.usedMaterialIds.includes(m.id)).map(m=>({...m,unitPrice:m.price,subtotal:m.price===null?null:m.price*(m.category==='BOX'?1:m.quantity)}));
  if(!materials.length)text('Chưa có vật tư vượt kiểm để chọn. Không tự coi vật tư thiếu là đang có.');
  for(const m of materials){room(48);text(`${m.name} · ${m.category==='BOX'?1:m.quantity} ${m.unit} · ${amount(m.weight)} kg/đơn vị`);text(`Đơn giá ${amount(m.unitPrice)} đ; thành tiền ${amount(m.subtotal)} đ.`,9.5);}
  text(`Phần chi phí đã biết ${amount(plan.cost.known)} đ · ${plan.cost.completeness}; không gồm cước vận chuyển.`,11);
  if(report){heading('Thông số kiểm của phương án');for(const item of report.preflight)text(`${item.label}: ${item.value} · ${item.status}.`);heading('Giả định của phép tính');bullets(report.assumptions);}
  for(const step of plan.steps){
    newPage();text(`BƯỚC ${step.order} / ${plan.steps.length}`,11);text(step.title,21);text(step.goal||step.instruction,11);
    let asset=step.illustration;if(!existsSync(publicAsset(asset)))asset=step.schematic||`/illustrations/step-${step.order}.svg`;
    const bytes=await sharp(readFileSync(publicAsset(asset))).resize({width:1100,withoutEnlargement:true}).flatten({background:'#f5f7f3'}).jpeg({quality:88}).toBuffer();const picture=await pdf.embedJpg(bytes);
    const ratio=Math.min(493/picture.width,235/picture.height),w=picture.width*ratio,h=picture.height*ratio;
    room(h+48);page.drawRectangle({x:48,y:y-h-8,width:493,height:h+16,color:rgb(.96,.97,.95)});page.drawImage(picture,{x:48+(493-w)/2,y:y-h,width:w,height:h});y-=h+23;
    text(step.illustrationNotice||'Sơ đồ minh họa thư viện; kỹ thuật chưa được duyệt chuyên môn.',8.5);
    heading('Thao tác');(step.actions||[step.instruction]).forEach((action,i)=>text(`${i+1}. ${action}`));
    heading('Kiểm trước khi tiếp tục');bullets(step.checkpoints||[step.check]);
    text('Dừng nếu: '+(step.stopConditions||[step.warning]).join(' '),10);
    text('Kết quả mong đợi: '+(step.expectedResult||step.check),10);
    text(`Quy tắc: ${step.ruleIds.join(', ')}. Nguồn tham khảo: ${(step.evidenceIds||[]).join(', ')||'Template nội bộ'}.`,8.5);
  }
  newPage();text('Bàn giao và kiểm tra khi nhận',19);
  heading('Người gửi');bullets(report?.handover||['Đối chiếu yêu cầu của nhà vận chuyển trước khi bàn giao.']);
  heading('Người nhận');bullets(report?.recipientChecks||['Ghi nhận tình trạng kiện và cây khi mở.']);
  heading('Giả định và giới hạn');bullets(report?[...report.assumptions,...report.limits]:['Phương án chỉ có hiệu lực với snapshot này; dữ liệu thay đổi cần tạo lại.']);
  newPage();text('Giải thích và nguồn tham khảo',19);
  for(const trace of plan.trace){heading(`${trace.name} · ${trace.outcome}`);text(trace.reason);text(`${trace.ruleId}@${trace.version} · ${trace.source}`,8.5);}
  if(report?.references.length){newPage();text('Nguồn tham khảo và phạm vi',19);}
  for(const ref of report?.references||[]){room(130);heading(`${ref.id} · ${ref.title}`);text(ref.url,9);text(`Phạm vi: ${ref.scope}. Giới hạn: ${ref.limitation}. Trạng thái chuyên môn: ${ref.reviewStatus}.`,9);}
  for(const [i,p] of pdf.getPages().entries())p.drawText(`PlantCare · v${version.number} · ${plan.ruleVersion} · ${i+1}/${pdf.getPageCount()}`,{x:48,y:27,font,size:8.5,color:green});
  pdf.setTitle('PlantCare — Hồ sơ đóng gói chi tiết');pdf.setAuthor('PlantCare');return pdf.save();
}
