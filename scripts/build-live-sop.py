"""Build a pinned trial catalog. This never grants professional approval."""
import json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
research = ROOT.parents[1] / 'outputs' / 'PlantMove_Kho_SOP_NghienCuu'
archive = ROOT / 'docs' / 'sop-research'
archive.mkdir(parents=True, exist_ok=True)
if not research.exists():
    research = archive
for name in ('README.md', '01_NGUON_VA_BANG_CHUNG.md', '02_SOP_VA_CHECKPOINT.md', '03_KHOANG_TRONG_VA_DUYET.md', 'kho_sop_du_thao.json', 'bang_truy_vet.csv'):
    if (research / name).resolve() != (archive / name).resolve():
        shutil.copyfile(research / name, archive / name)

sources = [
 dict(id='S02', title='Eurosender — succulents and cacti', url='https://www.eurosender.com/en/pack-ship/plants/succulents-cactus', accessed_at='2026-10-16', locator='How to pack bare-root succulents; How to pack and ship succulents in pots; How to pack and ship cactus', limitation='Hướng dẫn tham khảo nước ngoài; không là tiêu chuẩn Việt Nam hoặc xác nhận nhận gửi.'),
 dict(id='S12', title="Izzy’s Tropicals — small plants", url='https://izzyplants.com/blogs/the-complete-guide-to-shipping-plants/how-to-ship-small-plants-a-complete-step-by-step-guide', accessed_at='2026-10-16', locator='What Counts as a Small Plant; Option A; Option B', limitation='Cây nhỏ, có nêu small pothos; chưa xác nhận riêng giống hoặc điều kiện Việt Nam. Các mức của nguồn chỉ là phạm vi thẩm định.')
]

def step(id, title, instruction, manual, source, locator, mode='manual', camera='', criteria=None):
    return dict(id=id, title=title, instruction=instruction, speech_vi=instruction, manual=manual,
                source_id=source, source_locator=locator, mode=mode, camera_prompt_vi=camera,
                criteria=[dict(id=f'{id}-C{i+1}', visible_pass=a, visible_fail=b) for i,(a,b) in enumerate(criteria or [])],
                unverifiable=['Ảnh mờ, thiếu sáng, sai đối tượng hoặc vùng cần kiểm bị che.', 'Không nhìn đủ vùng được yêu cầu; không suy ra phần đã che kín.'],
                remedy_vi='Đối chiếu hướng dẫn của bước. Nếu ảnh thiếu, đổi góc và kiểm tra lại. Nếu chưa rõ cách sửa hoặc cây bị hư hại, dừng và hỏi người phụ trách; AI không tự bổ sung thao tác.',
                criterion_origin='Đề xuất tiêu chí quan sát của PlantMove, chưa được kiểm chứng chuyên môn.')

def visual(id, title, instruction, manual, source, locator, camera, criteria):
    return step(id,title,instruction,manual,source,locator,'visual',camera,criteria)

