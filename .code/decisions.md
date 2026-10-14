# Decision log và câu hỏi triển khai

Ngày khởi tạo 11/10/2026. **Tất cả quyết định dưới đây còn OPEN hoặc PROPOSED**, chưa có xác nhận từ chủ sản phẩm/chuyên gia. Tài liệu là đề xuất review được, không quyết định production thay người sở hữu.

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
