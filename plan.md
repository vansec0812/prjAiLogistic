# PlantCare - Kế hoạch triển khai

Ngày lập: 11/10/2026. Đối tượng: một Senior Software Engineer phụ trách triển khai end-to-end.

Nguồn: [PlantCare_SRS_ChiTiet_UI.pdf](PlantCare_SRS_ChiTiet_UI.pdf), SRS v1.0, 116 trang. Tài liệu nguồn là **bản đề xuất chưa được phê duyệt chuyên môn**. Workspace hiện chỉ có PDF, chưa có ứng dụng, hạ tầng hoặc bộ rule đã duyệt. Các checkbox dưới đây là công việc tương lai, chưa phải bằng chứng đã triển khai.

## 1. Mục tiêu và phạm vi

Xây dựng website tiếng Việt, mobile-first, giúp tài khoản đã OTP tạo hồ sơ **một cây/chậu**, xác nhận cây/vật tư/hành trình, nhận phương án đóng gói từ Rule Engine với 5-8 bước có hình, thực hiện checklist, lưu lịch sử, xuất PDF và chia sẻ snapshot chỉ xem.

- R0: tất cả FR P0, cộng phụ thuộc tối thiểu để P0 vận hành đúng; có luồng manual khi Gemini không khả dụng.
- R1: toàn bộ FR P1, gồm kho và hoàn tất có movement, mẫu, feedback, CMS, chuyên gia, so sánh, chat, ảnh AI tùy chọn và tải/xóa dữ liệu.
- R2: cần đặc tả mới cho tổ chức, nhiều chậu/kiện, đặt xe/tracking thật, thương mại, cảm biến hoặc quốc tế.

Không mở rộng R0 bằng yêu cầu P2. SRS p.115 để checklist ở R1 nhưng FR-22 p.22 là P0: kế hoạch này đưa checklist vào R0; FR-23 hoàn tất/trừ kho đầy đủ ở R1. Các lệch khác được ghi tại [.code/decisions.md](.code/decisions.md).

## 2. Nguyên tắc không được vi phạm

1. Gemini gợi ý nhận diện; người dùng xác nhận dữ liệu; Rule Engine quyết định kỹ thuật, vật tư, cảnh báo và bước.
2. Kiểm khả thi dùng số đo/cân thực đã xác nhận, kích thước **trong** hộp, khối lượng vật tư và tải trọng có nguồn. Unknown khác 0.
3. Cùng snapshot và version phải có cùng quyết định/trace. Version phương án bất biến; thay đầu vào làm bản cũ STALE.
4. FAIL/STALE không thể chọn hoặc bắt đầu đóng gói; WARN_ACK chỉ được tiếp tục nếu rule cho phép và có acknowledgment đúng version.
5. Không consent hoặc hết budget AI vẫn tạo được bằng manual + rule/template/sơ đồ đã duyệt. SMS outage giữ tài khoản mới pending.
6. Owner/role/scope được kiểm phía server trên API, ảnh, job, export, share và ticket. Admin không mặc định đọc toàn bộ dữ liệu cá nhân.
7. Retry, double-click và worker restart không được nhân bản side effect. Kho chỉ trừ khi hoàn tất có xác nhận.
8. Ngưỡng nhiệt/chậu/khối lượng trong PRD chỉ là draft/fixture; production cần duyệt chuyên môn và thử thực tế.

## 3. Kiến trúc làm việc đề xuất

Baseline để lập kế hoạch: TypeScript monorepo; Next.js frontend; NestJS REST API dạng modular monolith; worker riêng; PostgreSQL; Redis/BullMQ; S3-compatible private storage; OpenAPI; Vitest hoặc Jest, Playwright và công cụ load test. Đây là **đề xuất kỹ thuật**, chưa phải stack do PDF bắt buộc hay đã cài. Chọn phiên bản còn được hỗ trợ và kiểm tài liệu chính thức tại bước bootstrap; ghi lockfile, không dùng model ID/giá/quota giả định.

Modular monolith giảm chi phí vận hành cho một SE; Rule Engine thuần tách khỏi HTTP, DB và AI. DB là nguồn sự thật cho job/snapshot/idempotency; queue là cơ chế phân phối. Worker có thể scale độc lập. Xem [.code/architecture.md](.code/architecture.md), [.code/data-model.md](.code/data-model.md), [.code/api-contracts.md](.code/api-contracts.md).

## 4. Milestone và cổng nghiệm thu

Ước lượng dưới đây là ngày công của một senior SE, giả định full-time và đã có môi trường chạy. Không gồm chờ provider, chuyên gia, thiết kế tài sản minh họa hay pilot. Sau M2 phải hiệu chỉnh theo dữ liệu thực; không coi đây là cam kết lịch giao hàng.

