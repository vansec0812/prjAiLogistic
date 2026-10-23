# Decision log và câu hỏi triển khai

Ngày khởi tạo 11/10/2026. **Tất cả quyết định dưới đây còn OPEN hoặc PROPOSED**, chưa có xác nhận từ chủ sản phẩm/chuyên gia. Tài liệu là đề xuất review được, không quyết định production thay người sở hữu.

## ADR-009: Vercel Functions và Neon riêng — 21/10/2026

Yêu cầu mới giao tự triển khai thành công trên Vercel, thay giới hạn chỉ chuẩn bị Node-volume của ADR-004 trong deployment này. Chọn Neon integration đã có, tạo project PlantCare riêng ở Singapore/gói Free, chỉ nối Production. Dùng PostgreSQL cho hồ sơ/session/outbox và tệp private; SQLite local giữ nguyên. Lớp tương thích synchronous/worker giữ API transaction hiện có, TLS xác minh và khóa advisory cho ghi giữa instance. Không đặt DB trong `/tmp`, không public ảnh, không chuyển dữ liệu local hay nâng gói. `after` xử lý job trên Functions, lease phục hồi khi có request; scheduler luôn chạy và tải lớn là giới hạn còn mở. SMS thiếu không tạo OTP giả, không tự duyệt SOP/demo production. Thực thi/rollback và hạn chế tại [hướng dẫn deploy](../VERCEL_DEPLOYMENT.md). Đây là quyết định triển khai theo yêu cầu user; không đóng các đề xuất nghiệp vụ/chuyên môn còn OPEN bên dưới.

| ID | Vấn đề / nguồn | Đề xuất hoặc việc cần chốt | Owner / gate |
| --- | --- | --- | --- |
| D-01 | Stack không bị SRS khóa, p.40/114 | TypeScript/Next.js/NestJS/PostgreSQL/Redis/private S3, modular monolith + worker; validate versions/renderer ở M1 | SE + chủ sản phẩm; trước bootstrap stack |
| D-02 | FR-22 P0 nhưng roadmap p.115 để checklist R1 | Ưu tiên FR acceptance: checklist R0; complete/movement FR-23 P1 R1; UI tắt CTA chưa có | SE + chủ sản phẩm; trước scope freeze |
| D-03 | FR-35/42 P1 nhưng R0 cần catalog published/audit | R0 cung cấp phần phụ thuộc tối thiểu; full CRUD/reporting R1; không bỏ safety/version/role audit | SE; trước M3 |
| D-04 | `movement.completion_key unique` p.42 không hỗ trợ nhiều vật tư | Completion header unique case/version; movements unique completion/material sau gộp; atomic stock transaction | SE; trước DDL completion |
| D-05 | Job/case NEEDS_EXPERT vs job enum p.10; NEED_INPUT vs NEEDS_INPUT | Giữ NEED_INPUT ở field; NEEDS_INPUT ở case/job; NEEDS_EXPERT business result cần schema/enum thống nhất, không generic provider failure | SE; trước OpenAPI |
| D-06 | FR-04 one-time token nhưng reset API p.46 gộp OTP/new password | Chọn two-step verification/reset token <=10m hoặc atomic equivalent; không double consume/mismatch purpose | SE; trước auth implementation |
| D-07 | UI-26 và UI-42 cùng `/shared/:token`, p.89/105 | Owner share dialog dưới case, public recipient dùng token route; no owner nav/PII in public | SE/UX; trước share UI |
| D-08 | Providers/model/budget chưa chọn, p.5/116 | Chọn SMS Việt Nam, weather/route coverage, vision/image models hiện hành; quotas/concurrency/pricing có hiệu lực; không tự bật billing | Chủ sản phẩm/vận hành; trước live external calls |
| D-09 | Rule thresholds/material load/template chưa được duyệt | Danh sách nhóm cây hỗ trợ, nguồn specs, fixture/pilot, người duyệt; seed draft chỉ dev. Không production nếu chưa approval | Chuyên gia + chủ sản phẩm; trước publication/go-live |
| D-10 | URL signed TTL <=5m và thu hồi ngay, p.29/55 | Revoke chặn cấp link mới; issued URL còn TTL có thể đọc. Nếu yêu cầu immediate revoke chọn authorized read proxy/invalidation đã kiểm | Chủ policy + SE; trước promise privacy/share |
| D-11 | Rule rollback/history; rule bị phát hiện unsafe sau publish | Old snapshots giữ nguyên; cần policy suspend new selection/packing cho withdrawn safety version và thông báo, không mutate lịch sử | Chuyên gia/chủ sản phẩm; trước go-live |
| D-12 | Retention/consent/provider policy p.39/44/116 | Chốt 24h orphan/30d logs/180d audit/7d purge/30d backup hoặc sửa; data export/deletion/revoke/providers notice; scope ảnh chia sẻ | Chủ sản phẩm/người phụ trách policy; trước dữ liệu thật |
| D-13 | Expert/admin MFA và scope support p.6/52 | Chọn MFA/reauth flow, assignment authority/SLA, minimum audit, ai được đọc scope nhạy cảm | Chủ sản phẩm/vận hành; trước admin/expert production |
| D-14 | WARN_ACK và thiếu dữ liệu tải trọng | Chốt warning codes nào acknowledge được; thiếu hard load không PASS bằng generic consent; acknowledge bound to version/code | Chuyên gia + SE; trước engine selection |
| D-15 | Hoàn tất R0 khi FR-23 chưa bật | R0 lưu checklist/progress và export/share, không fake PACKED; full lifecycle hoàn tất/kho/handoff ở R1 | Chủ sản phẩm; trước R0 UX acceptance |
| D-16 | One SE estimate, content/provider/pilot ngoài code | R0 39-59 ngày công + dự phòng; R1 thêm 20-35; hiệu chỉnh sau M2, không gán deadline khi dependency chưa chốt | SE + chủ sản phẩm; kế hoạch delivery |
| D-17 | Carrier required trong UI p.75 nhưng tùy chọn FR-14 | Theo FR-14: carrier tùy chọn; carrier-specific limits cần dữ liệu/source tương ứng, không mặc định một hãng | SE/UX; trước shipment form |
| D-18 | p.78 vừa đã xác nhận hộp vừa cần xác nhận tải trọng | Render trạng thái thực của engine; unknown hard load chặn eligibility, không dùng copy mẫu làm trạng thái | SE/UX; trước result UI |

