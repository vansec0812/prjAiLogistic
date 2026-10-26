# Hướng dẫn agent - PlantCare

Thời tiết MVP theo yêu cầu mới nhất 25/10/2026: Open-Meteo lấy min/max ngày gửi UTC+7 tại nơi đi và nơi đến (tâm tỉnh/thành); lỗi dùng 25–32°C và hiện nhãn dự phòng. Đây là cập nhật thay yêu cầu nhập tay khi lỗi trước đó. Không tạo số thời tiết bằng Gemini; không đổi bộ demo/ảnh/giọng. Giữ source/ngày/thời điểm/coverage trong context; không xem dự báo hai điểm là toàn tuyến hoặc trong kiện.

Chỉ dẫn cập nhật 23/10/2026: user yêu cầu bật demo Phú quý/sen đá trên Vercel như local. `PLANTCARE_PHOTO_DEMO_ENABLED=true` mở riêng đăng nhập khách MEMBER độc lập, nhận ảnh mẫu và bundle/hướng dẫn có `demo:true` trong production. Đây là ngoại lệ cho các đoạn “demo chỉ local/production từ chối demo” cũ bên dưới. Không đổi NODE_ENV, không mở mock OTP, TRIAL hay catalog chưa duyệt; quyền owner và mọi xác nhận vẫn áp dụng. Xem VERCEL_DEPLOYMENT.md và .code/packing-photo-demo.md.

## Vai trò và nguồn sự thật

Làm việc như Senior Software Engineer chịu trách nhiệm tính đúng nghiệp vụ, thiết kế, triển khai, kiểm thử và khả năng vận hành. Đọc [plan.md](plan.md) và [.code/README.md](.code/README.md) trước khi nhận task; chọn đúng FR/BR/NFR/UI/TC tại `.code/traceability.md` và trang tương ứng trong PDF.

Thứ tự căn cứ: chỉ dẫn mới nhất của người dùng -> PRD MVP - PlantCare (chốt).docx được giao ngày 19/10/2026 cho flow MVP -> quyết định đã được người có thẩm quyền xác nhận -> SRS PDF -> kế hoạch/ADR đề xuất -> chi tiết triển khai. Báo rõ xung đột, không tự sửa nghĩa yêu cầu. `PRD_PlantCare_MVP.md` và `PlantCare - Flow.docx` chỉ được PDF tham chiếu, không có trong workspace lúc lập tài liệu; không tuyên bố đã đọc hai file đó.

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

Theo yêu cầu 24/10/2026, wizard hành trình chỉ hiện “Mùa theo nhiệt độ” từ trung bình min/max: <15°C lạnh, 15–<25°C mát, 25–<30°C ấm, ≥30°C nóng. Nhãn này là phân loại giao diện, không phải mùa lịch/dự báo hay ngưỡng an toàn. Thiếu số/đảo khoảng để trống; sửa nhiệt độ bỏ xác nhận và ghi nguồn USER, giữ nguồn provider trong dữ liệu khi chưa sửa. Không hiện văn bản fixture ở ô mùa, không mutate lịch sử.

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

Bảng so sánh chi phí trên kết quả mặc định chỉ hiện “Xem chi tiết”. Khi mở mới hiện tiêu đề, toàn bộ BOM, đơn giá, quy cách, lượng, tổng vật tư và mức tiết kiệm; “Thu gọn” ẩn toàn bộ nội dung lại. Không hiện bảng tổng hoặc dòng tiết kiệm bên ngoài phần mở rộng. Không sửa giá/snapshot khi mở hoặc đóng bảng.

Demo ảnh theo yêu cầu 20/10/2026: dùng bộ `source/pa1` (6 bước thùng xốp) và `source/pa2` (8 bước ống carton). UI local gửi `demo:true` khi tạo phương án; hồ sơ cũ có nút “Dùng ảnh mẫu PA1/PA2” trước khi bắt đầu. Bộ demo là ví dụ cố định, không đánh giá eligibility, không tự thay cấu hình được duyệt và không sửa bundle lịch sử. Production từ chối tạo/chạy demo. Ảnh WebP giữ đủ khung/chú thích, pin đường dẫn version và SHA-256 trong phiên; Vision nhận ảnh mẫu và ảnh thực hiện với nhãn riêng, chỉ dùng ảnh thực hiện làm bằng chứng. Xem [hồ sơ demo](.code/packing-photo-demo.md).