| Mốc | Ngày công đề xuất | Kết quả có thể review | Điều kiện qua cổng |
| --- | --- | --- | --- |
| M0 - Chốt phạm vi và rủi ro | 2-3 | ADR baseline, decision log, FR/UI/TC mapping, checklist provider/rule | Phân biệt rõ proposal/approved; mọi blocker có owner và fallback |
| M1 - Nền tảng | 4-6 | Repo chạy local, CI, migration, config, lỗi chuẩn, audit/health cơ bản | Build/typecheck/lint; DB/Redis/storage chạy; không secret trong client/log |
| M2 - Auth và hồ sơ manual | 6-9 | OTP/session/reset, wizard, ảnh private, provenance, draft lock | User ACTIVE tạo draft; refresh giữ dữ liệu; cross-owner bị chặn; 409 không mất nội dung |
| M3 - Rule Engine và publication | 8-12 | Rule DSL allowlist, fixtures, catalog/template/ảnh versioned, review/publish | Boundary/conflict/fit/load đạt; thiếu approval bị chặn publish; manual sinh đủ 5-8 bước |
| M4 - Job, bối cảnh và Gemini | 7-10 | Snapshot/job/lease/outbox, weather/ETA adapters, vision, quota/usage | Restart không trùng; AI-off vẫn chạy; schema/injection/consent/rate-limit đạt |
| M5 - R0 end-to-end | 6-9 | Result/trace, selection/checklist, history/PDF/share, admin tối thiểu | TC liên quan đạt; FAIL/STALE bị chặn server; PDF/share đúng version và scope |
| M6 - Hardening và pilot R0 | 6-10 | Báo cáo tải, accessibility, security, restore, model evaluation, pilot | Tất cả P0 đạt; rule/sơ đồ được duyệt; cấu hình production thật đã kiểm |
| M7 - Website đầy đủ R1 | 20-35 | Các FR P1 theo feature flag, tài liệu vận hành cập nhật | Không giảm chuẩn P0; từng flag qua test/scope/privacy; nghiệm thu full release |

R0 khoảng **39-59 ngày công**, R1 thêm **20-35 ngày công**; nên để dự phòng 15-25% sau spike kỹ thuật. Các phần cần approval chuyên môn/provider có thể làm critical path dài hơn. Đây là ước lượng của kế hoạch, không có trong SRS.

Critical path: M0 -> M1 -> M2 -> M3 -> M4 -> M5 -> M6. Trong M3 có thể chuẩn bị adapter stub và hợp đồng M4; ưu tiên hoàn thiện một vertical slice manual trước khi tích hợp AI. Bộ ảnh có nhãn/rule/sơ đồ được duyệt cần chuẩn bị từ M0.

## 5. Backlog triển khai

- [ ] M0: ghi decision log; chốt R0/P1 phụ thuộc; phân công người duyệt rule, policy và provider.
- [ ] M1: tạo `apps/web`, `apps/api`, `apps/worker`, `packages/domain`, `packages/rule-engine`, `packages/contracts`; dev services; CI; migration và seed gắn nhãn development.
- [ ] M2: auth/register/OTP/login/logout/reset/session revoke; quyền owner; draft optimistic lock; upload quarantine/normalize/access; wizard manual và provenance.
- [ ] M3: DSL không eval; deterministic trace; validate input/box/load/availability; conflict handling; template 5-8 bước; review/publish/rollback; bảo vệ admin cuối.
- [ ] M4: job state/lease/retry/cancel; transactional outbox; idempotency; context source/expiry; vision schema/semantic checks; consent check trước call; atomic budget reservation và usage reconciliation.
- [ ] M5: chọn bản hợp lệ, acknowledgment, STALE; checklist bắt buộc; version timeline; export PDF Unicode; share token hash/expiry/scope/revoke; admin config/jobs/quality; error/empty/offline UI.
- [ ] M6: cross-owner regression; concurrency/fault injection; load 100 user; responsive/a11y; restore drill; provider thật; đánh giá ảnh có nhãn và pilot rule đã duyệt.
- [ ] M7a: kho vật tư và completion transaction; mẫu; feedback; in-app notifications; bàn giao/nhận tự khai báo.
- [ ] M7b: profile/đổi số, data export/delete, CMS/catalog đầy đủ, báo cáo và scope chuyên gia.
- [ ] M7c: tối đa 3 phương án từ engine; chat read-only; ảnh AI có consent/budget và fallback riêng.

Chi tiết task, phụ thuộc và kết quả nghiệm thu: [.code/backlog.md](.code/backlog.md). Truy vết **53 FR, 15 NFR, 44 UI desktop, 4 UI mobile, 14 TC**: [.code/traceability.md](.code/traceability.md), [.code/ui-spec.md](.code/ui-spec.md), [.code/test-strategy.md](.code/test-strategy.md).

## 6. Cách làm việc của senior SE

Mỗi task bắt đầu bằng FR/BR/TC liên quan, invariant, boundary và failure path; thiết kế contract/migration trước khi viết handler. Giao theo vertical slice UI -> API -> domain -> persistence -> test, thay vì làm toàn bộ UI rồi mới nối backend.

