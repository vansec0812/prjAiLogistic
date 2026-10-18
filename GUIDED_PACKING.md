# Hồ sơ & camera — 18/10/2026

## Luồng sử dụng

1. Đăng nhập, chọn **Hồ sơ & camera**. Đặt tên một hồ sơ cho một cây/chậu, nhấn **Tạo hồ sơ & mở camera**. Trình duyệt hỏi quyền camera nếu cần; không yêu cầu micro ở bước này. Có thể chọn nhập hồ sơ kỹ thuật trước.
2. Xem hình camera ngay trong hồ sơ. **Mở camera** cũng bật lại camera đã tắt/ngắt. Nếu trình duyệt chặn, cấp lại quyền camera cho HTTPS/localhost rồi bấm lại. Ứng dụng không tự vượt quyền thiết bị.
3. Chọn SOP, nhập loài shop xác nhận, đọc nguồn và xác nhận phạm vi thử. Nhánh mặc định là một cây nguyên chậu tham khảo FedEx, không tự suy lịch tưới/nhiệt độ. Sáu nhánh loài/hình thức cũ được giữ riêng, gồm giới hạn cây nhỏ của nguồn trầu bà.
4. Đồng ý checklist để tạo **phiên hướng dẫn lưu vào hồ sơ**. Đây là thử nghiệm local; SOP chưa được chuyên gia duyệt. Camera xem tại chỗ hoạt động riêng với quyền thực hiện SOP.
5. AI đọc nguyên speech_vi theo mẫu, số bước, điều cần kiểm tay và bước tiếp theo; nút bật âm thanh đọc bước đang chọn. Có thể bật micro riêng để nhận lệnh. Muốn AI xem ảnh, cần đồng ý gửi khung hình tới Gemini. Mỗi lần yêu cầu chỉ lấy một ảnh sau nhắc vị trí/đếm ngược; không theo dõi toàn video.
6. Kiểm trực tiếp xong, nói **đồng ý / dạ vâng / OK / tôi xác nhận / tiếp tục**. Bước manual ghi xác nhận của người dùng; bước visual cần kết quả ảnh đạt, hoặc đã chọn kiểm tay với lý do tối thiểu 10 ký tự. AI xác nhận và đọc bước mới sau khi máy chủ lưu thành công.
7. Khi ảnh chưa đạt/không thể xác minh, lời đồng ý không chuyển bước. AI nhắc kết quả và cách kiểm lại. Nói **kiểm tra lại**, **nhắc lại**, **giúp tôi**; **dừng lại / tắt camera** dừng camera và micro. Nút kiểm tay/kiểm ảnh luôn là lựa chọn thay thế khi nhận giọng không hỗ trợ.
8. Tải lại mở đúng phiên/bước đã lưu. Camera, micro và đồng ý gửi ảnh đều tắt; phải bật lại. Bước đang thao tác chưa xác nhận không được coi đã xong. Đổi đầu vào/SOP làm phiên cũ stale; tạo phiên mới và giữ lịch sử. Nút đổi thiết lập tạo phiên riêng, không ghi đè phiên cũ.

## Dữ liệu và trạng thái

`guidance` là document private theo owner và case. Lưu input hash, ID/version SOP, context loài/phạm vi, revision, bước hiện tại, checks đã validate, records và phương thức/thời điểm xác nhận. Không lưu ảnh/video/audio hoặc nguyên văn transcript. JSON biên bản có ID hồ sơ/phiên, version và từng kết quả, không có media.

API đều xác thực/CSRF theo contract chung:

| Endpoint | Nội dung |
| --- | --- |
| `GET /api/v1/cases/:id/guidance` | Các phiên của đúng chủ hồ sơ, đánh dấu stale khi input/SOP đổi |
| `POST /api/v1/cases/:id/guidance` | `case_version`, `sop_id`, `sop_version`, `context`, `approved_for_trial:true`; cần Idempotency-Key |
| `PATCH /api/v1/cases/:id/guidance/:session` | `expected_revision`, `step_id`, `action:CONFIRM/MANUAL/SKIP`, `method:BUTTON/VOICE`, `manual_checked:true`, `note` |
| `POST /api/v1/live-packing/check` | Payload checkpoint cũ cộng `case_id`, `session_id`, `session_revision`; ba trường phải cùng có hoặc cùng vắng |

Check ràng buộc phiên phải khớp đúng owner/case/context/SOP/version/bước/revision trước khi gọi provider và lúc lưu kết quả. Lượt kiểm lại xóa pass cũ trước khi gọi; provider lỗi không làm hồi sinh pass cũ. Kết quả trễ sau chuyển bước/đổi input bị từ chối. Server không nhận kết quả AI do client khai trong PATCH. CHECK_REQUIRED chặn thiếu/không đạt; xung đột revision giữ bước hiện tại và yêu cầu tải lại. Khóa nhận dạng đồng bộ, khóa mutation và revision chống lệnh lặp chuyển nhiều bước.

Phiên `ACTIVE` chuyển `FINISHED` khi đủ bước xác nhận, hoặc `REVIEW_REQUIRED` nếu có bỏ qua. Các trạng thái này **không phải** case PACKED/SHIPPED/RECEIVED, không select/start/complete plan và không trừ kho. Workflow hồ sơ vận chuyển vẫn kiểm readiness, plan version, FAIL/STALE, checklist và completion transaction riêng.

## Tri thức mới

Version `plantcare-evidence-20261018-v3`: 19 nguồn đăng ký, 19 ghi chú có thể tra cứu; chỉ ghi chú của nguồn READ trong đúng scope được retrieval. Hai giáo trình và landing FloraHolland là metadata; không cấp claim kỹ thuật. FAO nằm scope NURSERY riêng; USDA có giới hạn theo loài/giống/xe lạnh/acclimatization. Không nhập bảng nhiệt hoặc kích thước thương mại thành ngưỡng sinh học/fit chung.

Giữ lời đọc cố định/guard từ dev-nam `b920625`, tích hợp vào controller theo phiên; xác nhận lưu trên server thay vì chỉ RAM. Nhánh mới `POTTED-FEDEX-GENERAL`, version `2026.10-trial.2`, thêm 5 bước; 6 nhánh cũ giữ version/nội dung. Tổng 7 nhánh/40 bước. Đây là tóm tắt tham khảo và tiêu chí thị giác do SE đề xuất **DRAFT/UNREVIEWED**, không là phê duyệt của hãng/chuyên gia. Không fine-tune trọng số hoặc index toàn văn/ảnh chưa có quyền.

Review nguồn, vị trí và quyền: [tiêu chuẩn/USDA](research/nursery-standards-review.md), [logistics](research/nursery-logistics-review.md), [giáo trình Việt Nam](research/vietnamese-textbooks-review.md). Chưa kiểm hình trong brochure FedEx Canada; đã đọc text. AmericanHort có xung đột ngày trên bìa/landing được ghi lại; không tự hợp nhất.

## Kiểm chứng và giới hạn

Unit/API/DB: owner, stale, revision/replay, giữ failed image khi manual override, xóa pass trước recheck, không trừ kho và không hoàn tất case. Browser: camera giả lập, giọng/nhận dạng/provider giả lập; nguồn không phải bằng chứng accuracy hoặc an toàn. Chưa đánh giá micro thật trong xưởng, ảnh cây thật có nhãn hoặc tỷ lệ Gemini kiểm đúng. Không gọi Gemini trả phí trong cập nhật này.

Production SOP vẫn fail closed. Vercel còn các giới hạn lưu trữ/worker được ghi trong [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md); thay đổi này không tự triển khai hosting.
