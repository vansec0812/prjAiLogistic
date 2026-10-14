import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import type { PlanVersion } from '@plantcare/domain';
import { renderPdf, publicAsset } from './pdf';

export type ExportFormat='PDF'|'MARKDOWN'|'JSON'|'BUNDLE';
export const exportMetadata={PDF:{extension:'pdf',mime:'application/pdf'},MARKDOWN:{extension:'md',mime:'text/markdown; charset=utf-8'},JSON:{extension:'json',mime:'application/json; charset=utf-8'},BUNDLE:{extension:'zip',mime:'application/zip'}} as const;
const money=(n:number|null)=>n===null?'Chưa biết':new Intl.NumberFormat('vi-VN').format(n)+' đ';
const md=(value:string)=>value.replace(/[\\`*_{}[\]<>|#]/g,'\\$&').replace(/[\r\n]+/g,' ');
export function serializeReport(version:PlanVersion){
  return {schema_version:'plantcare-export-v2',version_id:version.id,version_number:version.number,created_at:version.createdAt,input_hash:version.inputHash,
    provenance:{rule_version:version.plan.ruleVersion,template_version:version.plan.templateVersion,knowledge_version:version.plan.report?.knowledgeVersion||null,generation_mode:'DETERMINISTIC_RULE_TEMPLATE',model_fine_tuned:false},
    image_notice:'Ảnh AI generic; không phải bằng chứng hồ sơ thật. Quy tắc/sơ đồ cần duyệt chuyên môn.',
    outcome:version.plan.outcome,plan:version.plan};
}
export function markdownReport(version:PlanVersion,bundled=false){
  const {plan}=version,r=plan.report,lines=[`# PlantCare · Hồ sơ đóng gói chi tiết v${version.number}`,'',`- Kết quả: **${plan.outcome}**`,`- Rule: ${plan.ruleVersion}; template: ${plan.templateVersion}; knowledge: ${r?.knowledgeVersion||'legacy'}`,`- Snapshot: \`${version.inputHash}\``,`- Tạo: ${version.createdAt}`,'','> Nội dung từ engine/template, không tuyên bố fine-tuning. Ảnh AI là minh họa generic, không phải ảnh cây/kiện hoặc chứng nhận an toàn.','',r?.summary||'Kết quả theo snapshot.','', '## Thông số và giả định',''];
  for(const item of r?.preflight||[])lines.push(`- ${md(item.label)}: ${md(item.value)} (${item.status})`);
  lines.push('',...(r?.assumptions||[]).map(x=>'- '+md(x)),'','## Vật tư và chi phí','','| Vật tư | Lượng dùng | Đơn giá | Thành tiền |','| --- | --- | --- | --- |');
  for(const m of r?.materials||[])lines.push(`| ${md(m.name)} | ${m.quantity} ${md(m.unit)} | ${money(m.unitPrice)} | ${money(m.subtotal)} |`);
  lines.push('',`Phần chi phí đã biết: **${money(plan.cost.known)}** (${plan.cost.completeness}); không gồm cước.`,'','## Cảnh báo và điều kiện dừng','',...plan.warnings.map(w=>'- '+md(w.text)),...(r?.stopConditions||[...plan.missingFields,...plan.missingMaterials]).map(x=>'- '+md(x)));
  for(const step of plan.steps){lines.push('',`## ${step.order}. ${md(step.title)}`,'',md(step.goal||step.instruction),'');const image=bundled?'assets/'+path.basename(step.illustration):step.illustration;lines.push(`![Ảnh minh họa bước ${step.order}](${image})`,'',md(step.illustrationNotice||'Sơ đồ chưa duyệt chuyên môn.'),'','### Thao tác','',...(step.actions||[step.instruction]).map((x,i)=>`${i+1}. ${md(x)}`),'','### Tiêu chí kiểm','',...(step.checkpoints||[step.check]).map(x=>'- [ ] '+md(x)),'', '**Dừng nếu:** '+(step.stopConditions||[step.warning]).map(md).join(' '),'',`Dụng cụ: ${(step.tools||[]).map(md).join(', ')}. Vật tư: ${(step.materialIds||[]).map(md).join(', ')}.`,`Quy tắc: ${step.ruleIds.join(', ')}. Nguồn: ${(step.evidenceIds||[]).join(', ')}.`);}
  lines.push('','## Bàn giao và khi nhận','',...(r?.handover||[]).map(x=>'- '+md(x)),'','### Khi mở kiện','',...(r?.recipientChecks||[]).map(x=>'- '+md(x)),'','## Giải thích quyết định','');
  for(const t of plan.trace)lines.push(`- **${md(t.name)}** (${t.ruleId}@${t.version}; ${t.outcome}): ${md(t.reason)}`);
  lines.push('','## Nguồn tham khảo và phạm vi','');for(const ref of r?.references||[])lines.push(`- [${md(ref.title)}](${ref.url}) · ${ref.id} · ${ref.reviewStatus}. ${md(ref.scope)}. ${md(ref.limitation)}`);
  lines.push('','## Giới hạn','',...(r?.limits||[]).map(x=>'- '+md(x)),'');return lines.join('\n');
}
export async function renderExport(version:PlanVersion,format:ExportFormat){
  if(format==='JSON')return strToU8(JSON.stringify(serializeReport(version),null,2));
  if(format==='MARKDOWN')return strToU8(markdownReport(version));
  const pdf=await renderPdf(version);if(format==='PDF')return pdf;
  const files:Record<string,Uint8Array>={'PlantCare.pdf':pdf,'PlantCare.md':strToU8(markdownReport(version,true)),'PlantCare.json':strToU8(JSON.stringify(serializeReport(version),null,2)), 'README.txt':strToU8('Gói cùng một snapshot: PDF, Markdown, JSON và ảnh AI. Mở PlantCare.md trong thư mục giải nén để thấy ảnh. Ảnh AI không phải ảnh hồ sơ thật; quy tắc/sơ đồ DRAFT. Không có ảnh upload hoặc PII tài khoản trong gói. Không tuyên bố đã huấn luyện model.')};
  for(const step of version.plan.steps){for(const asset of [step.illustration,step.schematic].filter((x):x is string=>!!x)){const file=publicAsset(asset);if(existsSync(file))files['assets/'+path.basename(asset)]=readFileSync(file);}}
  return zipSync(files,{level:0});
}