## Cách ghi quyết định được chốt

Mỗi decision khi đổi ghi: status, ngày, người xác nhận, context/options, choice/reason, consequences, FR affected, evidence/approval reference, migration/rollback nếu có. Không tự chuyển APPROVED vì agent đã đề xuất. Quyết định stack cần kiểm kỹ thuật; quyết định tải trọng/rule cần người có chuyên môn.

## Các giả định làm việc hiện tại

- Website tiếng Việt, vận chuyển nội địa, tài khoản cá nhân; một cây/chậu; no carrier login/native app/multi-tenant organization.
- `.code` là hồ sơ kỹ thuật, source app dự kiến ở `apps`/`packages`.
- PDF là nguồn duy nhất có mặt trong workspace; không có quyền suy nội dung video/tài liệu gốc không được cung cấp.
- Core manual được triển khai trước để kiểm domain; AI-image flag off, chat/expert/compare flags off đến R1.
- Không model ID/SDK version/quota/giá hardcode; kiểm docs chính thức hiện hành tại bước integration. Các link Google p.116 là tham khảo của SRS, chưa được kiểm lại bởi task tạo plan này.
- Tại thời điểm lập kế hoạch ban đầu chưa có test ứng dụng. Ngày 2026-10-12 bổ sung source và test local; evidence thực nằm tại [implementation.md](implementation.md).

## Bổ sung cho website local — 2026-10-12

Xem ADR bổ sung 2026-10-15 ở cuối file; các quyết định OPEN ban đầu không được tự coi là đóng.

ADR-001 tại [implementation.md](implementation.md) ghi lựa chọn reversible Next.js route handlers/SQLite/private filesystem/DB jobs để chạy trên máy hiện có Node 24, không Docker. Đây là quyết định triển khai bản local trong scope người dùng yêu cầu, không phải owner approval đổi baseline production. Những decision chuyên môn/provider/policy trong bảng trên vẫn OPEN.