Mỗi PR có mục tiêu cụ thể, phạm vi, contract/schema thay đổi, kiểm quyền, xử lý đồng thời, bằng chứng test và cách rollback khi cần. Tránh abstraction chưa có hai use case thực, microservices sớm và helper che giấu transaction/authorization. Tách refactor khỏi thay đổi hành vi khi thuận tiện.

Quy trình agent và định nghĩa hoàn thành nằm tại [agent.md](agent.md). `.code` chứa tài liệu điều hành kỹ thuật; không phải folder source của ứng dụng hoặc dấu hiệu ứng dụng đã hoàn thành.

## 7. Chất lượng và vận hành

Các số dưới đây là **mục tiêu đề xuất từ SRS**, cần đo trên staging có cấu hình và workload công bố:

- CRUD p95 < 800 ms với 100 user; mobile LCP <= 2,5 s; CLS <= 0,1.
- Vision p95 <= 15 s; timeout/call 20 s; toàn job <= 180 s; plan với hình thư viện p95 <= 120 s. Ảnh AI là job riêng.
- Luồng CRUD SLO 99,5%/tháng; theo dõi AI/SMS/weather độc lập.
- Backup DB hằng ngày, giữ 30 ngày; RPO <= 24 h, RTO <= 4 h; restore staging ít nhất mỗi quý.
- Alert 5xx > 5%/5 phút hoặc oldest queued > 120 s; metrics queue/lease/retry/429/token/image/cost/SMS.
- UI 360/390/768/1440 px, zoom 200%, keyboard/screen reader; mục tiêu WCAG 2.2 AA; UTC lưu trữ, Asia/Ho_Chi_Minh hiển thị.
- Bộ đánh giá tối thiểu đề xuất 200 ảnh có nhãn, tách tuning/evaluation; accuracy >= 85% trong phạm vi hỗ trợ, kèm coverage/unknown và chỉ số từng nhóm.
- Pilot 10 người dùng; mục tiêu >= 90% hoàn tất hồ sơ mẫu không hướng dẫn trực tiếp. KPI giảm hư 30% cần baseline/nhóm so sánh trước công bố.

## 8. Rủi ro, quyết định và release gate

| Rủi ro | Giảm thiểu | Người cần tham gia |
| --- | --- | --- |
| Rule/ảnh chưa có nguồn hoặc chưa duyệt | Chỉ seed DRAFT; sandbox có nhãn; chặn publication production | Chuyên gia đóng gói, chủ sản phẩm |
| Chưa chọn SMS/weather/route/model/budget | Adapter contract và stub dev; manual context; production configuration gate | Chủ sản phẩm, vận hành |
| Snapshot, quota hoặc kho sai khi đồng thời | DB constraints/transaction; outbox; unique key đúng phạm vi; concurrency tests | SE |
| Consent thu hồi sau enqueue | Kiểm lại ngay trước từng external call và khi đọc tài nguyên | SE, chủ policy |
| AI sai hoặc prompt injection | Schema/semantic validation, allowlist, suggestion riêng, USER precedence | SE, chuyên gia QA |
| Policy dữ liệu/SLA chưa chốt | Decision log, retention config và quy trình purge/backup/provider | Chủ sản phẩm, người phụ trách policy |

R0 chỉ được phát hành khi mọi FR P0 có evidence đạt, không lỗi chặn luồng/mất dữ liệu/quyền chéo/FAIL có thể chọn; mọi rule/template/sơ đồ production được duyệt; provider/model thật được kiểm; PDF/share/privacy đúng; restore và alert có bằng chứng. R1 cần thêm toàn bộ P1 được nghiệm thu. Không coi completion của tài liệu này là approval go-live.

## 9. Bước bắt đầu

1. Đọc `agent.md`, `.code/README.md`, `.code/decisions.md` và row FR của task.
2. Hoàn thiện M0 và xác nhận baseline kỹ thuật; khóa versions đã kiểm ở M1.
3. Giao slice đầu tiên: tài khoản đã OTP -> draft manual -> rule fixture dev -> hướng dẫn có trace và sơ đồ; sau đó mở rộng các failure path.
4. Sau M2 cập nhật ước lượng, quyết định mở và evidence. Không đánh dấu task xong bằng việc chỉ tạo mockup hoặc skeleton.

## 10. Bản website local đã triển khai — 2026-10-12

Theo yêu cầu tiếp theo của người dùng, đã tạo website có frontend và backend lưu dữ liệu, xử lý Rule Engine, versions/checklist/kho/PDF/share. Chạy theo [README.md](README.md); phạm vi/evidence/ADR tại [.code/implementation.md](.code/implementation.md). SQLite và job trong process là lựa chọn local reversible; không mặc định đổi baseline hoặc approval production.

Các milestone/FR/NFR vẫn cần nghiệm thu đúng acceptance và release gate phía trên. Quy tắc/sơ đồ hiện DRAFT; provider thật, policy, chuyên gia/admin đầy đủ và bằng chứng NFR chưa hoàn tất. Việc website chạy/test local không đóng toàn bộ R0/R1.
