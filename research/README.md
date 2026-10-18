# Bộ tri thức PlantCare

Ngày review: 2026-10-15. Người dùng đã chọn **tích hợp tri thức/RAG trước**. Không có fine-tuning, weights, accuracy hoặc hiệu quả giảm hư đã được chứng minh.

| Tài liệu | Nội dung |
| --- | --- |
| [packing-sources-review.md](packing-sources-review.md) | 9 nguồn hãng/nhà vườn/vật liệu và 31 ghi chú có giới hạn |
| [papers-review.md](papers-review.md) | Nghiên cứu thiết kế, abstract, metadata và nguồn bị chặn |
| [video-platform-review.md](video-platform-review.md) | 16 video duy nhất chưa xem, nền tảng và bài nhà cung cấp |
| [rag-implementation.md](rag-implementation.md) | Corpus thực, retrieval, consent, schema, provenance và quy trình review |
| [retrieval-eval.jsonl](retrieval-eval.jsonl) | 12 ca regression retrieval do SE soạn; chưa chuyên gia duyệt |

Source runtime tại `packages/knowledge/src/index.ts` gồm 11 metadata nguồn và 11 claims ngắn: 8 cây chậu, 2 nghiên cứu xương rồng, 1 container biển. MDPI chỉ có abstract nên không cấp claim cho retrieval. Các source không có claim vẫn xuất hiện trong registry để thể hiện phạm vi/giới hạn; registry không đồng nghĩa đã index toàn văn. Source đầy đủ từ attachment được giữ trong ba report, không bỏ các nguồn chưa truy cập được.

Tất cả claims **UNREVIEWED**, quyền training **NOT_CONFIRMED**. Các ghi chú là tham khảo do người thực hiện diễn giải có dẫn nguồn, không là corpus nguyên văn hay tài sản được cấp phép training. Ảnh mới tạo bằng ImageGen, không lấy ảnh/frame từ các nguồn này.

Chạy `npm.cmd test` để kiểm 12 ca retrieval, membership của citation, tách scope và replay template cũ. Report chạy thực lưu ở `output/qa/retrieval-eval.json` (ignored). Kết quả này chỉ kiểm behavior của bộ tra cứu nhỏ; không đo accuracy model hoặc độ an toàn vận chuyển.

## Bổ sung 18/10/2026

[Giáo trình](vietnamese-textbooks-review.md), [tiêu chuẩn/USDA](nursery-standards-review.md), [VBN/FAO/FloraHolland/FedEx](nursery-logistics-review.md). Runtime v3 có 19 metadata nguồn/19 claims ngắn, 16 ca retrieval. Nguồn METADATA_ONLY không tạo claim kỹ thuật; FAO tách NURSERY. Các số baseline ở trên mô tả bản 15/10, xem [flow hiện hành](../GUIDED_PACKING.md). Không fine-tuning, copy/index toàn văn hoặc nhập ngưỡng nhiệt chung.