## ADR-002: Tri thức/RAG và report v2 — 2026-10-15

**Quyết định người dùng:** tích hợp tri thức/RAG trước. Dùng corpus ghi chú thủ công có URL/scope/access/limitations/review; lexical retrieval local chạy được khi AI off, Gemini explanation tùy chọn có consent riêng. Không có fine-tuning/weights mới, không đưa video chưa xem hoặc abstract/metadata vào safety claims. Nghiên cứu container/xương rồng tách scope, không thay ngưỡng Rule Engine.

**Quyết định triển khai:** readiness 8 kiểm input, no-op/name-only saves giữ selection khi input hash không đổi; report v2 và template draft-steps-2 chi tiết; PDF/Markdown/JSON/ZIP pin snapshot; asset AI cây mẫu FOLIAGE có manifest/provenance/fallback. Replay template draft-steps-1 giữ bước/schema cũ. Ảnh nhóm cây khác và ca riêng cần tài sản phù hợp + review sau; không tự nhận diện hay phê duyệt kỹ thuật qua ảnh mẫu.

Mọi corpus/template/rule/ảnh chưa chuyên gia duyệt; nguồn không cho quyền dùng training mặc định. Semantic evaluation, model/provider thật, embeddings/budget tiền và expert review tiếp tục OPEN. Evidence chi tiết ở [implementation.md](implementation.md), [research/rag-implementation.md](../research/rag-implementation.md).

## Giám sát đóng gói và nhận lệnh nói — 17/10/2026
Theo yêu cầu người dùng: bổ sung luồng độc lập /app/live-packing, 6 SOP dự thảo/35 bước, checkpoint ảnh/manual, Gemini Vision/TTS và nhận lệnh tiếng Việt. Không hoàn tất hồ sơ hoặc trừ kho trong luồng thử; không tự phê duyệt SOP. Secrets chỉ qua cấu hình server, không lưu media mặc định. Nguồn và giới hạn: ../SOP_INTEGRATION.md và ../VOICE_COMMANDS.md. Kiểm: tests/live-packing.test.ts, packing-voice-commands.test.ts, live-sop-evaluation.test.ts, vietnamese-voice.test.ts, vietnamese-tts.test.ts và tests/e2e/live-packing.spec.ts. Provider thật, ảnh có nhãn và micro vật lý vẫn cần xác minh; không đóng release gate hoặc FR gốc chỉ vì có test phần mềm.

## Camera, lời đọc cố định và tự chuyển bước — 18/10/2026

Theo yêu cầu người dùng: cho xem camera trước thiết lập SOP; nút Bắt đầu bật hướng dẫn theo mẫu và nhận lệnh nếu trình duyệt hỗ trợ. Lời đọc lấy nguyên speech_vi của SOP, kèm số bước và nhắc thao tác cố định, không dùng LLM viết lại. Lệnh đã xong chỉ yêu cầu kiểm tra. Tự chuyển sau khi đọc kết quả nếu ảnh đúng bước đạt và người dùng xác nhận kiểm tay; bước manual chỉ dùng xác nhận trực tiếp. Lệnh tôi đã kiểm tra trực tiếp và checkbox lưu nguồn xác nhận vào biên bản. Lỗi/không xác minh được giữ nguyên bước. Tắt camera, ẩn trang hoặc rút đồng ý gửi ảnh dừng luồng. Đây là thay đổi tương tác kiểm thử, không phê duyệt SOP hay xác nhận độ chính xác Vision. Có thể quay lại thao tác bằng nút. Chi tiết: ../VOICE_COMMANDS.md.

## ADR-003: Hướng dẫn camera theo hồ sơ và nguồn bổ sung — 18/10/2026

Yêu cầu mới hợp nhất entry tạo hồ sơ/giám sát và nhận lời đồng ý theo bước. Chọn lưu guidance document private theo case/input hash/SOP version/revision trong DB local sẵn có. Giữ immutable plan/completion/kho riêng, không dùng session trial để suy hồ sơ đóng gói đạt. Manual step là self-report; visual cần server-validated image pass hoặc explicit manual override có lý do. Lời xác nhận chỉ commit bước hiện tại, không tạo approval safety.