profiles=[]
for plant, label in [('succulent','Sen đá'),('cactus','Xương rồng')]:
  for form in ['POTTED','BARE_ROOT']:
    prefix=('ES' if plant=='succulent' else 'EC')+('P' if form=='POTTED' else 'B')
    loc='How to pack and ship succulents in pots' if form=='POTTED' else 'How to pack bare-root succulents for shipping'
    sid=lambda n:f'{prefix}-{n:02}'
    if form=='POTTED':
      steps=[
        step(sid(1),'Xác nhận chậu','Ưu tiên chậu nhựa khi phù hợp.','Shop đã xác nhận loại chậu và quyết định giữ hoặc thay chậu; không tự thay chỉ theo ảnh.','S02',loc+' / 1'),
        step(sid(2),'Kiểm tra độ khô','Kiểm tra đất đủ khô trước khi gói.','Người phụ trách đã kiểm trực tiếp độ khô theo phương pháp của shop. Nếu chưa có cách xác định, dừng.','S02',loc+' / 2'),
        visual(sid(3),'Giữ đất trong chậu','Phủ mặt đất bằng màng nhựa.','Đã kiểm trực tiếp hiệu quả giữ đất và ảnh hưởng của lớp phủ tới cây.','S02',loc+' / 3','Đưa toàn bộ miệng chậu và vùng tiếp giáp thân vào khung hình trước khi bọc cây.', [('Thấy màng phủ trên vùng đất cần giữ, không thấy khoảng đất hở ở vùng cần phủ.','Không có màng hoặc còn vùng đất hở rõ trong vùng cần phủ.')])]
    else:
      steps=[
        step(sid(1),'Chuẩn bị trước ngày gửi','Nguồn đề xuất tưới trước gửi 4–5 ngày.','Shop đã thẩm định lịch chuẩn bị cho đúng loài và ngày gửi. Đây không phải lịch tưới mặc định cho mọi cây.','S02',loc+' / 1'),
        step(sid(2),'Chuẩn bị rễ trần','Lấy cây khỏi đất; rễ còn ẩm cần chờ thêm.','Người có kinh nghiệm xác nhận loài phù hợp rễ trần, tình trạng rễ và điều kiện đủ khô; không suy độ khô từ ảnh.','S02',loc+' / 2'),
        visual(sid(3),'Bọc cây rễ trần','Bọc cây rễ trần bằng giấy mềm.','Đã kiểm tình trạng rễ và cách bọc không làm hư cây.','S02',loc+' / 3','Đưa toàn bộ cây và lớp bọc vào khung hình trước khi đặt hộp.', [('Thấy giấy bọc cây, không còn chậu trong gói rễ trần.','Không có lớp giấy bọc hoặc còn nguyên chậu trong nhánh rễ trần.')])]
    wrap='Bọc giấy mềm; xương rồng thêm bảo vệ ngoài bằng giấy báo hoặc carton.' if plant=='cactus' else 'Bổ sung giấy mềm khi cần.'
    steps += [
      visual(sid(4),'Kiểm lớp bảo vệ',wrap,'Đã kiểm vật liệu và cách bọc không ép, gãy lá, thân hoặc gai. Số lớp do người duyệt xác định; ảnh không đếm được lớp bị che.','S02','How to pack and ship cactus' if plant=='cactus' else loc+' / 4','Đưa toàn bộ lớp bọc ngoài vào khung hình; kiểm phần bên trong trước khi che kín.', [('Thấy lớp bọc giấy quanh cây'+(' và lớp bảo vệ ngoài.' if plant=='cactus' else '.'),'Không thấy lớp bọc'+(' hoặc thiếu lớp bảo vệ ngoài nhìn thấy được.' if plant=='cactus' else '.'))]),
      visual(sid(5),'Đặt vào hộp','Đặt cây đã bọc vào hộp; chèn khi cần.','Đã kiểm trực tiếp độ cố định, độ chắc và mức ép. Không cần lắc cây để AI kiểm.','S02',loc+' / 5','Đưa hộp còn mở, toàn bộ cây và vùng chèn vào khung hình từ trên xuống.', [('Cây đã bọc nằm trong hộp; thấy bố trí vật liệu bên trong.','Cây chưa ở trong hộp hoặc lớp bọc đã tuột, cây nằm ngoài lớp bọc.')]),
      visual(sid(6),'Đóng hộp','Đóng và niêm kín hộp.','Đã kiểm các mặt hộp, chất lượng niêm kín, dữ liệu đơn và yêu cầu nhận gửi; nhãn không bảo đảm kiện luôn thẳng đứng.','S02',loc+' / 6','Đưa mặt đang kiểm vào khung hình. Kiểm từng mặt còn lại trực tiếp; một ảnh không chứng minh toàn bộ hộp.', [('Mặt đang thấy đã đóng; không có khe mở rõ hoặc bộ phận cây nhô qua đường đóng.','Mặt đang thấy còn mở, bật nắp hoặc có bộ phận cây bị kẹp nhô qua đường đóng.')])]
    profiles.append(dict(id=f'{plant.upper()}-{form}-ES',plant=plant,shipping_form=form,title=f'{label} — '+('nguyên chậu' if form=='POTTED' else 'rễ trần'),source_ids=['S02'],scope='Nhóm mọng nước của nguồn; giống cụ thể phải được shop thẩm định.',steps=steps,limits=None))

