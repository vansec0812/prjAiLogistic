# Tạo hồ sơ → nhận diện → ảnh hướng dẫn → làm cùng AI

Luồng hiện hành từ 18/10/2026, thay luồng mở camera ngay sau tạo hồ sơ.

## Cách sử dụng

1. **Tạo hồ sơ** tại /app/new, nhập tên. Mở /app/cases/:id/plant với thông số cây/chậu như trước.
2. **Tải ảnh & nhận diện** hoặc **Chụp & nhận diện**. Camera có preview/chụp/đóng và dừng tracks sau chụp, rời màn hình hoặc ẩn tab. Ảnh được chuẩn hóa/private upload rồi tự tạo job nhận diện Gemini. Chi tiết nhà cung cấp trong mục thu gọn.
3. AI tự điền tên/nhóm cây, vật liệu chậu, độ dễ hư khi có gợi ý. Chỉ đọc số từ nhãn/thước/cân nhìn rõ, không suy cm/kg từ pixel. Không ghi đè dữ liệu đã xác nhận, số đã nhập hoặc thay đổi trong lúc job chạy. Kiểm/sửa sáu số đo/cân rồi tích **Tôi xác nhận thông số cây và chậu đã chính xác**. Chưa tích thì Xem hướng dẫn/Lưu & tiếp tục/các bước sau bị khóa; sửa thông số tự bỏ tích và cần xác nhận lại. Lưu nháp vẫn dùng được. AI lỗi/chưa cấu hình vẫn nhập tay.
4. **Xem hướng dẫn đóng gói** lưu hồ sơ, mở /instructions với 5 ảnh/bước nguyên chậu. FOLIAGE dùng ảnh AI mẫu gần ảnh chụp, nhóm khác dùng sơ đồ; không là ảnh kiện thật. Nguồn/phạm vi thu gọn. Vật tư/hành trình vẫn dùng cho phương án vận chuyển đầy đủ nhưng không bắt buộc trước màn hướng dẫn.
5. **Bắt đầu với AI** tạo phiên REFERENCE pin owner/case/input hash/SOP/version/revision, mở /guide?session=:id. Camera, quyền kiểm ảnh và micro bật riêng. Đọc đúng speech_vi/kiểm tay/remedy theo SOP; giọng thiết bị tiếng Việt hoặc Gemini sau thao tác bật giọng AI.
6. Làm xong nói **“Đã xong bước này”**, **“Tiếp tục bước tiếp theo”**, hoặc bấm nút. Manual ghi self-report. Visual cần ảnh đạt hoặc kiểm tay có lý do ≥10 ký tự. Chưa có ảnh kiểm: nhắc vị trí/đếm ngược 3 giây → lấy ảnh → chuyển đúng một bước sau kết quả đạt và server commit. Ảnh lỗi/không rõ giữ bước.
7. Bật quyền kiểm ảnh cũng bật kiểm định kỳ khoảng 12 giây ở bước visual, chỉ khi hình thay đổi/màn đang hiện. Lỗi được hiện/đọc khi nhận; monitoring không tự chuyển bước. **“Tôi gặp lỗi”** ghi lỗi/tạm dừng, xóa pass cũ. **“Tôi đã xử lý lỗi”** giải quyết manual; visual cần ảnh mới đạt hoặc kiểm tay có lý do. Resolve riêng không tăng bước.
8. “Nhắc lại”, “giúp tôi”, “kiểm tra lại”, “dừng lại” điều khiển bước đang làm. Reload giữ tiến độ/lỗi, camera/micro/consent đều tắt. Ẩn tab/dừng camera/rời màn hình hủy lượt chờ/media. Input/SOP đổi làm phiên stale, cần phiên mới.

Kiểm định kỳ không là video analytics liên tục hoặc phát hiện mọi lỗi. Không suy độ chắc, số lớp ẩn hoặc độ ẩm bằng ảnh. Người dùng kiểm trực tiếp trước xác nhận. Copy ngắn; provider/privacy, nguồn/review trong các mục thu gọn.

## Contract

Base /api/v1, mọi resource theo owner, mutation cần Origin/CSRF, private/no-store.

| Endpoint | Payload / kết quả |
| --- | --- |
| POST /cases/:id/plant-analysis | upload_ids, consent_id AI_ANALYSIS; job VISION, vision-v1 thêm plant_details optional |
| GET /cases/:id/guidance | Phiên của owner, có stale flag |
| POST /cases/:id/guidance | case_version, sop_id/version, mode:REFERENCE, reference_ack:true, context khớp cây đã xác nhận; Idempotency-Key |
| PATCH /cases/:id/guidance/:session | expected_revision, step_id, action CONFIRM/MANUAL/SKIP/REPORT_ISSUE/RESOLVE_ISSUE, method BUTTON/VOICE, note; advance cần manual_checked:true |
| POST /live-packing/check | Bound case_id/session_id/session_revision, SOP/context/step, consent:true, image, reference_guidance:true; kết quả + guidance đã lưu |

TRIAL cũ tương thích approved_for_trial:true nhưng chỉ local. Production REFERENCE cần PLANTCARE_REFERENCE_GUIDE_ENABLED=true; không đổi production_enabled/approval catalog. Terminal case không mở/advance hướng dẫn.

Vision plant_details.readings có field, positive value, cm/kg, origin VISIBLE_LABEL_OR_SCALE và evidence; chỉ fill field trống/đúng unit, không tự confirm. Output cũ không có details vẫn đọc được. Prompt vision-autofill-v3.

Checkpoint recheck owner/case/context/SOP/version/bước/revision trước provider và trong transaction. Xóa pass trước recheck/REPORT_ISSUE; không nhận client AI result trong PATCH. Lệnh lặp/sự kiện mic cũ bị khóa, chỉ chuyển sau commit. Override giữ kết quả AI cũ; skip kết thúc REVIEW_REQUIRED, đủ xác nhận là FINISHED. Không sửa plan/case completion/kho.

## Lưu trữ, giọng nói và giới hạn

Guidance private lưu mode/input hash/context/revision/index/status/checks/records/currentIssue, phương thức/thời gian xác nhận; không raw transcript/media camera giám sát. Ảnh nhận diện là upload riêng của hồ sơ, có thể xóa. JSON biên bản không có media/base64 và không xác nhận transport_safe.

TTS chuẩn hóa deterministic: khoảng, số âm/thập phân, so sánh, cm/mm/kg/°C/SOP/AI; không thay catalog. Giọng thiết bị/Gemini dùng cùng chuẩn hóa; cloud phải trả WAV PCM hợp lệ, cache có version từ điển.

Tri thức plantcare-evidence-20261018-v3 giữ 19 nguồn/19 ghi chú, metadata-only không cấp claim kỹ thuật. Catalog 7 nhánh/40 bước DRAFT; UI mặc định nguyên chậu FedEx 5 bước. RAG/nguồn tham khảo, không training trọng số. Review tại research/nursery-standards-review.md, nursery-logistics-review.md, vietnamese-textbooks-review.md.

Evidence tại .code/implementation.md; browser dùng camera/giọng/provider giả lập. Chưa đo accuracy ảnh cây/micro vật lý/hiệu quả vận chuyển. Deploy tách Vercel/Node theo [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).
