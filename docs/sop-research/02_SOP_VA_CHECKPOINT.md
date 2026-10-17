# PlantMove — Hồ sơ SOP dự thảo và checkpoint

DỰ THẢO CÓ TRUY NGUỒN — CHƯA DUYỆT CHUYÊN MÔN

Không hồ sơ nào được phép xuất bản hoặc thay quy trình đang chạy. Các mục cảnh báo, cổng dữ liệu và checkpoint dưới đây là thiết kế đề xuất của PlantMove, không phải lời nhà vườn hoặc kết quả thử nghiệm. Không ghép nguồn khác vào chuỗi thao tác của một hồ sơ.

## Đầu vào và cổng chung

- Loài/giống đã xác nhận, không chỉ tên thương mại.
- Nguyên chậu hay rễ trần do shop chọn.
- Tình trạng cây/bầu/rễ do người dùng kiểm trực tiếp.
- Kích thước và khối lượng đo/cân thật; tình trạng/vật liệu chậu nếu có.
- Vật tư thực có và thông số có nguồn khi cần đánh giá fit/tải.
- Điểm đi/đến, ngày gửi, hãng và gói dịch vụ.
- ETA hoặc khoảng thời gian giao, nguồn và thời điểm xác nhận.
- Shop/người duyệt chấp nhận quy trình cho đúng loài, hình thức và hành trình.

ETA chưa biết phải để trống/null và yêu cầu xác nhận. Nhiều địa chỉ chưa đủ tính ETA nếu không biết dịch vụ, ngày gửi và nguồn cam kết. Không đặt lịch ngừng tưới, độ ẩm, lực buộc hoặc lượng vật tư bằng AI.

## SUC-POT-ES — Mọng nước nguyên chậu — nhánh Eurosender

Phiên bản 0.1.0-research; ngày 2026-10-16; người biên soạn: AI tổng hợp có truy nguồn; người duyệt/ngày duyệt: chưa có.
Trạng thái: **Có trình tự đóng gói của nguồn; chưa đủ điều kiện phê duyệt áp dụng.**
Hình thức: `POTTED`; nhóm: `SUCCULENT`.
Phạm vi và ngoại lệ: Hướng dẫn logistics nước ngoài, không chuẩn nội địa; không áp dụng tự động cho mọi sen đá.

Vật tư có căn cứ: chậu nhựa nếu phù hợp [E01]; màng nhựa [E03]; giấy mềm/tissue [E04]; hộp và đệm theo nhánh nguồn [E05]

### Chuỗi bước của đúng nguồn

Nội dung kỹ thuật ở mã bằng chứng tương ứng trong [bảng bằng chứng](01_NGUON_VA_BANG_CHUNG.md). Đọc nguyên điều kiện, không chỉ tên bước. Lời đọc TTS ghép đúng nội dung bằng chứng với lời nhắc camera; không sinh thêm kỹ thuật.

