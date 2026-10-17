# PlantMove — Kho SOP nghiên cứu có truy nguồn

Ngày 16/10/2026. **DỰ THẢO CÓ TRUY NGUỒN — CHƯA DUYỆT CHUYÊN MÔN. Không SOP nào đã xuất bản.**

Phạm vi do người dùng xác nhận: nội địa Việt Nam, nguyên chậu hoặc rễ trần tùy shop, ETA theo từng đơn. Tài liệu nước ngoài chỉ là căn cứ tham khảo để shop thẩm định, không là tiêu chuẩn chung Việt Nam.

## Đọc theo thứ tự

1. [Nguồn đã đọc và bảng bằng chứng](01_NGUON_VA_BANG_CHUNG.md).
2. [SOP ứng viên và checkpoint](02_SOP_VA_CHECKPOINT.md).
3. [Khoảng trống, xung đột và câu hỏi duyệt](03_KHOANG_TRONG_VA_DUYET.md).
4. [Truy vết SOP → bước → bằng chứng → URL](bang_truy_vet.csv).
5. [Kho có cấu trúc JSON](kho_sop_du_thao.json).

## Kết quả

- 14 trang nguồn đã đọc: 11 nguồn tham khảo/đối chiếu và 3 trang không dùng cho thao tác.
- 4 hồ sơ ứng viên: sen đá nguyên chậu; sen đá rễ trần; xương rồng một phần; trầu bà chờ xác nhận loài/quy trình. Không ép thành 3 SOP hoàn chỉnh.
- 3 hồ sơ nguồn vận chuyển tách riêng; 0 SOP đã duyệt, 0 checkpoint đã chứng minh độ chính xác.
- Không gọi API trả phí; không sửa ứng dụng; không tự đăng/phát hành SOP.

## Quy ước dữ liệu

`evidence.instruction_md_ref` dẫn tới nội dung kỹ thuật và điều kiện duy nhất trong bảng bằng chứng Markdown. `steps.instruction_ref` dẫn tới đúng evidence; không sao chép rồi làm lệch nội dung. `tts_template` biểu diễn cách ghép nội dung kỹ thuật đó với lời nhắc camera; đây là chỉ mục nghiên cứu chưa phải dữ liệu runtime để tự import vào ứng dụng. Tất cả phần camera/manual/gate là đề xuất cần thẩm định, không phải lời khẳng định của nguồn.

Chỉ bằng chứng technical_paraphrase mới có thể làm căn cứ thao tác. scope_evidence_only không phải bước kỹ thuật. ambiguous_short_quote_not_executable không được đưa cho AI như một chỉ dẫn. Sources decision excluded_* không được dùng sinh SOP.

Mọi nhánh có production_enabled=false. ETA/tình trạng/dữ liệu chưa biết giữ null; không tự chọn loài, độ khô, thời gian ngừng tưới, số lớp hoặc lực buộc. Các quy định hãng phải được xác minh cho đúng dịch vụ và phiên bản trước áp dụng.
