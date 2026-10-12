# Mô hình dữ liệu và tính toàn vẹn

Nguồn SRS p.10-13, 34-38, 40-44, 45, 54-55. Đây là thiết kế logic cần hiện thực bằng migration, chưa có DDL chạy thực tế.

## Thực thể

| Nhóm | Thực thể và dữ liệu chính | Constraint/index cần thiết |
| --- | --- | --- |
| Identity | users, user_roles, sessions, otp_challenges | Unique normalized username/phone; token/OTP hash; expiry/purpose/used; session revocation |
| Consent | consents, notice_versions | Purpose, notice_version, accepted/revoked_at; append history; jobs pin consent ref |
| Case | packing_cases, input_snapshots, plant_inputs | owner FK; draft_version; active selection; unique case + input_version |
| Asset | uploads, illustration_versions | Private key, checksum/mime/bytes/pixel/status/purpose; owner/case; published art refs |
| Material | materials, material_snapshots | Owner, specs/schema_version, unit, stock_qty, unit_price nullable, condition/version |
| Context | shipment_snapshots, weather_snapshots | Region/date/mode/duration, limits/orientation, provider/time/validity/coverage/source |
| Job | jobs, job_calls, job_results, outbox_events | Type, input_hash/version, deadline, lease/fencing, attempts, correlation; durable result |
| Quota | quota_reservations, ai_usage, pricing_versions | Reservation TTL/status, concurrency, usage actual/estimated/unknown, currency/effective_at |
| Plan | plan_versions, alternatives, plan_steps, rule_trace | Unique case + version_no; pinned versions; steps order unique; PASS/WARN_ACK/FAIL |
| Selection | plan_selections, warning_acknowledgments | One active selection/case; version/alternative/input_hash; warning code/version/actor/time |
| Packing | checklist_items, completions, inventory_movements | Checklist đúng selection/step; completion unique case + plan version; movement unique completion + material |
| Share/export | share_links, exports | Token hash unique; pin version/scope; expiry/revoke; export owner + projection hash |
| Reuse/results | templates, feedback, shipment_events | Template reusable inputs; feedback used_version; handoff/receipt do owner khai báo |
| Support | tickets, ticket_messages, expert_revisions | Owner/assigned expert/shared_scope/consent; revision base version/author/reason |
| Content/ops | catalog_versions, rule_versions, articles, faq, notifications, settings, audit_events, data_requests | Published workflow; unique user + event_id notification; secret_ref only; audit append-only |
| Dedup | idempotency_records, webhook_events | Unique owner + endpoint + key; request_hash/response; unique provider + event_id |

`jobs` là tên đề xuất thay `ai_jobs` trong SRS vì PLAN/EXPORT/manual không tiêu thụ AI. `input_snapshots`, `completions`, `job_calls`, `outbox_events`, selections và acknowledgments là bổ sung thiết kế để thực thi invariants, không FR mới.

## Provenance và số liệu

Mỗi giá trị cần xác nhận có `{value, unit, source, evidence_ref, observed_at, confirmation_status, confirmed_by, confirmed_at}`. Sources input: USER/AI/CATALOG/API; EXPERT là nguồn bản sửa theo SRS p.44, không được dùng để ghi đè số đo của owner.

- Cm/kg và tiền dùng decimal; numeric unknown = null + trạng thái, không chuỗi `unknown` và không 0. Money có currency VNĐ; cost_completeness FULL/PARTIAL/UNKNOWN; giữ known subtotal khi thiếu giá, không gọi đó là tổng đầy đủ.
- Chiều cao tổng bao gồm chậu; hình chậu tròn hoặc chữ nhật có schema riêng; bao hình ở tư thế đã xác nhận. Khoảng đệm đến từ rule có nguồn.
- Unit conversion phải có mapping đã kiểm; không tự quy đổi cuộn sang mét khi không biết chiều dài. Integer cho cái/hộp; decimal cho m/kg; quantity >= 0.
- Min <= max, duration > 0, số đo/cân > 0; giới hạn trên configurable theo phạm vi hỗ trợ. Date/time UTC; UI Asia/Ho_Chi_Minh. Departure cũ hợp lệ trong lịch sử, bị chặn khi tạo yêu cầu vận chuyển mới.
- Box `inner_length/width/height_cm`, `max_load_kg`, `unit_weight_kg` có source. Tổng tải bao gồm cây/chậu và vật tư; thành phần unknown khiến tổng là ước tính, chưa đủ xác nhận tải trọng.

## Snapshot, hash và version

Canonical snapshot gồm inputs đã xác nhận, vật tư available/allowed purchase, shipment/weather source+validity, safety-relevant preference, versions rule/catalog/template/illustration, engine/schema version. Thuật toán canonicalization có version, chuẩn hóa decimal/unit, thứ tự ổn định, bỏ trường volatile không ảnh hưởng quyết định; hashing server dùng SHA-256.