#### ES-01 → [E01](01_NGUON_VA_BANG_CHUNG.md#e01)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của E01, đúng điều kiện; [vị trí nguồn](https://www.eurosender.com/en/pack-ship/plants/succulents-cactus).
- Lời nhắc camera đề xuất: Đưa chậu vào khung hình.
- Điều có thể ghi nhận: Thấy loại chậu hoặc người dùng xác nhận khi ảnh không rõ.
- Kiểm tra trực tiếp: Shop quyết định có dùng chậu hiện tại hay thay; ảnh không tự cho phép thay chậu.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### ES-02 → [E02](01_NGUON_VA_BANG_CHUNG.md#e02)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của E02, đúng điều kiện; [vị trí nguồn](https://www.eurosender.com/en/pack-ship/plants/succulents-cactus).
- Lời nhắc camera đề xuất: Đưa bề mặt đất vào khung hình để ghi nhận, sau đó kiểm trực tiếp.
- Điều có thể ghi nhận: Chỉ mô tả bề mặt; không cho đạt tiêu chí độ khô từ ảnh.
- Kiểm tra trực tiếp: Người có kinh nghiệm xác định đủ khô; chưa có tiêu chuẩn đo thì dừng.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### ES-03 → [E03](01_NGUON_VA_BANG_CHUNG.md#e03)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của E03, đúng điều kiện; [vị trí nguồn](https://www.eurosender.com/en/pack-ship/plants/succulents-cactus).
- Lời nhắc camera đề xuất: Đưa miệng chậu vào khung hình.
- Điều có thể ghi nhận: Thấy vùng bề mặt đất và lớp phủ theo checklist đã duyệt.
- Kiểm tra trực tiếp: Kiểm hiệu quả giữ đất, ảnh hưởng thân/lá và mức kín do shop duyệt.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### ES-04 → [E04](01_NGUON_VA_BANG_CHUNG.md#e04)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của E04, đúng điều kiện; [vị trí nguồn](https://www.eurosender.com/en/pack-ship/plants/succulents-cactus).
- Lời nhắc camera đề xuất: Đưa lớp bảo vệ quanh cây vào khung hình.
- Điều có thể ghi nhận: Thấy lớp giấy và vị trí cây; phần bị che không được suy đoán.
- Kiểm tra trực tiếp: Kiểm vật liệu không ép/gãy lá; không đặt số lớp tự sinh.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### ES-05 → [E05](01_NGUON_VA_BANG_CHUNG.md#e05)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của E05, đúng điều kiện; [vị trí nguồn](https://www.eurosender.com/en/pack-ship/plants/succulents-cactus).
- Lời nhắc camera đề xuất: Đưa hộp còn mở và vị trí cây vào khung hình.
- Điều có thể ghi nhận: Thấy cách bố trí bên trong; không suy ra lực giữ.
- Kiểm tra trực tiếp: Kiểm độ cố định, khoảng trống và mức ép trực tiếp.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### ES-06 → [E06](01_NGUON_VA_BANG_CHUNG.md#e06)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của E06, đúng điều kiện; [vị trí nguồn](https://www.eurosender.com/en/pack-ship/plants/succulents-cactus).
- Lời nhắc camera đề xuất: Đưa các mặt đóng hộp vào khung hình.
- Điều có thể ghi nhận: Thấy đường đóng hộp được yêu cầu; không suy độ bền băng dính.
- Kiểm tra trực tiếp: Kiểm niêm kín và điều kiện hãng nhận gửi.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

### Phần còn thiếu / chưa được áp dụng

- Chưa có loài cụ thể hoặc chuẩn độ khô.
- Chưa có lượng/độ kín vật liệu, tải trọng hoặc thử nghiệm hành trình VN.

Điều kiện dừng: thiếu phạm vi/ETA/xác nhận hãng, thao tác chưa có căn cứ, đầu vào chưa xác nhận hoặc nguồn mâu thuẫn. Điều kiện chuyển bước đề xuất: tiêu chí thị giác đã duyệt được kiểm hoặc người kiểm tra ghi rõ thay thế, cùng xác nhận tay; chưa có phê duyệt thì không chạy quy trình này cho vận chuyển thật.

## SUC-BARE-SD — Mọng nước rễ trần — quy trình riêng Succulents Depot

Phiên bản 0.1.0-research; ngày 2026-10-16; người biên soạn: AI tổng hợp có truy nguồn; người duyệt/ngày duyệt: chưa có.
Trạng thái: **Trình tự bao gói một phần; chưa hoàn chỉnh thành SOP giao hàng.**
Hình thức: `BARE_ROOT`; nhóm: `SUCCULENT`.
Phạm vi và ngoại lệ: Quy trình shop nước ngoài; không dùng kích thước chậu S04 để chọn rễ trần cho shop khác.

Vật tư có căn cứ: tissue [D02]; carton và giấy chèn [D03]

### Chuỗi bước của đúng nguồn

