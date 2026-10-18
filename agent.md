# Hướng dẫn agent - PlantCare

## Vai trò và nguồn sự thật

Làm việc như Senior Software Engineer chịu trách nhiệm tính đúng nghiệp vụ, thiết kế, triển khai, kiểm thử và khả năng vận hành. Đọc [plan.md](plan.md) và [.code/README.md](.code/README.md) trước khi nhận task; chọn đúng FR/BR/NFR/UI/TC tại `.code/traceability.md` và trang tương ứng trong PDF.

Thứ tự căn cứ: chỉ dẫn mới nhất của người dùng -> quyết định đã được người có thẩm quyền xác nhận -> SRS PDF -> kế hoạch/ADR đề xuất -> chi tiết triển khai. Báo rõ xung đột, không tự sửa nghĩa yêu cầu. `PRD_PlantCare_MVP.md` và `PlantCare - Flow.docx` chỉ được PDF tham chiếu, không có trong workspace lúc lập tài liệu; không tuyên bố đã đọc hai file đó.

`agent.md` là tài liệu hướng dẫn theo yêu cầu người dùng. [AGENTS.md](AGENTS.md) là entrypoint ngắn cho coding agent hỗ trợ convention này, dẫn về cùng nguồn để tránh hai bộ luật lệch nhau.

## Quy trình xử lý một task

1. Kiểm tra file/code hiện có, instruction và trạng thái thay đổi. Không ghi đè công việc không liên quan của người dùng.
2. Nêu mục tiêu hành vi và FR/BR/TC; đọc contract hiện hành, failure path, quyền, invariant và dữ liệu liên quan.
3. Nếu có quyết định mở, chọn bước reversible nằm trong scope; ghi giả định tại `.code/decisions.md`. Chỉ hỏi khi thiếu câu trả lời làm thay đổi bản chất task, policy, chi phí hoặc production safety.
4. Thiết kế đường đi dữ liệu/transaction và test rủi ro trước khi implement. Giữ thay đổi vừa đủ, review được; không tạo abstraction vì có thể dùng trong tương lai.
5. Implement một vertical slice; cập nhật schema/contract/UI/test cùng thay đổi. Adapter ngoài không được lấn vào domain.
6. Chạy checks phù hợp thực tế repo; ghi lệnh, kết quả và giới hạn. Không báo đã test nếu chưa chạy hoặc chỉ dùng mock trong test provider thật.
7. Đối chiếu acceptance/negative cases, update backlog/trace/ADR khi có đổi quyết định. Báo kết quả, bằng chứng, rủi ro còn lại và bước kế tiếp bằng tiếng Việt.

Không mặc định triển khai toàn bộ dự án khi task chỉ yêu cầu tài liệu. Không tự publish/deploy, mua dịch vụ hoặc bật billing ngoài scope được giao.

## Ranh giới kiến trúc

- Frontend: nhập/chụp, consent, sửa/xác nhận, trình bày trạng thái và kết quả server. Không giữ secret hoặc quyết định eligibility.
- Application: authorization, orchestration, transaction, version/idempotency, gọi ports.
- Domain/Rule Engine: validate dữ liệu xác nhận, kiểm fit/load, conflict, quyết định và trace deterministic; không import SDK Gemini, ORM, HTTP hay queue.
- Infrastructure: DB, storage, SMS, weather/route, Gemini, queue và export adapters.
- Worker: lease/retry/cancel và external calls có giới hạn; DB là nguồn sự thật. Mọi side effect chịu deduplication.

Baseline stack trong plan là đề xuất. Khi bootstrap kiểm phiên bản/hướng dẫn chính thức hiện hành và lock versions; không tự diễn giải proposal là lựa chọn đã được user duyệt. Các lệnh build/test chưa có cho đến khi repo ứng dụng được tạo.

## Invariant nghiệp vụ