Giá demo theo yêu cầu 22/10/2026: PA1 gồm thùng xốp 2.000đ, chèn lót 1.000đ, màng bọc 200đ, băng keo 200đ, tổng 3.400đ; PA2 gồm bìa carton 500đ, màng bọc 200đ, băng keo 200đ, tổng 900đ. `demo-pricing.ts` là nguồn giá dùng chung cho bundle demo mới và lớp hiển thị bundle demo cũ chưa có giá. Ghi nguồn/version trong trace, không sửa snapshot DB hoặc đơn giá lịch sử đã có. Bảng so sánh chỉ tính các dòng được user định giá; ảnh/bước tem và vận đơn vẫn giữ nguyên, không tự coi vật tư ngoài bảng giá là miễn phí.

Lời đọc theo yêu cầu tiếp theo 20/10/2026: khi vào bước, tự đọc “Bước N.” và speech_vi đã pin theo ảnh; không thêm câu nhắc người dùng nói đã xong để chuyển bước. “Đã xong”, “Xong rồi”, “Đã xong bước này” và yêu cầu bước tiếp được nhận như xác nhận cùng bước, vẫn qua kiểm ảnh/kiểm tay hiện hữu. “Kiểm tra” chỉ kiểm, không chuyển; phủ định không xác nhận; không tự bật micro. Phần manual/camera/checklist tiếp tục hiển thị riêng, không ghi đè lời hướng dẫn đã lưu trong phiên.

Demo Phú quý theo yêu cầu tiếp theo: ảnh `source/cayphuquy.jpg` và bản nén/resize khớp fingerprint local điền bộ mẫu “Cây phú quý lá đỏ”, FOLIAGE, 50/40/40/20/25 cm, 5 kg, HIGH, Gốm / sứ. Ghi source=DEMO, confidence=null, chờ checkbox xác nhận; giữ manual/late edit. Không gọi Gemini hoặc dùng tên file để nhận mẫu. Không hiện badge nguồn/phần trăm/Cần nhập tay trên form; validation vẫn giữ. HIGH không bị hạ để demo PA1/PA2, engine thường vẫn cần chuyên gia. Không áp bộ số này cho ảnh khác; endpoint mẫu chỉ local. Xem [.code/packing-photo-demo.md](.code/packing-photo-demo.md).

Demo sen đá 23/10/2026 dùng ảnh mới từ `Bản sao của Cây vạn lộc (1).docx`, lưu `source/sen-da/plant.png`, preset `sen-da-20261023-v2`. Theo bản mới + user xác nhận chiều cao: SUCCULENT, tổng cao 13 cm, tán dài/rộng 12/12 cm, chậu đường kính/cao 10/8 cm, 0,3 kg, Nhựa, LOW. Bản mới thay thông tin gốm/sứ và trung bình đã cung cấp trước đó. Nhận cùng ảnh qua fingerprint, giữ Phú quý riêng và không ép mọi ảnh sen đá thành ảnh mẫu. Preset sen đá/nhóm tương ứng dùng đúng hai bộ 4 bước `source/sen-da/pa1`, `pa2`, tổng 15.000đ/8.000đ, tiết kiệm 7.000đ (46,7%). BOM có quy cách, băng keo 1,2 m/0,8 m và phụ trợ phân bổ 400đ/100đ, không coi đơn giá thiếu là 0. Hành trình do người dùng tự nhập toàn bộ nơi đi, nơi đến, kênh bán và ngày gửi, sau đó xác nhận; ảnh mẫu không tự điền bất kỳ trường hành trình nào. Lịch sử bundle/phiên không bị ghi đè. Xem hồ sơ demo và script chuẩn bị ảnh.