Nội dung kỹ thuật ở mã bằng chứng tương ứng trong [bảng bằng chứng](01_NGUON_VA_BANG_CHUNG.md). Đọc nguyên điều kiện, không chỉ tên bước. Lời đọc TTS ghép đúng nội dung bằng chứng với lời nhắc camera; không sinh thêm kỹ thuật.

#### SD-01 → [D01](01_NGUON_VA_BANG_CHUNG.md#d01)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của D01, đúng điều kiện; [vị trí nguồn](https://www.succulentsdepot.com/pages/benefits-of-shipping-bare-roots).
- Lời nhắc camera đề xuất: Đưa cây và phần rễ vào khung hình.
- Điều có thể ghi nhận: Thấy trạng thái rễ trần; không suy đủ khô hoặc rễ khỏe.
- Kiểm tra trực tiếp: Shop xác nhận loài phù hợp rễ trần, cách loại đất và điều kiện để khô.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### SD-02 → [D02](01_NGUON_VA_BANG_CHUNG.md#d02)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của D02, đúng điều kiện; [vị trí nguồn](https://www.succulentsdepot.com/pages/benefits-of-shipping-bare-roots).
- Lời nhắc camera đề xuất: Đưa từng cây đã bọc vào khung hình.
- Điều có thể ghi nhận: Thấy cách bọc từng cây khi không bị che.
- Kiểm tra trực tiếp: Kiểm lực bọc và tổn thương trực tiếp.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### SD-03 → [D03](01_NGUON_VA_BANG_CHUNG.md#d03)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của D03, đúng điều kiện; [vị trí nguồn](https://www.succulentsdepot.com/pages/benefits-of-shipping-bare-roots).
- Lời nhắc camera đề xuất: Đưa bên trong hộp còn mở vào khung hình.
- Điều có thể ghi nhận: Thấy cây đã bọc và vị trí phần chèn.
- Kiểm tra trực tiếp: Kiểm độ cố định; thiếu bước niêm kiện trong nguồn phải bổ sung có thẩm định.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

### Phần còn thiếu / chưa được áp dụng

- Không có phép xác định đủ khô, lịch hong hoặc số lớp.
- Nguồn không mô tả đủ niêm kiện/bàn giao; không tự thêm bước.

Điều kiện dừng: thiếu phạm vi/ETA/xác nhận hãng, thao tác chưa có căn cứ, đầu vào chưa xác nhận hoặc nguồn mâu thuẫn. Điều kiện chuyển bước đề xuất: tiêu chí thị giác đã duyệt được kiểm hoặc người kiểm tra ghi rõ thay thế, cùng xác nhận tay; chưa có phê duyệt thì không chạy quy trình này cho vận chuyển thật.

## CAC-CW-PARTIAL — Xương rồng — mô tả thao tác một phần Cactus Warehouse

Phiên bản 0.1.0-research; ngày 2026-10-16; người biên soạn: AI tổng hợp có truy nguồn; người duyệt/ngày duyệt: chưa có.
Trạng thái: **KHÔNG ĐỦ ĐỂ THÀNH SOP HOÀN CHỈNH.**
Hình thức: `UNSPECIFIED_BY_SOURCE`; nhóm: `CACTUS`.
Phạm vi và ngoại lệ: Chỉ phần chữ đã đọc; không viện dẫn mốc video chưa xem.

Vật tư có căn cứ: CHƯA CÓ NGUỒN PHÙ HỢP — CẦN XÁC MINH.

### Chuỗi bước của đúng nguồn

Nội dung kỹ thuật ở mã bằng chứng tương ứng trong [bảng bằng chứng](01_NGUON_VA_BANG_CHUNG.md). Đọc nguyên điều kiện, không chỉ tên bước. Lời đọc TTS ghép đúng nội dung bằng chứng với lời nhắc camera; không sinh thêm kỹ thuật.