- Một hồ sơ một cây/chậu; không tạo tính năng nhiều cây, thương mại hoặc tracking thật nếu chưa có đặc tả.
- AI chỉ gợi ý; confidence tự đánh giá không phải xác suất đúng/an toàn. Trường USER confirmed không bị AI overwrite.
- Tri thức/RAG tra cứu theo scope và nguồn đã đọc; pin knowledge version/context trong job. Citation membership không chứng minh nội dung đúng. Không dùng abstract/metadata/video chưa xem để suy claim safety, không tự biến nguồn UNREVIEWED thành rule PUBLISHED.
- Ảnh photorealistic AI có provenance/nhãn/fallback, không là ảnh cây/kiện thực hoặc bằng chứng checklist. Nghiên cứu/RAG không được báo là training trọng số; quyền dataset/ảnh và evaluation cần bằng chứng riêng.
- Số đo/cân để tính khả thi phải đã xác nhận. Số unknown dùng `null + status`, không dùng 0 hoặc chuỗi trong cột số.
- Chi phí chỉ là vật tư; unknown khác miễn phí. Tái sử dụng cần provenance; không bịa CO2 hay claim giảm hư.
- Rule/template/catalog/ảnh production là published và có approval/fixture. Không tự áp dụng ngưỡng draft cho mọi cây.
- Min/max nhiệt độ có source, observed/fetched time, validity và coverage; ngoài trời không phải trong kiện. Manual override ưu tiên provider.
- Mỗi plan version có snapshot/hash và versions đã pin; mọi bước 5-8 có hình fallback, template và rule refs.
- FAIL hoặc input mismatch/STALE không được select/start/complete; WARN_ACK chỉ tiếp tục theo chính rule, ghi acknowledgment/version.
- Rule đổi chỉ tác động job mới; plan lịch sử không mutate. Expert sửa tạo bản mới có tác giả/lý do, owner chọn riêng.
- Checklist gắn đúng alternative/version; required checks chặn complete. Không trừ kho lúc generate; complete atomic và idempotent, không âm kho.

## Quyền và bảo vệ dữ liệu

- Mọi API/resource kiểm role **và** owner/scope hiện tại; UUID không là authorization. Không tin `owner_id`, `role` từ client.
- Expert cần assignment + shared_scope + consent; editor không tự publish rule safety; operator chỉ metadata đã ẩn PII.
- Admin đọc dữ liệu nhạy cảm qua scope hỗ trợ/audit; bảo vệ admin cuối trong transaction; sensitive action yêu cầu tái xác thực.
- Session cookie Secure/HttpOnly/SameSite, CSRF; hash mật khẩu; OTP an toàn, hash, purpose-specific, one-time. Delivered SMS không là verified.
- Mock OTP chỉ dev/test có cấu hình rõ; production fail closed khi SMS không có. Không tạo bypass vì provider outage.
- Ảnh private, quarantine rồi validate magic bytes/decode/pixel/checksum và bỏ EXIF vị trí. Signed read tối đa 5 phút, cấp sau kiểm quyền.
- Share là bearer permission; token ngẫu nhiên lưu hash, pin version, expiry/revoke/scope. Mặc định không PII/ảnh gốc/ảnh checklist.
- Không đưa secret, password, OTP, raw prompt có PII, ảnh/base64 vào frontend/log/PDF/CSV.
- Consent tách mục đích và không tick sẵn; recheck trước external call, không chỉ lúc enqueue. Export/delete/provider-file cleanup theo policy đã công bố.
- SQL parameterized; sanitize CMS/AI text; chặn XSS/SSRF bằng allowlist; CSV neutralize công thức.

## Đồng thời, số liệu và lỗi

- Draft/config dùng expected version, conflict 409 và giữ bản đang sửa.
- Snapshot/hash canonicalize phía server; hash không thay thế validation hoặc quyền.
- Mutation tạo job/export/complete có Idempotency-Key scope owner + endpoint + key; cùng key khác body -> 409.
- Enqueue dùng outbox bền vững; worker lease/fencing để stale worker không ghi đè kết quả. Không giữ DB lock khi gọi provider.
- Retry transient giới hạn trong deadline; 400/401/403/config không retry mù. Repair JSON tối đa 1 lần; tổng retry/call budget thống nhất.
- Quota/budget reserve atomic, usage ghi cả call thất bại có phát sinh. Manual engine không bị budget AI chặn.
- Inventory unique ở completion header và movement `(completion_id, material_id)` sau gộp lượng theo vật tư; không unique completion key riêng trên từng dòng đa vật tư.
- Decimal cho cm/kg/quantity/money theo contract; không dùng float để tính tiền. Normalize locale ở boundary, UTC trong DB.
- HTTP/error code theo `.code/api-contracts.md`; không trả stack trace. Không báo thành công trước server commit.

## Chuẩn code và review

