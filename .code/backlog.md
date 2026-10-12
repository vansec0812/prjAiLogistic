# Backlog triển khai và bằng chứng

Mọi task ban đầu OPEN. Một task có thể chia nhiều PR; không tick done vì mới có file/skeleton. P0/P1 theo từng FR tại `traceability.md`; milestone chỉ lịch giao đề xuất.

| ID | Mốc / task | Phụ thuộc | Output và acceptance chính | FR/TC |
| --- | --- | --- | --- | --- |
| B-01 | M0: source/decision/ADR scope | Không | Quyết định stack, release slice, owner expert/policy/provider; gaps được ghi rõ | Toàn SRS |
| B-02 | M0: chuẩn bị nội dung chuyên môn | B-01 | Rule/template/illustration draft có nguồn; kế hoạch review/200 ảnh/pilot; không tự publish | 18,21,36,37,50; fixtures |
| B-03 | M1: bootstrap repo/dev services/CI | B-01 | Local web/API/worker/DB/Redis/storage; lockfile; build/lint/types; health; env example không secret | NFR-04,10,12 |
| B-04 | M1: schema/contracts/permission kernel | B-03 | Migration đầu, DTO/OpenAPI/errors, owner/role/scope middleware+domain checks, audit/outbox/dedup | NFR-05,11 |
| B-05 | M2: auth/OTP/reset/sessions | B-04 | Purpose/expiry/one-time/limits; no production mock; revoke sau reset/lock; last admin test | 01-04,34,43; TC-01,11 |
| B-06 | M2: draft/wizard/provenance | B-05 | Một cây/chậu; confirmed USER priority; expected version; refresh và 409 không mất draft | 07,10,12,14,16,44; TC-02,04 |
| B-07 | M2: private asset pipeline | B-04,B-06 | Quarantine/decode/normalize/EXIF/pixel/checksum/READY; access scope+TTL; camera fallback | 08,11,45; TC-02,09 |
| B-08 | M3: rule DSL/domain và fixtures | B-06,B-02 | Pure deterministic engine; min/max/boundary/conflict/fit/load/unknown; 5-8 steps/trace | 18,19,21,52,53; TC-03,06,07 |
| B-09 | M3: catalog/template/review/publish | B-08,B-07 | Approval+source+fixture+illustration refs trước publish; rollback pointer; referenced version bất biến | 35 tối thiểu,36,37; TC-11 |
| B-10 | M4: durable job/outbox/lease | B-04,B-08,B-09 | Idempotent create/replay; active-job dedup; lease/fencing; cancel/restart không double commit | 17,40; TC-05 |
| B-11 | M4: context adapters/manual | B-06 | Weather/ETA source/validity/coverage, manual priority; provider outage/horizon ->unknown | 15,43,51; TC-04 |
| B-12 | M4: consent/quota/usage primitives | B-04,B-10 | Purpose/revoke recheck; atomic reservation/settlement; AI budget không khóa manual | 38,39,48; TC-05,10 |
| B-13 | M4: Gemini vision | B-07,B-12 | Model configurable; schema+semantic+injection checks; one repair; suggestions riêng; provider file cleanup | 09,11,50,53; TC-02,06 |
| B-14 | M5: result/selection/checklist/history | B-08..B-13 | Trace; FAIL/STALE block server; WARN_ACK scoped; checklist/version/progress; history owner | 19,21,22,26,44,52; TC-07,08 |
| B-15 | M5: PDF/export/share | B-14,B-07 | Font Việt/render QA; snapshot pinned; dedup export; token hash/scope/expiry/revoke, no PII default | 24,45,49; TC-09 |
| B-16 | M5: admin/ops/AI quality | B-05,B-09,B-10,B-13 | Config secret refs; role limits; jobs metadata; usage/unknown/correction; minimal audit | 34,36-40,42 tối thiểu,43,50; TC-11,13 |
| B-17 | M6: performance/security/accessibility/restore | B-14..B-16 | NFR report workload/config/percentiles; cross-owner; chaos; restore timings; 360/768/1440 | NFR-01..15; TC-13,14 |
| B-18 | M6: provider/rule/model/pilot go-live gate | B-02,B-17 | Providers thật, rule/source approval, evaluation dataset, alert/runbooks, scope/terms/retention decision | TC-01..14 áp dụng R0 |
| B-19 | M7a: inventory+complete+reuse/feedback | B-14 | Completion header/multiline movement transaction; no negative stock; templates re-confirm; version feedback | 13,23,27,28,47; TC-07,08 |
| B-20 | M7a: notifications | B-10,B-19 | Event dedup, read/preferences; không gửi SMS nghiệp vụ | 29 |
| B-21 | M7b: profile/phone/privacy | B-05,B-07,B-12 | Phone current+new verification; reauth; private data export/purge/provider/backup lifecycle | 05,33,48; TC-10,12 |
| B-22 | M7b: CMS/catalog/reporting đầy đủ | B-09,B-16 | Published-only public; sanitize/CSV safety; editorial workflow; aggregated/report scope | 06,35,41,42; TC-11 |
| B-23 | M7b: support/expert | B-12,B-14,B-20 | Assignment+scope+consent mọi read; revoke; expert version reason/author; owner select | 30-32; TC-10 |
| B-24 | M7c: compare/chat/AI images | B-12,B-14,B-23 | <=3 engine alternatives; read-only chat; image separate job+review+fallback/consent/budget | 20,25,46; TC-06,07,10 |
| B-25 | M7: full-release regression và handoff | B-19..B-24 | Tất cả P1 đạt, flag gates; re-run rủi ro P0 bị tác động; runbooks và evidence complete | Toàn FR/NFR |

## Evidence cần bổ sung khi task được giao

Mỗi task giữ status OPEN/IN_PROGRESS/REVIEW/DONE hoặc BLOCKED có nguyên nhân, người xử lý và bước tiếp theo. Ghi PR/commit, test/report path, ngày kiểm, fixture/environment version và các limitation. DONE chỉ khi acceptance đạt và không còn dependency bắt buộc chưa giải quyết.

## Phụ thuộc P1 tối thiểu của R0

- FR-35: R0 cần catalog published có version; UI CRUD toàn diện ở R1.
- FR-42: R0 cần audit/metrics cho role/publish/config/job; dashboard/export báo cáo đầy đủ ở R1.
- FR-13: R0 cần input/snapshot vật tư của FR-12; kho tồn/movement đầy đủ ở R1.
- FR-23: R0 checklist FR-22 có progress/required-check gate; PACKED transaction và movement là R1. Không tạo complete endpoint giả thành công ở R0; UI tắt CTA P1.
- FR-06/41: R0 có landing/hướng dẫn đo cần thiết từ nội dung được duyệt; CMS/thư viện đầy đủ ở R1. Không hiển thị nav P1 chưa chạy.

## Nhịp làm việc cho một SE

Tuần đầu review M0/M1 và spike provider/export/rule contracts. Mỗi tuần demo slice thật, cập nhật decision log và estimated remaining days; giữ tối đa một slice lớn đang triển khai. Chuyên gia duyệt nội dung, chủ sản phẩm quyết policy/provider/budget, SE giữ chất lượng hệ thống. Chờ approval không ngăn phát triển dev fixtures/manual flow; chặn production publication tương ứng.
