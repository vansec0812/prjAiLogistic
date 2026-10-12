# Bằng chứng triển khai website local — 2026-10-12

Đây là bản ghi bổ sung cho task xây website theo PDF/MD, không thay đổi nội dung SRS hoặc xác nhận R0/R1 đã phát hành. Nguồn yêu cầu và trang vẫn nằm tại `source-index.md`/`traceability.md`; các quyết định còn OPEN tiếp tục có hiệu lực.

## ADR-001: runtime local không cần Docker

**Quyết định trong phạm vi reversible local:** dùng Next.js 16.4.0 route handlers + React 19.3.0 + Node 24 `node:sqlite`, private filesystem và DB-backed job/outbox. Không cần cài Docker; máy hiện có Node 24.19.0. NestJS/PostgreSQL/Redis trong tài liệu gốc là baseline đề xuất, chưa được owner phê duyệt cho production. Chưa coi lựa chọn local này là chấp thuận đổi baseline production.

Domain/Rule Engine tách package thuần. SQLite dùng WAL, foreign keys, BEGIN IMMEDIATE, unique constraints, immutable-plan trigger và optimistic case version. Ứng dụng chạy một server local; không đưa ra claim horizontal scaling. Job có snapshot, pin rule/template, trạng thái, lease/attempt limit, cancellation và outbox; worker chạy trong process request, không thay thế BullMQ/Redis worker/SLA độc lập.

Asset private dùng authenticated owner proxy/no-store thay signed URL TTL. Thu hồi tài khoản/owner check trên từng read; link share token hash riêng, projection không gồm snapshot/input/ảnh/PII tài khoản. Chưa có lifecycle purge/restore đầy đủ.

## Ánh xạ evidence vào yêu cầu

| Nhóm nguồn | Hành vi thực | Bằng chứng và giới hạn |
| --- | --- | --- |
| FR-01..04 | Registration pending, OTP one-time, login, reset/revoke | E2E auth + owner/CSRF/role; SMS dev hiển thị mã có nhãn, chưa provider thật |
| FR-07..17 | Dashboard, photos private, wizard/manual confirmed inputs, durable plan job | Browser flow, private image decoding/owner E2E; weather manual, Vision adapter optional chưa integration-tested |
| FR-18..19, FR-21..23 | Feasibility, rule trace, six illustrated steps, version checklist, completion | 17 engine assertions/tests + browser/API workflow; chỉ một phương án fixture, chưa alternatives hoặc chuyên môn duyệt |
| FR-24, FR-26, FR-40, FR-49 | Immutable versions/hash, STALE block, pinned PDF/share, job status | API stale/concurrency/export/share revoke; PDF đã render kiểm từng trang, có Unicode/sơ đồ/trace; chưa worker vận hành đầy đủ |
| FR-13, FR-27..29, FR-47 | Inventory, templates, feedback, shipment self-report, notifications | E2E inventory atomic/idempotent + template clone; chưa đầy đủ revision history/correction nghiệp vụ/SRS pagination UI |
| FR-05..06, FR-30..38, FR-41..42 | Profile, ticket draft/thread, public prep guides, admin read-only, JSON export/reauth | Có UI/API thật trong phạm vi hẹp; phone change/purge/expert/CMS/admin write chưa implement |
| FR-39, FR-44..45, FR-48, FR-52..53 và NFR | Purpose consent/revoke, owner/private proxy, quota calls, deterministic trace, AI-off manual flow | Có control local; chưa money budget/policy/retention/governance hoặc đầy đủ NFR evidence |
| FR-20, FR-25, FR-43, FR-46, FR-50..51 | Alternatives/chat/quality/context integration và kiểm dữ liệu nâng cao | Chưa đạt acceptance; chỉ manual context/form validation, chưa provider/evaluation thật |

Ánh xạ trên theo nhóm luồng, không thay row truy vết bằng trạng thái DONE. Xem tên/chỉ số chính xác của từng FR trong `traceability.md`. Có màn hình không đồng nghĩa đạt toàn bộ FR tương ứng.

## Kiểm tra đã chạy

- `npm.cmd install`: dependencies exact + lockfile, kiểm ở thời điểm cài không có vulnerability được npm báo.
- `npm.cmd run typecheck`: TypeScript strict.
- `npm.cmd run test`: 18 test Rule Engine (unknown khác zero, fit/load boundary, decimal exact, confirmation, chiều cao chậu không mâu thuẫn chiều cao tổng, unavailable stock, unknown/high-risk scope, provenance, deterministic/non-mutating, cost priority sau feasibility, unknown price).
- `npm.cmd run test:e2e`: 5 scenario suites, bao gồm auth OTP one-time/reset revoke, role injection/owner/CSRF; FAIL/NEEDS_INPUT/STALE select/complete block; optimistic draft conflict; checklist; stock rollback khi thiếu, concurrent/idempotent complete và inventory chỉ gồm vật tư chọn; share revoke/projection; private image+fake file; sanitized template; actual PDF; UI desktop/mobile và hoàn tất bằng số đo nhập tay.
- Desktop 1440 × 1000 và mobile 390 × 844 đã chụp và kiểm. Không horizontal document overflow ở trang plan/dashboard; mobile drawer ẩn sau transition; modal trap/focus và reduced-motion có code nhưng chưa thay thế WCAG audit/zoom/screenreader đủ ma trận.
- PDF QA: render bằng PyMuPDF do máy không có Poppler, kiểm Vietnamese text/snapshot/sáu bước và từng trang. `scripts/inspect-export.py` là helper QA, không dependency runtime.
- `npm.cmd run build`: PASS, Next.js production compilation và TypeScript, không lỗi build. Đây không phải nghiệm thu provider/go-live.
- `npm.cmd run test:production`: PASS; server production port 3002/storage độc lập: public 200, demo auth 404 kể cả `PLANTCARE_MODE=development`, API riêng 401, đường dẫn DB 404, CSP không `unsafe-eval`. Helper tự dừng server sau check.

E2E cấu hình server và storage riêng, không dùng DB người dùng. CLI có thể in warning màu `NO_COLOR/FORCE_COLOR`; đó không phải lỗi test. Các thresholds kỹ thuật local không có approval chuyên môn.

## Các giới hạn cần xử lý trước R0/R1

1. Phê duyệt catalog/rule/template/ảnh và policy; baseline production, model/provider/budget. Fixture hiện tại 2 cm/10–32 °C/48 giờ không là ngưỡng áp dụng thực tế.
2. Migration schema typed/provenance theo từng field, source/observed/validity/coverage; case confirmation hiện gom theo plant/material/shipment. Actual completion chưa có workflow sửa lượng dùng thực tế so với phương án hoặc quy cách ngoài hộp đầy đủ.
3. Worker độc lập, transient retry/schema repair, money reservation/reconciliation, audit/metrics/deadline/retention. In-process worker chỉ recover khi có request.
4. Full expert assignment/scopes/revision, account delete/phone change/backup purge, role admin tooling, CSV/CMS, alternatives/chat và các P1 còn OPEN.
5. Provider integration, DB restart/fault/lease recovery, property/fuzz/concurrency tải cao, performance/restore/alert/accuracy/pilot và accessibility audit cần evidence riêng.

Không có secrets trong client, không bật billing hoặc deploy. Các thiếu hụt ở trên được nói rõ trên UI liên quan và README; không dựng kết quả provider/tracking/chuyên gia giả.