#### CW-01 → [C01](01_NGUON_VA_BANG_CHUNG.md#c01)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của C01, đúng điều kiện; [vị trí nguồn](https://cactuswarehouse.com/pages/how-we-pack-and-ship).
- Lời nhắc camera đề xuất: Đưa toàn cây vào khung hình.
- Điều có thể ghi nhận: Chỉ ghi nhận tình trạng nhìn thấy.
- Kiểm tra trực tiếp: Người có kinh nghiệm quyết định cây có đủ điều kiện đóng hàng.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### CW-02 → [C02](01_NGUON_VA_BANG_CHUNG.md#c02)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của C02, đúng điều kiện; [vị trí nguồn](https://cactuswarehouse.com/pages/how-we-pack-and-ship).
- Lời nhắc camera đề xuất: Đưa phần gai và bầu cần kiểm vào khung hình.
- Điều có thể ghi nhận: Ghi nhận lớp bảo vệ và vùng bầu còn nhìn thấy.
- Kiểm tra trực tiếp: Chưa có vật liệu/cách bảo vệ cụ thể: dừng trước áp dụng.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### CW-03 → [C03](01_NGUON_VA_BANG_CHUNG.md#c03)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của C03, đúng điều kiện; [vị trí nguồn](https://cactuswarehouse.com/pages/how-we-pack-and-ship).
- Lời nhắc camera đề xuất: Đưa bố trí cây trong hộp vào khung hình.
- Điều có thể ghi nhận: Thấy vị trí gia cố; không suy ra độ chắc.
- Kiểm tra trực tiếp: Chưa có phép thử: không yêu cầu lắc hộp từ mô tả quảng bá.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

### Phần còn thiếu / chưa được áp dụng

- Thiếu xác nhận nguyên chậu/rễ trần, vật tư và bước đóng/niêm kiện.
- Chưa thẩm định theo loài, gai, kích thước và shop VN.

Điều kiện dừng: thiếu phạm vi/ETA/xác nhận hãng, thao tác chưa có căn cứ, đầu vào chưa xác nhận hoặc nguồn mâu thuẫn. Điều kiện chuyển bước đề xuất: tiêu chí thị giác đã duyệt được kiểm hoặc người kiểm tra ghi rõ thay thế, cùng xác nhận tay; chưa có phê duyệt thì không chạy quy trình này cho vận chuyển thật.

## POTHOS-GP-CANDIDATE — Ứng viên trầu bà Epipremnum aureum — chờ xác nhận áp dụng quy trình Gabriella

Phiên bản 0.1.0-research; ngày 2026-10-16; người biên soạn: AI tổng hợp có truy nguồn; người duyệt/ngày duyệt: chưa có.
Trạng thái: **KHÔNG ĐỦ CĂN CỨ CHỐT SOP RIÊNG CHO TRẦU BÀ.**
Hình thức: `POTTED_CANDIDATE_NOT_CONFIRMED`; nhóm: `POTHOS_CANDIDATE`.
Phạm vi và ngoại lệ: Không gộp tên thương mại trầu bà của Philodendron/loài khác với Epipremnum aureum.

Vật tư có căn cứ: polyfill và dây thun [G02]; giấy carton cứng hoặc foam [G03]; hộp/vật liệu lấp khoảng trống [G04]

### Chuỗi bước của đúng nguồn

Nội dung kỹ thuật ở mã bằng chứng tương ứng trong [bảng bằng chứng](01_NGUON_VA_BANG_CHUNG.md). Đọc nguyên điều kiện, không chỉ tên bước. Lời đọc TTS ghép đúng nội dung bằng chứng với lời nhắc camera; không sinh thêm kỹ thuật.