Tách `input_hash` của dữ liệu người dùng khỏi `execution_fingerprint` gồm pinned rule/catalog/template/engine versions để diễn giải replay và active-job dedup. Chốt field list/canonicalization bằng fixtures ở M3. Không dùng timestamp UI hoặc raw upload URL ngắn hạn làm hash safety.

`plan_versions` và các step/trace/alternative đã xuất bản bất biến. `STALE` là eligibility flag suy từ current input hash khác version snapshot, không mutation decision content. Draft sửa dữ liệu safety tạo input version mới; job cũ commit kết quả lịch sử, không auto-activate. Rule pointer mới không tự sửa hoặc đánh STALE bản lịch sử; quy trình xử lý rule bị rút vì safety cần quyết định riêng D-11.

## Hoàn tất và multi-material movement

SRS p.42 ghi `inventory_movements.completion_key unique`; nếu một completion có nhiều dòng vật tư thì constraint đó không đáp ứng. Đề xuất:

1. Header `completions`: unique `(case_id, plan_version_id)` và idempotency request ref. Mỗi completion có nhiều movement.
2. Chuẩn hóa/gộp actual usage theo material ID/unit trước mutation; unique `(completion_id, material_id)` trên dòng trừ kho, hoặc `(completion_id, material_id, movement_type)` nếu cần nhiều loại movement.
3. Transaction lock case/selection, kiểm STALE/status/required checks/actual fit-load, lock material IDs theo thứ tự ổn định, kiểm unit/available quantity, ghi completion + movements + PACKED + outbox.
4. Bất kỳ validation/tồn lỗi thì rollback toàn bộ; retry trả completion đã có. Không giữ lock xuyên provider call. Undo có movement đối ứng và reason, không xóa dòng gốc.

Constraint và gate này vẫn cần review khi M0/M7 thiết kế DDL. Không unique riêng từng completion key trên mỗi movement; không trừ kho bằng callback AI.

## State machines

- Account: PENDING_PHONE -> ACTIVE -> LOCKED hoặc DELETE_PENDING -> DELETED; lock/delete revoke sessions.
- Case: DRAFT -> NEEDS_INPUT/READY_TO_PLAN -> PLANNING -> PLAN_READY/NEEDS_INPUT/NEEDS_EXPERT -> PACKING -> PACKED -> SHIPPED -> RECEIVED.
- Job: QUEUED -> RUNNING -> SUCCEEDED/FAILED/NEEDS_INPUT; RUNNING -> RETRY_WAIT -> QUEUED; cancellation best-effort -> CANCEL_REQUESTED -> CANCELLED.
- Plan alternative: PASS/WARN_ACK/FAIL; STALE flag độc lập. Warning hard không có quyền acknowledge bypass.
- Rule/CMS: DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED. Published/referenced không chỉnh sửa; version mới để đổi.
- Ticket: OPEN -> ASSIGNED -> WAITING_USER/RESOLVED -> CLOSED; reopen theo cấu hình đề xuất 7 ngày.

Mỗi transition validate server và audit/event khi cần. Không generic PATCH status tự do. Draft thay đổi trong PACKING phải chặn completion cho đến khi có plan/checklist hợp lệ mới; sau PACKED giữ used version và actual snapshot, không viết lại lịch sử.

## Index, migration và lifecycle

Query indexes tối thiểu: cases `(owner_id, updated_at, id)`; jobs `(status, lease_until)` và `(owner_id, created_at, id)`; versions `(case_id, version_no)`; uploads `(owner_id, case_id, status)`; tickets `(assigned_expert_id, status, created_at)`; consent `(user_id, purpose, revoked_at)`; share token hash; outbox `(dispatched_at, created_at)`.

Active-job uniqueness cho cùng owner/case/type/input hash phải enforced DB, không chỉ check-then-insert application. Sử dụng partial unique index hoặc active-job slot transaction được review khi chọn DB. Authorization luôn nằm trong query/projection; index không thay quyền.

Migration expand/contract, backfill có checkpoint; preserve old worker compatibility. Rule/template refs có FK/version immutable và archive thay delete. Account purge cần orchestration xóa DB/storage/provider refs, revoke sessions/shares/signed URL issuance, cancellation và retry cleanup. Metadata audit phải tối giản/ẩn PII theo policy.

Retention đề xuất SRS p.44: orphan uploads 24 h; technical log 30 ngày; audit tối thiểu 180 ngày; active data delete mục tiêu 7 ngày; backup vòng 30 ngày. Các thời hạn này **chưa là policy đã chốt**. Signed URL đã phát hành có thể còn đọc trong TTL <= 5 phút; nếu cần thu hồi tức thì phải dùng proxy đọc/current authorization, xem D-10.
