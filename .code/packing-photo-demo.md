# Demo PA1/PA2 từ ảnh người dùng — 20/10/2026

Theo yêu cầu hardcode hai phương án để demo. Đã đọc trực quan đủ 14 ảnh trong `source/pa1` và `source/pa2`; chú thích ảnh là căn cứ thứ tự. Không suy ảnh mẫu là bằng chứng kiện thực tế, quyền dataset hoặc nghiệm thu chuyên môn.

| PA1 — thùng xốp, 6 bước | PA2 — ống carton, 8 bước |
| --- | --- |
| 1. Quấn màng co quanh chậu và 2/3 lá | 1. Bọc mặt chậu |
| 2. Đặt vào thùng xốp, chèn lót | 2. Gom lá gọn |
| 3. Đóng nắp, băng keo cố định | 3. Quấn bảo vệ chậu |
| 4. Tạo lỗ thoáng khoảng 1 cm, cách xa nhau | 4. Chuẩn bị ống carton |
| 5. Dán tem hàng dễ vỡ | 5. Đặt cây vào ống carton |
| 6. Dán vận đơn | 6. Gập miệng và cố định |
| | 7. Ghi nhãn hướng lên |
| | 8. Dán vận đơn |

`apps/web/src/lib/demo-packing.ts` là bộ nội dung cố định, version `packing-photos-2026.10.20-v1`. Lời đọc tiếng Việt pin theo bước, tiêu chí chỉ phần nhìn thấy; số đo, độ chắc và dữ liệu vận đơn kiểm trực tiếp. Không tự thêm nhiệt độ/thời gian/giá hoặc claim tiết kiệm. BOM mô tả một bộ vật tư, mọi giá chưa biết là null.

Tên giao diện theo yêu cầu tiếp theo: PA1 “Phương án an toàn nhất”, PA2 “Phương án tối ưu chi phí nhất”. Bỏ mô tả/gợi chú “theo bộ ảnh bạn cung cấp”, thu gọn nhãn thành “Chế độ demo”/“Ảnh hướng dẫn”. `mvp-labels.ts` áp nhãn theo ID cho cả bundle cũ; không migrate hoặc ghi đè dữ liệu lịch sử. Tên là nhãn sản phẩm người dùng yêu cầu, không thay phê duyệt/đánh giá chi phí; giá chưa có tiếp tục null.

Theo yêu cầu tiếp theo: vào bước tự đọc “Bước N.” + speech_vi đúng ảnh, không đọc thêm lời nhắc nói đã xong hoặc hướng dẫn câu lệnh. Sau kiểm ảnh đạt chỉ báo kết quả ngắn. “Đã xong”/“Xong rồi” là xác nhận hoàn tất bước như “Đã xong bước này”, khác “Kiểm tra” chỉ xem ảnh; không cần AI nhắc trước mới nhận lệnh. Vẫn giữ guard lỗi/unknown/kiểm tay và micro opt-in. Không sửa snapshot hoặc speech_vi của phiên cũ; thay cách ghép lời đọc tại packing-narration.ts.

## Hồ sơ mẫu Phú quý

Theo yêu cầu tiếp theo của user, ảnh `source/cayphuquy.jpg` có bộ thông số do user cung cấp:

| Trường | Mẫu |
| --- | --- |
| Tên / nhóm | Cây phú quý lá đỏ / Cây lá (FOLIAGE) |
| Chiều cao tổng | 50 cm |
| Dài / rộng tán | 40 / 40 cm |
| Đường kính / cao chậu | 20 / 25 cm |
| Tổng khối lượng | 5 kg |
| Độ dễ hư / vật liệu chậu | Cao - cần chuyên gia (HIGH) / Gốm/sứ |

Đã xem trực quan ảnh trước khi nối demo. `demo-plant-profile.ts` giữ số mẫu và apply giữ manual/confirmed/late edit. `demo-plant.ts` so khớp ảnh đã chuẩn hóa với fingerprint RGB 24×24 (sai lệch tỉ lệ tối đa log 0,025; mean absolute difference ≤5/255 và tỷ lệ lệch >20/255 ≤3%). Mục tiêu nhận lại cùng ảnh qua nén/resize, không nhận mọi ảnh cây cùng loài. Không xét tên file và không gọi model để bịa số/confidence. Ảnh khác tiếp tục Vision/nhập tay bình thường; gợi ý mẫu được Vision sau đó thay thế, USER edits vẫn được giữ.