#### GP-01 → [G01](01_NGUON_VA_BANG_CHUNG.md#g01)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của G01, đúng điều kiện; [vị trí nguồn](https://www.gabriellaplants.com/pages/our-process).
- Lời nhắc camera đề xuất: Đưa cây vào khung hình.
- Điều có thể ghi nhận: Ghi nhận hình ảnh, không xác nhận cây không bệnh.
- Kiểm tra trực tiếp: Kiểm tình trạng cây và xác nhận đúng giống.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### GP-02 → [G02](01_NGUON_VA_BANG_CHUNG.md#g02)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của G02, đúng điều kiện; [vị trí nguồn](https://www.gabriellaplants.com/pages/our-process).
- Lời nhắc camera đề xuất: Đưa vùng đất cần giữ vào khung hình.
- Điều có thể ghi nhận: Thấy vật liệu và vị trí; không suy lực thun.
- Kiểm tra trực tiếp: Shop xác nhận vật liệu/cách giữ phù hợp giống, kiểm lực và phần tiếp xúc.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### GP-03 → [G03](01_NGUON_VA_BANG_CHUNG.md#g03)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của G03, đúng điều kiện; [vị trí nguồn](https://www.gabriellaplants.com/pages/our-process).
- Lời nhắc camera đề xuất: Đưa lớp bao quanh cây vào khung hình.
- Điều có thể ghi nhận: Thấy lớp bao và phần bị che.
- Kiểm tra trực tiếp: Shop chọn vật liệu và kiểm mức ép.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

#### GP-04 → [G04](01_NGUON_VA_BANG_CHUNG.md#g04)

- Nội dung thao tác/lời đọc phần kỹ thuật: dùng `instruction_vi` của G04, đúng điều kiện; [vị trí nguồn](https://www.gabriellaplants.com/pages/our-process).
- Lời nhắc camera đề xuất: Đưa hộp mở vào khung hình; nhập số cân trực tiếp.
- Điều có thể ghi nhận: Thấy bố trí, không suy số cân/tải trọng từ ảnh.
- Kiểm tra trực tiếp: Cân thực; kiểm cố định; chưa đủ bước niêm kiện nên chưa được hoàn tất.
- Khi thiếu góc nhìn, không đủ chứng cứ hoặc tiêu chí chưa được duyệt: `unverifiable`. Không tự đo độ khô/lực/độ chắc.
- Chỉ `needs_adjustment` khi thấy rõ vi phạm tiêu chí đã duyệt; không bịa cách sửa kỹ thuật. Đổi góc rồi kiểm lại, hoặc dừng và hỏi người có kinh nghiệm.

### Phần còn thiếu / chưa được áp dụng

- S07 chứng minh sản phẩm, không chứng minh SOP riêng cho giống này.
- Rễ trần trầu bà: CHƯA CÓ NGUỒN PHÙ HỢP — CẦN XÁC MINH.
- Thiếu mức ẩm, lực giữ, lượng vật tư và thử nghiệm trong nước.

Điều kiện dừng: thiếu phạm vi/ETA/xác nhận hãng, thao tác chưa có căn cứ, đầu vào chưa xác nhận hoặc nguồn mâu thuẫn. Điều kiện chuyển bước đề xuất: tiêu chí thị giác đã duyệt được kiểm hoặc người kiểm tra ghi rõ thay thế, cùng xác nhận tay; chưa có phê duyệt thì không chạy quy trình này cho vận chuyển thật.

## Hồ sơ điều kiện hãng vận chuyển — tách riêng

Đây là tài liệu đối chiếu, không phải lớp quy tắc đã được ghép sẵn vào SOP nhà vườn. Phải giải quyết khác biệt trước khi duyệt.

- **REF-FEDEX-POT**: nguồn S01; bằng chứng F01, F02, F03. Tham khảo nước ngoài; không tự áp dụng nội địa.
- **CARRIER-GHTK-REVIEW**: nguồn S09; bằng chứng H01, H02, H03. Chờ hãng làm rõ phạm vi, khung, điều kiện thời gian và phiên bản áp dụng.
- **CARRIER-VNPOST-REVIEW**: nguồn S11; bằng chứng V01, V02, V03, V04, V05. Chờ xác nhận dịch vụ/tuyến/điều kiện cây cụ thể.

Các số có nguồn nằm trong F03/H01/V03, chỉ áp dụng theo hồ sơ tương ứng. Không copy thành ngưỡng mặc định. Camera một ảnh không xác minh số lớp đã bị che hoặc thử lực.