Gộp thêm origin/dev-nam b920625 (fixed narration/guard và tests), giữ RAG/ảnh/báo cáo của main cùng flow mới. Controller trong RAM của nhánh đó được thay bằng phiên lưu trên server; nguyên văn speech_vi và guard đúng step_id được giữ qua packingNarration/guidedDecision. Lệnh tôi đã kiểm tra trực tiếp vẫn hỗ trợ cùng các câu đồng ý mới. Micro tiếp tục opt-in riêng. Không tự bật mic từ CTA mở camera hoặc lấy lại consent sau refresh. Nghe mẫu đọc bước đang chọn, không đánh dấu hoàn tất.

Nguồn mới được đọc theo scope, ghi rights/locator và phân biệt metadata. Bổ sung nhánh nguyên chậu FedEx cùng chú giải AmericanHort/VBN/USDA; không đổi sáu SOP version cũ hoặc đưa bảng nhiệt vào Rule Engine. RAG tiếp tục read-only/UNREVIEWED; chưa fine-tune hay copy/index toàn văn. Không đổi approval hoặc giới hạn Vercel. Đây là quyết định triển khai tương tác local, chưa nghiệm thu chuyên môn/production.

## ADR-004: Flow ảnh tự điền và Vercel/Node-volume — 18/10/2026

**User xác nhận:** Vercel cho giao diện + backend Node có ổ lưu trữ. **User đổi flow:** tạo hồ sơ → thông số → upload/chụp tự điền → ảnh hướng dẫn → AI theo từng câu hoàn tất; báo lỗi, phát âm Việt đúng SOP, tối giản copy.

Chọn mở plant trước, bổ sung private image upload/automatic Vision schema, giữ số manual và user confirmation. Chỉ chấp nhận số đọc từ nhãn/thước/cân rõ, không estimation pixel. Ảnh dùng library hiện có với provenance/fallback, generic potted SOP 5 bước; vật tư/hành trình và plan/completion giữ riêng. Ghi issue/resolve theo revision; monitoring stills 12 giây/ảnh thay đổi chỉ báo lỗi. TTS fixed SOP + deterministic pronunciation/WAV validation, không generative rewrite.

REFERENCE là chế độ coaching theo nguồn với feature flag backend explicit, có thể chạy production; không sửa published/production_enabled hoặc làm bypass plan eligibility/inventory. TRIAL cũ tiếp tục fail closed production. Không suy user's yêu cầu deploy thành approval chuyên môn.

Frontend Next.js beforeFiles external rewrite cùng origin để giữ CSRF/cookies; fail build thiếu upstream và fail local API trên Vercel. Docker Node24/Linux/font/user node, stable OTP secret, volume /data, startup/5 giây dispatcher, một replica. Không migrate DB/serverless hoặc provision/billing ngoài scope. Rollback image/code cùng feature flag off; giữ volume/history, không xóa phiên hoặc đổi draft approvals. Cấu hình/release checks cụ thể tại ../VERCEL_DEPLOYMENT.md.

## ADR-005: AI điền đủ trường dưới dạng gợi ý có nguồn — 18/10/2026

Yêu cầu mới: AI quét đủ tên/nhóm cây và sáu trường số; bỏ mục Cách xử lý ảnh. Chọn Vision v2 bắt buộc trả đúng một entry cho mỗi trường, đọc nhãn/thước/cân khi rõ, cho ước tính nháp VISUAL_ESTIMATE khi ảnh cây/chậu đủ rõ. Báo ước tính, không tự coi là đo/cân thực tế; checkbox USER confirmation và kiểm tra thực tế vẫn bắt buộc. Thiếu cơ sở null/UNKNOWN, không điền số mẫu cố định hoặc gán 0. Ước tính khối lượng không là cân qua ảnh. Giữ manual/confirmed/late edits, không thêm ngưỡng an toàn hoặc đổi Rule Engine. Prompt vision-autofill-v4, hỗ trợ đọc job vision-v1 cũ. Đây là thay đổi tương tác theo yêu cầu, không chứng minh độ chính xác số đo từ ảnh.
## ADR-006: Flow theo PRD MVP đã chốt — 19/10/2026

