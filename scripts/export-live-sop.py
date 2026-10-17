"""Export the exact trial catalog and a review packet; no approval is granted."""
import json, hashlib, sys, csv, shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT/'docs'/'live-sop-v2'
OUT.mkdir(parents=True,exist_ok=True)
src=ROOT/'apps/web/src/data/live-sops.json'
raw=src.read_bytes(); bank=json.loads(raw)
shutil.copyfile(src,OUT/'kho_sop_kiem_thu_v2.json')
lines=['# PlantMove — SOP kiểm thử có nguồn v2', '', '**DỰ THẢO — CHƯA DUYỆT CHUYÊN MÔN — CHƯA ĐÁNH GIÁ ẢNH THẬT.**', '',
       'Catalog này đã được tích hợp vào ứng dụng local. Đây là bản biên tập để shop thẩm định, không phải tiêu chuẩn Việt Nam hoặc kết quả thử vận chuyển.', '',
       'Sáu nhánh thay thế cách tổ chức bốn hồ sơ ứng viên cũ. Không chuyển hồ sơ thiếu căn cứ thành đã duyệt. Các chuỗi mới được ghi rõ nguồn và giới hạn. Tiêu chí camera là đề xuất kiểm thử của PlantMove.', '']
for source in bank['sources']:
    lines += [f"- [{source['id']} — {source['title']}]({source['url']}); đọc {source['accessed_at']}. {source['limitation']}"]
review={'catalog_sha256':hashlib.sha256(raw).hexdigest(),'status':'AWAITING_HUMAN_REVIEW','reviewer':None,'reviewed_at':None,'approval_evidence':None,'transport_test_evidence':None,'real_photo_evaluation':None,'sops':[]}
trace=[]
for sop in bank['sops']:
    lines += ['',f"## {sop['id']} — {sop['title']}",'',f"Phiên bản: {sop['version']}. Thay hồ sơ nghiên cứu: {sop['supersedes_research']}.",sop['scope'],'']
    if sop['limits']:
        lines += ['Giới hạn của nguồn: chậu 2–4 inch cho nhánh nguyên chậu; cao dưới 8 inch; kiện dưới 3 lb. Đây là phạm vi tham khảo cần thẩm định, không tự khẳng định cây trong phạm vi sẽ an toàn.','']
    section={'sop_id':sop['id'],'version':sop['version'],'species_scope':None,'shop':None,'carrier_service_scope':None,'eta_source':None,'materials_and_measurements':None,'decision':None,'steps':[]}
    for step in sop['steps']:
        lines += [f"### {step['id']} — {step['title']}",'',f"- Loại kiểm: {'trực tiếp, không gửi ảnh' if step['mode']=='manual' else 'ảnh và kiểm tay'}.",f"- Lời đọc cố định: {step['speech_vi']}",f"- Kiểm tay: {step['manual']}",f"- Nguồn: {step['source_id']} / {step['source_locator']}."]
        if step['mode']=='visual':
            lines += [f"- Góc kiểm: {step['camera_prompt_vi']}"]
            for c in step['criteria']:
                lines += [f"- {c['id']} — Đạt phần nhìn thấy: {c['visible_pass']} Lỗi nhìn thấy: {c['visible_fail']}"]
            lines += ['- Không đủ góc, sai đối tượng, mờ/tối/che khuất: không thể xác minh; không suy phần bên trong.',f"- Khi chưa rõ: {step['remedy_vi']}"]
        lines += ['- Phê duyệt kỹ thuật/tiêu chí: chưa có.','']
        section['steps'].append({'step_id':step['id'],'technical_approved':None,'visual_criteria_approved':None,'manual_method':None,'remedy_review':None,'exceptions':None,'reviewer_notes':None})
        trace.append([sop['id'],sop['version'],step['id'],step['mode'],step['source_id'],step['source_locator']])
    review['sops'].append(section)
(OUT/'SOP_VA_TIEU_CHI.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
(OUT/'PHIEU_DUYET_CHO_SHOP.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
with (OUT/'TRUY_VET.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.writer(f); writer.writerow(['sop_id','version','step_id','mode','source_id','source_locator']); writer.writerows(trace)
shutil.copyfile(ROOT/'SOP_INTEGRATION.md',OUT/'HUONG_DAN_TICH_HOP.md')
shutil.copyfile(ROOT/'evaluation/live-sop/README.md',OUT/'HUONG_DAN_DANH_GIA_ANH_THAT.md')
shutil.copyfile(ROOT/'evaluation/live-sop/report.json',OUT/'KET_QUA_DANH_GIA_ANH_THAT.json')
print(json.dumps({'sops':len(bank['sops']),'steps':len(trace),'manual_steps':sum(s['mode']=='manual' for p in bank['sops'] for s in p['steps']),'sha256':review['catalog_sha256']}))
