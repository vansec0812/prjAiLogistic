# Demo PA1/PA2 từ ảnh người dùng — 20/10/2026

## Bộ sen đá cập nhật — 23/10/2026

Nguồn hiện hành là `D:\Bản sao của Cây vạn lộc (1).docx` (nội dung là Cây sen đá) và hai RAR sen đá. Bản mới thay ảnh chậu trắng bằng ảnh chậu nhựa đen, chọn Nhựa/LOW; thay thông tin Gốm/sứ/MEDIUM ở trao đổi trước. Trường chiều cao tổng trống trong Word được user xác nhận **13 cm** trong chat. Hai RAR không đổi checksum so với lần nhập đầu. Nguồn và hash tại source-index.md.

Ảnh `source/sen-da/plant.png`, 1254 × 1254, fingerprint `demo-succulent-photo-v2.json`, ID `sen-da-20261023-v2`. Preset: Cây sen đá/SUCCULENT; tổng cao 13 cm; dài/rộng tán 12/12 cm; đường kính/cao chậu 10/8 cm; tổng 0,3 kg; Nhựa/LOW. Tán tròn dùng cùng độ rộng 12 cm cho hai chiều. Giữ kiểm tra/xác nhận và USER edits. Không gọi Gemini để nhận ảnh mẫu. Phú quý vẫn có fingerprint/preset riêng. Ảnh khác tiếp tục nhận diện/nhập tay, không dựa tên file. Theo chỉnh sửa mới nhất của user: nơi đi, nơi đến, kênh bán và ngày gửi đều để người dùng tự nhập. Không điền hành trình từ ảnh mẫu; các giá trị Hoàng Hoa Thám - Hà Nội → Từ Sơn - Bắc Ninh, Shopee trong Word chỉ là kịch bản nhập tay khi demo. Hồ sơ đã lưu giữ nguyên dữ liệu.

`demo-succulent.ts`, version `packing-succulent-2026.10.23-v1`, có hai ví dụ riêng được chọn khi mẫu sen đá còn evidence DEMO hoặc tên Cây sen đá + nhóm SUCCULENT trong chế độ demo local. Bộ gốc của Phú quý không đổi. Gallery, lời đọc, Vision, phiên và hậu kiểm dùng cùng snapshot của phương án đã chọn.

| Bước | PA1 | PA2 |
| --- | --- | --- |
| 1 | Chuẩn bị vật liệu bảo vệ | Chuẩn bị vật liệu tiết kiệm |
| 2 | Cố định chậu và bảo vệ giá thể | Gấp đế giữ chậu, phủ giấy mặt chậu |
| 3 | Bảo vệ thân, lá bằng vách chắn | Đặt cây giữa thùng, chèn lót quanh chậu |
| 4 | Chèn lót, đóng thùng, tạo lỗ thông khí | Đóng thùng, dán băng keo, tạo lỗ thông khí |

Đã xem đủ 8 ảnh gốc, giữ nguyên khung/chú thích 941 × 1672 khi chuyển WebP. `prepare-succulent-demo.mjs` ghi manifest `succulent-demo-photos.json`; đường dẫn `/photos/packing-demo/sen-da/v1/pa1|pa2/step-N.webp` tách biệt bộ Phú quý. Hash trong manifest được dùng khi cấp ảnh mẫu cho Vision. Lỗ và độ chắc cần kiểm trực tiếp; không tự thêm kích thước lỗ hoặc xem ảnh mẫu là bằng chứng người dùng đã làm xong.

| Vật liệu | Quy cách | Đơn giá | PA1: lượng / thành tiền | PA2: lượng / thành tiền |
| --- | --- | ---: | ---: | ---: |
| Thùng carton hai lớp | 20 × 20 × 25 cm | 7.000đ/thùng | 1 / 7.000đ | — |
| Thùng carton một lớp | 18 × 18 × 22 cm | 4.000đ/thùng | — | 1 / 4.000đ |
| Khay định vị chậu | 12 × 12 cm | 2.000đ/khay | 1 / 2.000đ | — |
| Bìa carton gia cố | 12 × 15 cm | 500đ/miếng | 2 / 1.000đ | 3 / 1.500đ |
| Giấy bọc bảo vệ giá thể | 20 × 20 cm | 500đ/tờ | 2 / 1.000đ | 2 / 1.000đ |
| Màng bọc bảo vệ giá thể | Rộng 10 cm, dài 30 cm | 1.000đ/đoạn | 1 / 1.000đ | — |
| Giấy tổ ong chèn lót | 30 × 40 cm | 2.000đ/tấm | 1 / 2.000đ | — |
| Giấy chèn tái sử dụng | 30 × 30 cm | 500đ/tờ | — | 2 / 1.000đ |
| Băng keo | Rộng 4,8 cm | 500đ/m | 1,2 / 600đ | 0,8 / 400đ |
| Chi phí phụ trợ khác | Phân bổ theo đơn hàng | — | 1 đơn / 400đ | 1 đơn / 100đ |
| Tổng | | | **15.000đ** | **8.000đ** |