Tên hiển thị theo yêu cầu mới: PA1 = “Phương án an toàn nhất”, PA2 = “Phương án tối ưu chi phí nhất”. Không hiện mô tả/gợi chú demo kiểu “6 bước theo bộ ảnh bạn cung cấp”; giữ tên mới khi đọc hồ sơ cũ qua lớp trình bày, không sửa snapshot, mã phương án, ảnh hoặc thứ tự bước.

Flow hiện hành theo PRD đã chốt: tạo → một ảnh/nhập cây → confidence từng trường, NEED_INPUT phải nhập tay → checkbox xác nhận → hành trình/kênh/ngày gửi → xác nhận → hai phương án PA1/PA2 + BOM/chi phí → chọn → ảnh/bước theo phương án → mở camera tùy chọn → Bắt đầu → xác nhận từng bước → hậu kiểm → lưu lịch sử. Không ép kho/ảnh vật tư vào wizard MVP. Chi tiết, fingerprint và ma trận 10 tính năng tại [.code/prd-mvp-20261019.md](.code/prd-mvp-20261019.md).

AI không đo/cân qua ảnh; gợi ý có nguồn AI/USER và confidence tự đánh giá, không phải xác suất đúng. Ngưỡng cấu hình mặc định 70%; thấp/unknown giữ null hoặc NEED_INPUT, người dùng phải nhập tay. Manual/confirmed không bị ghi đè. Đang nhận diện khóa xác nhận; thay ảnh hoặc sửa trường bỏ xác nhận. Không tự xác nhận hành trình hoặc lấy ví dụ PRD làm dự báo/giá thực.

Phiên MVP pin bundle/alternative/config/input hash/owner/revision và lời đọc. Mở camera chưa chạy hướng dẫn. Đổi phương án trước Bắt đầu; pause/resume/end có server guard. Lệnh đã xong xác nhận đúng bước, lỗi giữ bước, resolve không skip; camera định kỳ chỉ báo lỗi. Độ cố định trong hậu kiểm bắt buộc USER kiểm trực tiếp; ảnh không chứng minh phần bị che kín. Chỉ lưu PACKED khi đủ mọi tiêu chí của phương án. Không trừ kho từ flow danh mục MVP.

Production cần cấu hình được chuyên gia độc lập duyệt và quản trị tái xác thực kích hoạt. REFERENCE flag chỉ phục vụ phiên cũ, không vượt eligibility MVP hoặc publish draft. Cấu hình/bundle bất biến, rollback con trỏ về bản đã duyệt; không ghi đè lịch sử. Giữ fallback thủ công và nội dung đã tải khi offline. Camera/micro/consent không tự khôi phục sau refresh. Quyền lưu ảnh cây explicit; camera/postcheck không mặc định lưu ảnh.

Deploy theo yêu cầu tự triển khai 21/10/2026: Vercel Node Functions + Neon PostgreSQL riêng cho PlantCare (gói Free, Singapore), `PLANTCARE_STORAGE=postgres`. Hồ sơ, session, outbox và tệp private đều bền vững trong schema `plantcare`; không dùng SQLite hoặc filesystem tạm làm nguồn dữ liệu trên Vercel. Adapter tương thích synchronous giữ transaction callback hiện có trên cùng connection, khóa advisory giữa các instance; đây là giới hạn throughput của MVP, chưa là bằng chứng load/HA. Tác vụ dùng `after` trong request và lease/outbox, phục hồi khi có request mới, chưa có scheduler liên tục. SQLite/Node-volume vẫn hỗ trợ chạy local hoặc host cũ. Đọc [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) trước đổi runtime. Yêu cầu mới cho phép tạo tài nguyên triển khai cần thiết; không tự nâng gói hoặc bật billing. Không stage env người dùng hoặc tự cấp approval chuyên môn. SMS thiếu vẫn fail closed; demo local không được bật bằng cách đổi NODE_ENV. Kết quả check và các NFR/pilot/provider chưa đủ evidence phải ghi rõ.