User cung cấp PRD Word và yêu cầu xây lại flow, push main. Áp dụng flow cây → hành trình → hai phương án từ catalog → chọn → hướng dẫn → hậu kiểm → lưu, thay ADR-004/005 ở tương tác MVP. Nguồn/confidence AI dưới ngưỡng phải NEED_INPUT, nhập tay và xác nhận. Hai đoạn auth mâu thuẫn được dung hòa bằng OTP login và giữ password login/registration. Giữ engine/API SRS riêng cho dữ liệu legacy; không dùng kho cá nhân trong đề xuất danh mục MVP. Chỉ chuyên gia độc lập duyệt cấu hình version mới, admin kích hoạt có reauth; REFERENCE không vượt MVP gate. Ví dụ giá/ngưỡng/mùa vẫn draft. Xem [ma trận và giới hạn](prd-mvp-20261019.md).

## ADR-007: Hai phương án ảnh mẫu để demo — 20/10/2026

User yêu cầu hardcode theo source mới. Chọn bộ demo local riêng, bật qua `demo:true` do UI gửi; không sửa mặc định Rule Engine hoặc tự publish cấu hình. Cả hai ví dụ hiển thị sau xác nhận đầu vào, không tuyên bố chúng phù hợp mọi hành trình. PA1 6 bước, PA2 8 bước, giữ bản ảnh gốc và checksum; gallery và phiên dùng cùng ảnh/lời đọc, Vision nhận reference riêng. Hồ sơ cũ có nút tạo bộ demo trước Bắt đầu; lịch sử vẫn bất biến. Chi tiết và giới hạn tại [packing-photo-demo.md](packing-photo-demo.md).

Yêu cầu tiếp theo cùng ngày: bỏ lời nhắc “nói đã xong để chuyển bước”, đọc tự động số bước và speech_vi theo ảnh. Các câu hoàn tất ngắn “Đã xong”/“Xong rồi” chuyển từ CHECK sang CONFIRM, qua cùng điều kiện kiểm ảnh/kiểm tay; yêu cầu “Kiểm tra” vẫn không tự chuyển. Giữ phần kiểm trực tiếp trên UI, không thay snapshot, quyền micro hay bypass lỗi. [VOICE_COMMANDS.md](../VOICE_COMMANDS.md) mô tả ngữ nghĩa mới.

## ADR-008: Nhận ảnh Phú quý để điền bộ thông số mẫu — 20/10/2026

User cung cấp `source/cayphuquy.jpg`, yêu cầu bỏ badge AI/phần trăm/Cần nhập tay và hardcode đúng bộ số để demo. Dùng fingerprint ảnh local thay vì prompt ép Gemini trả số mẫu. Chỉ ảnh này hoặc bản nén/resize khớp mới gợi ý preset; không dùng tên file hay gán số cho mọi cây. Giữ dữ liệu với source=DEMO, confidence=null, chờ xác nhận, không ghi đè USER/late edits. Các gợi ý DEMO chưa sửa có thể bị scan thật tiếp theo thay thế. Giữ fragility HIGH và gốm/sứ; demo chỉ xem cả PA1/PA2 theo source đã có, eligibility thường không đổi. [Chi tiết](packing-photo-demo.md).

## ADR-009: Demo sen đá riêng, theo bản Word mới — 23/10/2026

User yêu cầu thêm demo thứ hai như Phú quý, sau đó thay dữ liệu bằng `Bản sao của Cây vạn lộc (1).docx`. Bản mới có ảnh nhựa đen, LOW, chậu 8 cm; user xác nhận cao tổng 13 cm. Chọn registry fingerprint/preset riêng, không ép Gemini trả thông số cố định. Preset sen đá và tên Cây sen đá/SUCCULENT trong demo chọn hai phương án 4 bước từ RAR. Tán rộng 12 cm được dùng cho hai chiều của tán tròn; không suy kích thước từ ảnh. BOM 15.000/8.000đ dùng số lượng thực, quy cách và phân bổ phụ trợ; không dùng giá Phú quý. Theo chỉnh sửa tiếp theo: không gợi ý hoặc tự điền route/channel/ngày gửi; người dùng nhập cả bốn trường theo kịch bản demo. Không nâng production gate hoặc mutate lịch sử. [Chi tiết và bằng chứng](packing-photo-demo.md).