for form in ['POTTED','BARE_ROOT']:
  p='IZP' if form=='POTTED' else 'IZB'
  sid=lambda n:f'{p}-{n:02}'
  loc='Option A' if form=='POTTED' else 'Option B'
  if form=='POTTED':
    steps=[
      step(sid(1),'Chuẩn bị cây nhỏ','Tưới nhẹ trước 24–48 giờ; để ráo, kiểm cây.','Người phụ trách xác nhận loài, sức khỏe, lịch tưới và thoát nước; không dùng lịch này cho sen đá hoặc xương rồng.','S12',loc+' / Step 1'),
      visual(sid(2),'Giữ đất','Che lỗ thoát; phủ đất, giữ màng bằng thun; bọc túi.','Đã kiểm lỗ thoát trước khi che, độ giữ đất và lực buộc; vật liệu không gây tổn thương thân.','S12',loc+' / Step 2','Đưa miệng chậu, màng, túi và chỗ giữ vào khung hình trước khi bọc ngoài.', [('Thấy lớp phủ mặt đất và túi ngoài chậu cùng chỗ giữ.','Thiếu lớp phủ đất hoặc túi ngoài ở vùng nhìn rõ.')]),
      visual(sid(3),'Bọc chậu','Bọc chậu bằng màng khí 2–3 vòng, cố định băng dính.','Đã tự đếm vòng khi thao tác và kiểm đệm; ảnh lớp ngoài không chứng minh số vòng.','S12',loc+' / Step 3','Đưa toàn bộ lớp đệm quanh chậu vào khung hình.', [('Thấy lớp đệm khí quanh chậu và chỗ giữ.','Chậu không có lớp đệm khí ở vùng nhìn rõ.')])]
  else:
    steps=[
      step(sid(1),'Chuẩn bị rễ trần','Lấy cây khỏi chậu, loại đất; kiểm rễ.','Người có kinh nghiệm xác nhận đúng loài, rễ đủ điều kiện và quyết định xử lý rễ hỏng; AI không chỉ định cắt rễ.','S12',loc+' / Step 1'),
      visual(sid(2),'Bọc rễ','Bọc rễ bằng rêu vừa ẩm, màng và thun.','Đã kiểm độ ẩm rêu và lực buộc theo người phụ trách; không suy từ màu ảnh.','S12',loc+' / Step 2','Đưa bầu rễ đã bọc và chỗ giữ vào khung hình trước khi bọc tán.', [('Thấy gói bọc vùng rễ bằng rêu, màng và chỗ giữ.','Rễ vẫn để trần ngoài gói bọc tại vùng nhìn rõ.')])]
  steps += [
    visual(sid(len(steps)+1),'Bảo vệ tán','Bọc tán nhẹ bằng giấy khi phù hợp.','Shop xác nhận có cần giấy; nếu miễn bước vì lá cứng, ghi xác nhận thủ công. Đã kiểm tán không bị ép hoặc gập.','S12',loc+' / '+('Step 4' if form=='POTTED' else 'Step 3'),'Đưa toàn bộ phần giấy bọc tán vào khung hình trước khi đặt hộp.', [('Thấy giấy bảo vệ tán nếu bước này được yêu cầu.','Không có giấy bảo vệ tán trong trường hợp người phụ trách yêu cầu bọc.')]),
    visual(sid(len(steps)+2),'Xếp hộp','Lót giấy, đặt cây và chèn khoảng trống.','Đã kiểm độ cố định và khoảng trống trực tiếp. Nhánh nguyên chậu: nguồn nêu đáy 2–3 inch và cách miệng hộp 1 inch; phải đo khi thẩm định, không suy qua ảnh.','S12',loc+' / '+('Step 5' if form=='POTTED' else 'Step 4'),'Đưa hộp còn mở với toàn bộ gói cây và phần chèn vào khung hình.', [('Gói cây nằm trong hộp, thấy giấy chèn quanh gói.','Gói cây ngoài hộp hoặc không có giấy chèn quanh gói ở vùng nhìn rõ.')]),
    visual(sid(len(steps)+3),'Kiểm và niêm hộp','Kiểm cố định; dán kiểu H, gắn nhãn.','Đã kiểm trực tiếp độ cố định theo cách được shop duyệt và các mặt dán. Nguồn đề xuất lắc nhẹ nhưng ứng dụng không tự yêu cầu thao tác này khi chưa thẩm định. Đã xác nhận hãng nhận gửi.','S12',loc+' / '+('Step 6' if form=='POTTED' else 'Step 5'),'Đưa một mặt dán kiểu H và nhãn cảnh báo vào khung hình; tự kiểm mặt còn lại. Tránh để lộ địa chỉ.', [('Mặt đang thấy có đường dán kiểu H, nắp đóng và nhãn cảnh báo.','Mặt nhìn rõ còn hở nắp hoặc thiếu đường dán kiểu H/nhãn cảnh báo.')])]
  profiles.append(dict(id=f'POTHOS-{form}-IZ',plant='pothos',shipping_form=form,title='Trầu bà nhỏ — '+('nguyên chậu' if form=='POTTED' else 'rễ trần'),source_ids=['S12'],scope='Small pothos trong hướng dẫn cây nhỏ; không tự áp dụng cho Monstera/Philodendron hoặc cây lớn.',steps=steps,limits=dict(pot_cm_min=5.08,pot_cm_max=10.16,height_cm_exclusive_max=20.32,packed_kg_exclusive_max=1.36077711)))

for profile in profiles:
  profile.update(version='2026.10-trial.1',status='DRAFT',published=False,production_enabled=False,reviewer=None,approved_at=None,validation_status='NOT_EVALUATED',
                 completeness='Có chuỗi bước theo nguồn để thẩm định; chưa xác nhận áp dụng thực tế.',
                 supersedes_research=('POTHOS-GP-CANDIDATE' if profile['plant']=='pothos' else 'CAC-CW-PARTIAL' if profile['plant']=='cactus' else 'SUC-POT-ES' if profile['shipping_form']=='POTTED' else 'SUC-BARE-SD'))
catalog=dict(schema_version='plantmove-live-sop-v2',sources=sources,sops=profiles,
             note='Nội dung kỹ thuật tóm tắt có nguồn; tiêu chí thị giác và lời nhắc là thiết kế kiểm thử PlantMove. Chưa có phê duyệt chuyên môn hoặc đánh giá ảnh thật.')
target=ROOT/'apps/web/src/data/live-sops.json'
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(profiles=len(profiles),steps=sum(len(x['steps']) for x in profiles),approved=0),ensure_ascii=False))
