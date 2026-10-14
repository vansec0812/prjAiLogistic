# RAG local và quy trình mở rộng

## Hành vi hiện có

1. Nguồn được triage thủ công; lưu URL, ngày truy cập, access, scope, giới hạn, review và quyền training.
2. Chọn claim ngắn đã đọc đủ căn cứ; chưa ingest PDF/website/video tự động. Chỉ `READ` có claim và đúng scope được retrieve. Abstract/metadata/video không cấp claim bằng suy đoán.
3. `retrieveKnowledge()` normalize tiếng Việt, tìm lexical theo tags/text, xếp điểm ổn định và tối đa 8 kết quả. UI hỗ trợ cây chậu/xương rồng/container; mặc định cây chậu. Đây là retriever nhỏ, không embeddings/vector database, không tự tìm web mỗi câu hỏi.
4. Tra cứu local ở `/app/knowledge` cần tài khoản, không cần key/consent external. Câu trả lời Gemini là tùy chọn; purpose `AI_KNOWLEDGE` riêng, không tick sẵn, không dùng consent nhận diện ảnh thay thế.
5. Job pin version + claims/source context khi enqueue. Owner/CSRF/idempotency/outbox; recheck consent/status ngay trước call; timeout 20 giây, quota atomic toàn app/ngày dùng chung Vision, rate limit owner. Không retry provider mù. Chưa có budget tiền/token hoặc retry/repair hoàn chỉnh.
6. Gemini nhận câu hỏi + ghi chú nguồn; không gửi snapshot, điện thoại, địa chỉ hoặc ảnh. UI nhắc không nhập PII vào câu hỏi; chưa có bộ lọc/redaction PII đầy đủ, người dùng vẫn có thể tự nhập thông tin riêng tư.
7. Output Zod strict: `answer`, `claims[{text,citation_ids}]`, `uncertainties`, `needs_expert`. Model không tạo URL hoặc action tools. Kiểm citation phải thuộc context, thiếu schema hoặc nguồn giả bị từ chối; UI render text và URL từ registry server. Tất cả nguồn chưa chuyên môn duyệt nên server giữ `needs_expert=true`.
8. Câu trả lời chỉ đọc; không ghi hồ sơ, số đo confirmed, selection, checklist hoặc kho. Report đóng gói vẫn từ Rule Engine/template deterministic; model không là nguồn quyết định fit/load.

Đối chiếu adapter với [Gemini generateContent API](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig) và [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), 2026-10-15. Model ID/key cấu hình phía server, không mặc định tên model. Structured schema và citation membership không chứng minh nội dung câu trả lời đúng; cần evaluation semantic và chuyên gia. Chưa chạy provider thật vì workspace chưa có key/model.

## Dữ liệu đầu ra

Report `packing-report-v2`, template `draft-steps-2`, knowledge version `plantcare-evidence-20261015-v2`. Mỗi snapshot lưu preflight, bill dùng thực trong phương án, assumptions, thao tác, checkpoints, stop conditions, tools/material IDs, handover/recipient checks, references và limitations.

PDF/Markdown/JSON/BUNDLE pin cùng version/hash. ZIP gồm PDF, Markdown dùng asset tương đối, JSON provenance và hình đã chọn/fallback; không gom ảnh private/account vào export. Markdown tải riêng tham chiếu asset website, nên dùng ZIP khi cần xem offline. JSON ghi `model_fine_tuned=false` và `generation_mode=DETERMINISTIC_RULE_TEMPLATE`; RAG explanation không được giả làm quyết định Rule Engine.

Ảnh photorealistic là cây mẫu trầu bà cho nhóm FOLIAGE, không khớp mọi loài/kích cỡ. Nhóm FLOWERING/SUCCULENT giữ sơ đồ; fallback ảnh lỗi dùng SVG. Manifest lưu SHA256 bản PNG gốc/WebP display, provenance BUILTIN_IMAGEGEN và UNREVIEWED. Không tự khẳng định ảnh đã thực hiện checklist. WebP cho web/ZIP, JPEG embed PDF để giảm dung lượng; bản gốc được giữ.

## Cổng thêm một nguồn hoặc claim

- Ghi tác giả/ngày/URL/access thực; dẫn section/page/timestamp, không suy từ tiêu đề hoặc hình chưa xem.
- Ghi license riêng cho văn bản, dataset, ảnh/frame, điều kiện thương mại; quyền chưa rõ giữ NOT_CONFIRMED, không đưa vào training.
- Diễn giải claim ngắn, một ý mỗi claim; scope theo loài/chậu/tuyến/dịch vụ/môi trường. Số trong nghiên cứu không là ngưỡng chung.
- Chuyên gia review support/contradiction/limitations; ghi reviewer/version/reason. Không auto promote source thành PUBLISHED rule.
- Bump knowledge version; thêm ca positive/abstention/scope/injection/conflict; review nguồn định kỳ, archive thay vì sửa job/version đã pin.
- Khi cần semantic retrieval: chọn embeddings, quyền provider/budget, benchmark tập tách độc lập và kiểm private context trước thay retriever. Không âm thầm bật dịch vụ phí.

## Evaluation và dữ liệu tương lai

`retrieval-eval.jsonl` có 12 ca do SE viết: tìm chậu/đất/tán/nhãn/receipt/photo, từ chối scope container sai và nguồn chưa đọc, nghiên cứu xương rồng đúng scope. `tests/retrieval-eval.test.ts` chạy thật retriever local và lưu returned IDs/pass. Đây là regression set, không là held-out expert benchmark, không đủ công bố recall/accuracy tổng quát.

Để đánh giá Gemini thật cần tập độc lập do chuyên gia duyệt (prompt/context, expected support IDs, forbidden claims, scope, needs_expert, injection attempts), cấu hình provider/model cụ thể và mục đích dữ liệu hợp lệ. Đo citation precision, unsupported numeric/safety claims, abstention, latency/calls/usage và human acceptance; so sánh baseline local. Chưa có evidence chạy provider hoặc các metric này.

Training trọng số, nếu có yêu cầu riêng sau này, cần dữ liệu có quyền và consent thích hợp, annotation, split theo cây/chậu/hành trình để tránh leakage, training job/weights/model version và holdout evaluation. Không dùng ảnh AI mẫu như ảnh kiện thật hoặc ground truth số đo/an toàn. Hiện không có training job hoặc weights mới.