TypeScript strict khi áp dụng baseline; dependency/module direction rõ; typed DTO/schema và server validation. Domain function nhỏ, input/output explicit; xử lý expected business errors khác infra errors; không catch rồi giả thành công.

Review mỗi mutation: ai được làm, expected_version nào, transaction boundary, key deduplication nào, failure/retry xảy ra ở đâu, audit có gì, rollback ra sao. Review mỗi query: owner/scope, pagination, indexes, cache và PII projection. Không cache private responses như public; không trả entity ORM nguyên vẹn.

Migration ưu tiên expand/contract, có backfill và rollback/roll-forward strategy; tương thích worker cũ. Seed gắn nhãn dev; version referenced chỉ archive. Không xóa/cancel dữ liệu production để làm test qua.

## Kiểm thử và Definition of Done

Task hoàn thành khi acceptance đã đạt, authorization/failure/concurrency liên quan được kiểm, contract/migration/doc đồng bộ và check thực tế pass. Check chưa chạy phải nêu lý do; task có dependency chưa giải quyết vẫn OPEN/BLOCKED có mô tả, không giả hoàn tất.

- Rule: fixtures boundary/conflict/fit/load/unknown, determinism/replay, source/version và action trace.
- API/DB: auth/cross-owner, optimistic lock, same-key replay/body conflict, quota/lease/outbox, completion rollback/retry.
- UI/E2E: manual và AI-off, schema failure, consent revoke, 409/offline, FAIL/STALE, PDF/share/ticket scope.
- Release: NFR/load/a11y/restore/provider thật, expert approval, model regression/pilot evidence.

Không viết test chỉ lặp implementation hoặc cho chỉnh sửa docs nhỏ; dùng validation link/coverage phù hợp. Không thay fixture kỳ vọng chỉ để che lỗi engine. Không lấy unit test làm chứng cứ chuyên môn cây sẽ an toàn.

## Handoff và quản lý tiến độ

Commit/PR mô tả trigger, hành vi trước/sau, FR/TC, validation và rủi ro cụ thể. Tick backlog chỉ khi có evidence; ghi path test/report hoặc PR khi repo có. Khi dừng: nêu completed, pending, decisions, commands/checks và điểm tiếp tục. Giữ `.code/traceability.md` bao phủ đủ FR/NFR/UI/TC khi scope đổi.

## Phiên hướng dẫn camera theo hồ sơ

Flow hiện hành: `/app/new` → `/app/cases/:id/plant` → `/instructions` → `/guide?session=:id`. Upload/chụp tự chạy nhận diện, chỉ fill dữ liệu chưa nhập/chưa xác nhận; không suy số đo từ pixel. Checkbox xác nhận thông số cây/chậu là bắt buộc trước khi submit/tiếp tục hoặc chuyển sang bước sau; sửa thông số bỏ xác nhận và khóa lại các thao tác này. Lưu nháp không phải submit. Xác nhận số đo thực rồi mở ảnh hướng dẫn, không ép vật tư/hành trình trước luồng tham khảo. Contract tại [GUIDED_PACKING.md](GUIDED_PACKING.md).

“Đã xong bước này”/“Tiếp tục bước tiếp theo” chỉ xác nhận bước hiện tại: manual là self-report, visual cần server pass hoặc kiểm tay có lý do. REPORT_ISSUE xóa pass cũ, resolve riêng không tăng bước; giữ failed image trong override. Kiểm ảnh định kỳ chỉ báo lỗi, không tự advance. Server pin owner/case/input hash/SOP/version/revision, không nhận AI pass do client khai. Resume tắt media/consent, giữ tiến độ/lỗi; stop/hidden/unmount dừng tracks/lượt chờ. TTS đọc đúng SOP, chỉ normalize phát âm số/đơn vị, không để LLM đổi nội dung.

Production có thể bật chế độ REFERENCE bằng cấu hình explicit, không publish DRAFT/UNREVIEWED hoặc mở TRIAL. Phiên không thay completion/kho hoặc cấp approval safety. Copy ngắn, chi tiết provider/privacy/nguồn/review thu gọn. Deploy theo lựa chọn người dùng: Vercel frontend proxy trước Route Handlers tới backend Node HTTPS có volume; không lưu DB/ảnh trong Vercel. Đọc [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) trước đổi runtime; không stage file env người dùng hoặc tạo dịch vụ/billing không được yêu cầu.
