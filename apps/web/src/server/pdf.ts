import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { PlanVersion } from '@plantcare/domain';

export async function renderPdf(version:PlanVersion):Promise<Uint8Array>{
  const fontPath=[process.env.PLANTCARE_PDF_FONT,'C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'].find(p=>p&&existsSync(p));
  if(!fontPath)throw new Error('PDF_FONT_UNAVAILABLE');
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  const font=await pdf.embedFont(readFileSync(fontPath),{subset:true});
  const color=rgb(0.08,0.39,0.27);let page=pdf.addPage([595,842]),y=780;
  function line(text:string,size=11){
    const words=text.split(' ').flatMap(word=>{
      if(font.widthOfTextAtSize(word,size)<=490)return [word];
      const pieces:string[]=[];let piece='';for(const char of word){if(font.widthOfTextAtSize(piece+char,size)>490){pieces.push(piece);piece='';}piece+=char;}if(piece)pieces.push(piece);return pieces;
    });let current='';
    for(const word of words){const next=current?current+' '+word:word;if(font.widthOfTextAtSize(next,size)>490){draw(current,size);current=word;}else current=next;}if(current)draw(current,size);y-=6;
  }
  function draw(text:string,size:number){if(y<60){page=pdf.addPage([595,842]);y=780;}page.drawText(text,{x:48,y,size,font,color:size>13?color:rgb(.16,.21,.18)});y-=size+7;}
  line('PlantCare',25);line(`Hướng dẫn đóng gói - phiên bản ${version.number}`,16);
  line(`Mã hồ sơ: ${version.caseId.slice(0,8)} / Rule ${version.plan.ruleVersion}`);
  line(`Trạng thái: ${version.plan.outcome} / Snapshot ${version.inputHash.slice(0,12)}`);
  line('Bản thử nghiệm - rule và sơ đồ chưa được duyệt cho vận chuyển thực tế.',12);
  for(const warning of version.plan.warnings)line('Cảnh báo: '+warning.text);
  line(`Thông số yêu cầu: ${version.plan.package.length??'?'} x ${version.plan.package.width??'?'} x ${version.plan.package.height??'?'} cm; ${version.plan.package.weight??'?'} kg.`);
  const input=version.snapshot,p=input.plant,s=input.shipment;
  line('Dữ liệu đã xác nhận trong snapshot',15);
  line(`Nhóm cây: ${p.group}. Cao ${p.height??'?'} cm; tán ${p.length??'?'} x ${p.width??'?'} cm; chậu ${p.potDiameter??'?'} x ${p.potHeight??'?'} cm; cây/chậu ${p.weight??'?'} kg.`);
  line(`Hành trình: ${s.origin} → ${s.destination}; ${s.duration??'?'} giờ. Ngày gửi: ${s.departure?new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'short'}).format(new Date(s.departure)):'Chưa biết'}.`);
  line(`Môi trường khai báo: ${s.minTemp??'?'} đến ${s.maxTemp??'?'} °C; phạm vi ${s.coverage}. Nguồn: ${s.weatherSource||'Chưa biết'}.`);
  line('Vật tư được sử dụng',15);
  for(const m of input.materials.filter(m=>version.plan.usedMaterialIds.includes(m.id)))line(`${m.name}: ${m.category==='BOX'?1:m.quantity} ${m.unit}; đơn giá ${m.price===null?'chưa biết':new Intl.NumberFormat('vi-VN').format(m.price)+' đ'}; khối lượng/đơn vị ${m.weight??'?'} kg.`);
  line(`Chi phí vật tư đã biết: ${new Intl.NumberFormat('vi-VN').format(version.plan.cost.known)} đ; mức đầy đủ ${version.plan.cost.completeness}. Không gồm cước vận chuyển.`,12);
  for(const step of version.plan.steps){
    if(y<300){page=pdf.addPage([595,842]);y=780;}
    line(`${step.order}. ${step.title}`,15);
    // Original vector schematic for every step, embedded as an image.
    const svg=readFileSync(path.resolve(process.cwd(),process.cwd().endsWith(path.join('apps','web'))?'public':'apps/web/public',`illustrations/step-${step.order}.svg`));
    const sharp=(await import('sharp')).default;const png=await sharp(svg).png().toBuffer();const illustration=await pdf.embedPng(png);
    page.drawImage(illustration,{x:48,y:y-110,width:160,height:100});y-=122;
    line(step.instruction);line('Kiểm tra: '+step.check);line('Lưu ý: '+step.warning);
  }
  if(y<330){page=pdf.addPage([595,842]);y=780;}
  line('Vì sao đề xuất',15);for(const trace of version.plan.trace)line(`${trace.ruleId}@${trace.version}: ${trace.reason}`);
  for(const [i,p] of pdf.getPages().entries())p.drawText(`PlantCare / v${version.number} / Trang ${i+1} / ${pdf.getPageCount()}`,{x:48,y:28,font,size:9,color});
  pdf.setTitle('PlantCare - Hướng dẫn đóng gói');pdf.setAuthor('PlantCare');return pdf.save();
}