Giá/nguồn version `succulent-material-prices-2026.10.23-v1`; Decimal cho lượng × giá, tổng và tỷ lệ tiết kiệm 7.000đ/46,7%. Dòng phụ trợ là thành tiền phân bổ theo đơn hàng, đơn giá null, không giả 0đ. CatalogMaterial bổ sung specification cho bảng quy cách. Lớp bù giá demo cũ chỉ áp version Phú quý cũ, không áp 3.400đ/900đ cho sen đá. Không mutate bundle hay phiên lịch sử. Các giới hạn local/production, quyền, checklist và xác nhận tay bên dưới tiếp tục áp dụng.

## Bộ Phú quý hiện có

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

`apps/web/src/lib/demo-packing.ts` là bộ nội dung cố định, version `packing-photos-2026.10.20-v1`. Lời đọc tiếng Việt pin theo bước, tiêu chí chỉ phần nhìn thấy; số đo, độ chắc và dữ liệu vận đơn kiểm trực tiếp. Không tự thêm nhiệt độ/thời gian hoặc suy giá từ ảnh. BOM ban đầu chưa có đơn giá; mức cố định người dùng cung cấp ngày 22/10/2026 được áp dụng bên dưới.

Tên giao diện theo yêu cầu tiếp theo: PA1 “Phương án an toàn nhất”, PA2 “Phương án tối ưu chi phí nhất”. Bỏ mô tả/gợi chú “theo bộ ảnh bạn cung cấp”, thu gọn nhãn thành “Chế độ demo”/“Ảnh hướng dẫn”. `mvp-labels.ts` áp nhãn theo ID cho cả bundle cũ; không migrate hoặc ghi đè dữ liệu lịch sử. Tên là nhãn sản phẩm người dùng yêu cầu, không thay phê duyệt chuyên môn.

## Giá vật liệu cố định — 22/10/2026

Theo bộ giá người dùng cung cấp, mỗi phương án dùng một bộ của từng dòng sau:

| Vật liệu | PA1 | PA2 |
| --- | ---: | ---: |
| Thùng xốp | 2.000đ | — |
| Vật liệu chèn lót | 1.000đ | — |
| Màng bọc | 200đ | 200đ |
| Băng keo | 200đ | 200đ |
| Bìa carton | — | 500đ |
| Tổng | **3.400đ** | **900đ** |

`demo-pricing.ts`, version `demo-material-prices-2026.10.22-v1`, cấp BOM và tổng Decimal cho demo mới. `MvpResults` bổ sung mức này vào lớp hiển thị/export của demo cũ có tổng null, kèm trace nguồn; không sửa snapshot DB, hướng dẫn/ảnh hoặc giá lịch sử đã biết. Bộ giá chỉ gồm các dòng user yêu cầu; tem/vận đơn và các thao tác vẫn có trong hướng dẫn nhưng nằm ngoài bảng chi phí này. Rule Engine và danh mục không phải demo tiếp tục dùng giá cấu hình riêng.

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
## Cập nhật hosted demo — 23/10/2026

Yêu cầu mới bật Phú quý/sen đá như local trên Vercel cho phép ngoại lệ `PLANTCARE_PHOTO_DEMO_ENABLED=true`. `demo-mode.ts` dùng gate chung cho session/login khách, nhận mẫu cây, tạo/chọn bundle và bắt đầu/điều khiển hướng dẫn. Chỉ bundle `demo:true` được ngoại lệ developmentOnly; TRIAL/catalog chưa duyệt vẫn bị chặn. Production tạo MEMBER ngẫu nhiên riêng cho mỗi khách, không seed/chia sẻ local-demo. Các mô tả local-only cũ dưới đây áp dụng khi flag không bật. Không thay mock OTP, ownership, CSRF, consent, checklist, hành trình nhập tay hoặc lịch sử.

`tests/cloud-demo.test.ts` kiểm default-off, chỉ mở photo demo và khách độc lập. Cloud smoke thực nhận đúng cả hai fixture, đủ PA1/PA2, tổng giá và ảnh hướng dẫn, đồng thời chặn truy cập chéo owner 404. Không dùng kết quả này làm bằng chứng Gemini/camera/micro/SMS.
