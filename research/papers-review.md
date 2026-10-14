# Review nghiên cứu - 2026-10-15

Đã kiểm nội dung truy xuất được và metadata gốc. `READ_SECTIONS` nghĩa đã đọc các phần nêu bên dưới, không tuyên bố đọc từng trang/ảnh. Các ghi chú là diễn giải ngắn; không lưu toàn văn, không tái sử dụng hình và không huấn luyện trọng số. Tất cả kiến thức dùng trong PlantCare vẫn **UNREVIEWED**.

| Nguồn | Truy cập thực tế | Quyền và giới hạn |
| --- | --- | --- |
| [MDPI: AI packing design](https://www.mdpi.com/2673-2688/6/7/146) | ABSTRACT_ONLY: publisher URL trả 429; đọc abstract/metadata publisher cung cấp qua [Crossref](https://api.crossref.org/works/10.3390/ai6070146) | Metadata khai CC BY 4.0; chưa kiểm toàn văn/asset phụ, chưa duyệt sử dụng training |
| [RGRC: Plant packaging for transportation](https://rsujournals.rsu.ac.th/index.php/rgrc/article/view/3122) và [PDF](https://rsujournals.rsu.ac.th/index.php/rgrc/article/download/3122/2411/) | Trang abstract và PDF 17 trang đọc text, tập trung p.1, 5–11; hình p.10 chưa render được | Xuất bản 2023-08-31; chưa xác nhận license corpus/ảnh |
| [Luận văn Thapanit Prougestapon](https://rsuir-library.rsu.ac.th/bitstream/123456789/2769/1/THAPANIT%20PROUGESTAPON.pdf) | READ_SECTIONS: PDF 50 trang, abstract, mục lục, thiết kế và thử gửi p.37–41 | Năm học 2023; chưa xác nhận quyền training hoặc tái sử dụng bản vẽ |
| [IoT maritime transport](https://www.sciencedirect.com/science/article/pii/S2590005625002486) | ABSTRACT_ONLY: mở trực tiếp 403; bản chỉ mục publisher có abstract/highlights/metadata | Array 29 (March 2026), 100621; thấy Open Access/CC nhưng chưa kiểm điều kiện cụ thể |
| [ACM DOI 10.1145/3783669.3783719](https://dl.acm.org/doi/10.1145/3783669.3783719) | METADATA_ONLY: publisher/abstract URL 403; đọc [Crossref publisher metadata](https://api.crossref.org/works/10.1145/3783669.3783719) | Metadata ngày 2025-10-31; không có abstract/license trong response, không dùng claim nội dung |

## Ghi chú theo phạm vi

**MDPI.** Abstract mô tả chẩn đoán dữ liệu, random forest dùng khối lượng/thể tích/độ dễ vỡ và xác minh bằng ca hàng thương mại. Các ví dụ là sách, đồ bếp và xe đạp, không phải cây sống. Học được cách tách dữ liệu đầu vào, kiểm cấu hình và baseline chi phí. Chưa đọc phương pháp/dataset/full text nên không đưa số tiết kiệm, độ chính xác hay model RF vào PlantCare. Metadata ghi 2025-07-04; trang [version notes](https://www.mdpi.com/2673-2688/6/7/146/notes) ghi bản PDF cập nhật 2025-07-07.

**RGRC.** Nghiên cứu thiết kế bao bì xương rồng nhỏ; phần khảo sát nêu 50 người quan tâm xương rồng. So sánh hình hộp dẫn đến prototype lục giác, khay giữ chậu và tấm giữ đất. Tham khảo chức năng giữ chậu/đất; không coi các nhận xét hình hộp là chứng nhận chịu tải. Không mở rộng thành nhiều cây trong hồ sơ MVP hoặc đổi engine hộp chữ nhật chỉ từ bài này.

**Luận văn.** p.37–39 mô tả khay khóa chậu và tấm giữ đất; p.40–41 báo cáo thử gửi với cây không dịch chuyển, đất không tràn và hộp nguyên vẹn khi nhận. Đây là thiết kế cho mẫu xương rồng, có khay cho hai chậu. Phần thử gửi đã đọc chưa cung cấp protocol rung/rơi/tải chuẩn, nhóm đối chứng và tỷ lệ hư để suy hiệu quả chung. Hai ghi chú có scope CACTUS trong corpus; không chuyển bản vẽ hoặc hình thành ảnh AI và không thêm tải trọng suy đoán.

**IoT.** Abstract mô tả đo nhiệt môi trường/đất, ẩm, nước trong đất và ánh sáng; kết nối LoRa/LEO, lưu dấu vết IOTA và Blynk. Thử nghiệm được mô tả trong môi trường kiểm soát 30 ngày. Bài nói về container biển và cảm biến, không xác minh parcel cây chậu Việt Nam. Giữ khác biệt môi trường ngoài trời/trong kiện; chưa triển khai cảm biến, telemetry hoặc tracing blockchain. Link dataset Zenodo trong publisher metadata chưa được tải/kiểm quyền, không là training set đã sẵn sàng.

**ACM.** Metadata xác nhận tiêu đề *Design and Evaluation of Plant Pattern Packaging from the Perspective of AI*. Chưa đọc nội dung nên không suy đây là nghiên cứu chịu lực, vận chuyển cây sống, hay benchmark sinh ảnh. Giữ URL trong registry, loại khỏi retrieval.

## Áp dụng vào thay đổi hiện tại

Đây là quyết định thiết kế của PlantCare: readiness trước generate, giữ số đo USER confirmed, bill/assumptions/stop conditions và trace theo snapshot; tra cứu theo scope; ảnh AI có provenance và fallback. Bài báo không phê duyệt rule, template hay hình PlantCare. License công khai và việc đọc được một trang cũng không tự chứng minh mọi dataset/ảnh bên thứ ba được dùng để training.

Ultralytics, ManufacturingTomorrow/HiFlow và Smart Packaging trong danh sách người dùng được review tại [video-platform-review.md](video-platform-review.md) và [packing-sources-review.md](packing-sources-review.md). Video chưa có transcript/frame nằm ngoài corpus.