Fingerprint/version/hash gốc tại `src/data/demo-plant-photo.json`; `scripts/prepare-demo-plant.mjs` chuẩn bị fingerprint, không đổi ảnh gốc và chặn ghi đè khi nguồn thay đổi. Fixture `tests/fixtures/cayphuquy-demo.jpg` là bản sao byte của ảnh user để regression offline; bản chạy chỉ cần fingerprint. Upload vẫn private/owner-scoped và cần storage consent. API `/cases/:id/plant-demo` chỉ development, kiểm owner/case/purpose rồi trả sampleId hoặc null. Không tiêu tốn quota hoặc gọi Gemini. Form hiện “Các thông số mẫu”, bỏ badge AI/phần trăm/Cần nhập tay; fieldEvidence lưu source=DEMO, confidence=null, SUGGESTED đến khi checkbox xác nhận.

HIGH và gốm/sứ được giữ nguyên trong snapshot; chỉ bộ ví dụ local có cả PA1/PA2. Không sửa eligibility thường, không ngầm duyệt mẫu cho vận chuyển. Sau xác nhận cây và hành trình, dùng bộ ảnh thùng xốp 6 bước và ống carton 8 bước phía trên; lời đọc, lệnh hoàn tất, hậu kiểm và khóa lựa chọn giữ nguyên.

Local: sau xác nhận cây và hành trình, UI tạo bundle với `demo:true`; luôn có cả hai ví dụ. API không có flag vẫn dùng Rule Engine hiện hữu. Hồ sơ cũ trước Bắt đầu có nút “Dùng ảnh mẫu PA1/PA2”; bản mới không ghi đè lựa chọn/bundle cũ. Không được đổi phương án trong phiên đã bắt đầu. Production từ chối yêu cầu demo, không coi user yêu cầu demo là duyệt chuyên môn.

`scripts/prepare-packing-demo.mjs` tạo bản WebP quality 90, không cắt ảnh hoặc sửa ảnh gốc. Manifest `apps/web/src/data/packing-demo-photos.json` ghi source path, SHA-256 gốc và delivery. Tài nguyên public chỉ là bộ mẫu người dùng yêu cầu dùng để demo. Đường dẫn `/photos/packing-demo/v1/...` là bất biến; thay ảnh cần version mới, không chạy script với ảnh gốc đã đổi trên version cũ. Bản phát hành dùng WebP/manifest, không bắt buộc có thư mục source.

Phiên hướng dẫn lưu ảnh và hash theo đúng phương án/bước. Vision tải đúng file trong manifest, kiểm checksum, gửi riêng “ẢNH MẪU” và “ẢNH THỰC HIỆN”. Mẫu không được dùng để kết luận người dùng đã làm xong; khác màu lá, loài, nền hoặc người không là lỗi. Thiếu ảnh/hash mismatch làm lần kiểm thất bại, không fallback sang ảnh bước khác. Không lưu frame camera. Lỗi/unknown không tự chuyển bước; giữ kiểm tay có lý do. Hậu kiểm demo gắn đủ các mục của phương án, độ cố định luôn cần USER kiểm tay.

Truy vết: FR-18..21/26, TC-06/07/13/14 bổ sung cho demo, không đóng các acceptance SRS/NFR/chuyên môn đang OPEN. `tests/packing-demo.test.ts` kiểm input gate, clone, checksum/full-frame, allowlist và nhãn prompt. `tests/live-packing.test.ts` kiểm payload provider với hai ảnh qua mock; `tests/guidance.test.ts` kiểm chặn demo production. `tests/e2e/mvp.spec.ts` đi hết cả PA1/PA2 từ gallery đến hậu kiểm/lưu, ảnh đúng bước, không chuyển khi chưa kiểm; chụp desktop/mobile. Kết quả lệnh thực chạy ghi tại implementation.md. Không dùng mock làm bằng chứng accuracy Gemini/camera/micro vật lý.
