# Hợp đồng API logic

Nguồn SRS p.45-51. Prefix `/api/v1`, JSON UTF-8. Các endpoint dưới đây chưa tồn tại; M1/M2 sẽ viết OpenAPI/schema cụ thể và generate client types. Quyền kiểm server và projection DTO riêng cho từng scope.

## Quy ước

Success: `{data, meta:{request_id, version?}}`. Error: `{error:{code,message,field_errors?,retry_after?},request_id}`; message tiếng Việt, không exception/provider raw response. 204 không body. Retry-After header với 429, đồng bộ giá trị body.

HTTP: 200/201/202/204 thành công; 401 session không hợp lệ; 403 thiếu quyền chung; 404 tài nguyên không tồn tại hoặc cần ẩn; 409 version/idempotency/tồn conflict; 413 kích thước; 422 semantic validation; 429 quota/queue; 503 dependency tạm lỗi. Phân biệt job business outcome NEEDS_INPUT/NEEDS_EXPERT với FAILED provider.

Cursor page_size mặc định 20, tối đa 100; sort/filter allowlist; query parameterized. Session cookie cùng origin Secure/HttpOnly/SameSite + CSRF; không token trong localStorage. Nội dung public mới được cache public; private/share responses không được CDN cache bỏ qua authorization/expiry.

Mutation draft/config dùng `expected_version` hoặc `If-Match`, chọn một convention nhất quán trong OpenAPI. Idempotency-Key cho plans/exports/complete; scope owner + endpoint + key, TTL đề xuất >=24 h. Same key + canonical body -> cùng resource/result; different body -> 409 `IDEMPOTENCY_CONFLICT`. Owner check trước cả lookup replay. Complete còn unique business key dài hạn sau TTL.

## Endpoint catalog

| Group/endpoints | Quyền | FR | Hợp đồng và gate |
| --- | --- | --- | --- |
| POST `/auth/register` | Guest | 01 | name/phone/username/password/terms_version -> 202 challenge; không active session |
| POST `/auth/otp/send`, `/auth/otp/verify` | Challenge đúng purpose | 02 | challenge_id/code/purpose; consume một lần; rate limits; expired/wrong 422 |
| POST `/auth/login`, `/auth/logout` | Guest/user | 03 | Login cookie + minimal profile; logout revoke -> 204; lỗi chung |
| POST `/auth/password/reset/request`, `/auth/password/reset/confirm` | Guest/challenge | 04 | Request generic response; reset purpose OTP; one-use reset authorization; revoke sessions |
| GET/PATCH `/me`, `/me/preferences`; phone challenge routes cần bổ sung | User | 05,29 | Allowlist fields/version; không role; đổi phone xác minh cũ+mới |
| GET `/me/sessions`, DELETE `/me/sessions/{id}` | Owner | 03 | Không token hash; chỉ session thuộc mình |
| POST/GET `/cases`, GET/PATCH/DELETE `/cases/{id}` | Active member/owner | 07,26 | Draft version lock; soft delete/cancel; history owner scoped |
| POST `/uploads/presign`, `/uploads/complete` | Owner | 08,11,45 | Presign -> quarantine; complete kiểm bytes/size/checksum/normalize rồi READY |
| GET `/uploads/{id}/access`, DELETE `/uploads/{id}` | Owner hoặc assigned scope | 45 | Signed read <=5 phút sau quyền; purge async không public URL |
| POST `/cases/{id}/plant-analysis`, `/cases/{id}/material-analysis` | Owner + AI consent | 09,11 | READY uploads ->202 job; suggestions riêng không overwrite USER |
| GET/POST `/materials`, GET/PATCH `/materials/{id}` | Owner | 12,13 | Schema category/unit; price nullable; stock/version; archive route cần chốt |
| GET `/weather/forecast`, POST `/cases/{id}/weather` | Owner | 15,51 | Region/date/source/time/coverage; confirm manual/API snapshot |
| POST `/cases/{id}/plans` | Owner | 16-18 | input_version/preferences/use_ai_images/consent?; idempotent ->202 job |
| GET `/jobs/{id}`, POST `/jobs/{id}/cancel` | Owner; operator metadata scope | 17,40 | status/stage/estimate/error/retry; cancel best-effort |
| GET `/cases/{id}/versions`, POST `/cases/{id}/selection` | Owner | 20,26 | version/alternative/hash; FAIL/STALE blocked; warning acknowledgment contract cần bổ sung |
| PATCH `/cases/{id}/checklist`, POST `/cases/{id}/complete` | Owner | 22,23 | step/version checks; actual package + usage; idempotent completion transaction |
| POST `/cases/{id}/exports`, GET `/exports/{id}` | Owner | 24 | 202 async; pin version/options; private short-lived read; Unicode PDF |
| POST `/cases/{id}/chat` | Owner + chat consent/quota | 25 | Message <=2000 chars, version ID; chỉ đọc context, không mutation tool |
| POST/PATCH `/templates/{id?}`, POST/PATCH `/cases/{id}/feedback` | Owner | 27,28 | Reconfirm copied inputs; feedback used version/rating 1..5/private images |
| POST/GET `/tickets`, GET/POST `/tickets/{id}/messages` | Owner/assigned expert đúng scope | 30,31 | Consent/shared scope; body <=4000; recheck mọi read/attachment |
| POST `/tickets/{id}/expert-revisions` | Assigned expert đúng consent | 32 | base_version/changes/reason/checks -> new version; owner select riêng |
| GET/PATCH `/notifications/{id?}` | Owner | 29 | Cursor/read; dedup event_id; không SMS nghiệp vụ |
| POST/GET `/me/data-requests` | Owner reauthenticated | 33 | EXPORT/DELETE; 202; session revoke/purge policy; download scope |
| GET `/articles`, `/articles/{slug}`, `/catalogs` | Guest | 06,35,36,41 | Published only; no personal data; ETag public |
| Admin CRUD `/admin/users`, `/admin/catalogs`, `/admin/rules`, `/admin/articles` | Role/action-specific | 34-37,41 | Review/publish/version/reauth/audit; expert approval for safety; last admin protection |
| GET/POST `/admin/ai/jobs`, `/admin/ai/settings`, `/admin/ai/usage` | Admin/operator action scope | 38-40,42 | Redacted metadata; settings only admin, secret reference; retry reason/audit |
| POST `/cases/{id}/shares`, DELETE `/shares/{token_id}` | Owner | 49 | Pin version/scope/expiry, token returned once; raw-photo consent riêng |
| GET `/shared/{token}` | Bearer còn hạn/không revoked | 49 | Scope-only DTO; no edit/complete; expired/revoked ->404 |
| GET `/admin/ai/quality` | Admin | 50 | Corrections/unknown vs measured accuracy, model/prompt version |
| POST `/webhooks/sms` | Signed provider webhook | 43 | Signature/timestamp/replay event; delivered != verified |

Các ký hiệu `{id?}`, CRUD và routes dạng nhóm là logic SRS, không cú pháp router/OpenAPI thực. Tách thành operation IDs cụ thể trước code. Consent grant/revoke, phone change, archive, publish/approve, job retry và shipment update cần endpoint/action schema riêng ở M1; không suy diễn generic PATCH được phép thay mọi field.

## Ví dụ kế hoạch manual

```http
POST /api/v1/cases/{case_id}/plans
Idempotency-Key: {random_client_key}
Content-Type: application/json
```

```json
{"input_version":7,"preferences":{"priority":"SAFETY"},"use_ai_images":false}
```

Không cần AI consent vì không gọi Gemini. Server pin versions, tạo job/snapshot/outbox trong transaction; 202 trả job ID. Request hợp lệ không có nghĩa plan chắc PASS.

```json
{"data":{"job_id":"example-job","status":"QUEUED"},"meta":{"request_id":"example-request"}}
```

```json
{"error":{"code":"INPUT_INCOMPLETE","message":"Cần xác nhận khối lượng cây và chậu","field_errors":{"plant.gross_weight_kg":"Nhập số cân thực tế"}},"request_id":"example-request"}
```

## Contract gaps cần giải quyết trước implementation

- Reset: FR-04 cần token one-time <=10 phút nhưng API mẫu gộp OTP+new_password; chọn flow two-step verify->reset token hoặc authorization atomically one-time tương đương, ghi ADR/schema.
- WARN_ACK: thêm warning IDs và version-bound acknowledgment, không một boolean chung bypass tất cả.
- Plan outcome: thống nhất `NEED_INPUT` field status với `NEEDS_INPUT` case/job; thêm NEEDS_EXPERT ở job result, không âm thầm sửa enum source.
- Share manager UI-26 và recipient UI-42 cùng route mẫu: owner dialog/route riêng; `/shared/:token` chỉ recipient public.
- Checklist PATCH cần selection/version ID, draft/job đầu vào có hash/reference rõ; error codes ổn định được test.
- Polling baseline cho một SE; SSE chỉ thêm nếu cần, phải auth/reconnect/current status; không progress % giả.
- SMS challenge không lộ phone/account; low-entropy OTP hash cần secret pepper/HMAC và rate limit được review, không chỉ hash không khóa.

Version contract khi đổi field/enum/schema; fixtures cho adapter errors/schema; không giữ API key trong DTO. Bằng chứng contract gồm OpenAPI validate, integration tests quyền và generated-client build sau bootstrap.

## Extension local — 2026-10-15

Base path `/api/v1`, response `{data,meta.request_id}`; private/no-store, session/owner và CSRF cho mutation theo implementation hiện hành (không thay toàn bộ contract đề xuất).

| Endpoint | Contract thực |
| --- | --- |
| `GET /cases/:id/readiness` | `{ready,done,total,items,missing}`; owner, 8 kiểm input, không là approval safety |
| `GET /knowledge/sources` | `{version,sources,trainingStatus:NOT_FINE_TUNED}`; session, không raw document/PII |
| `GET /knowledge/search?q=&scope=` | scope `POTTED_PLANTS` mặc định, `CACTUS`, `MARITIME`; ghi chú đúng scope/READ, tối đa 5 mặc định |
| `POST /knowledge/answers` | `{question,consent_id,scope?}`, Idempotency-Key; purpose AI_KNOWLEDGE, config/rate/quota; 202 `{job_id}` |
| `POST /cases/:id/exports` | `{version_id,format?}`, format PDF mặc định/MARKDOWN/JSON/BUNDLE; Idempotency-Key, owner/pinned version |
| `GET /exports/:jobId` | File private; PDF `.pdf`, Markdown `.md`, JSON `.json`, ZIP `.zip`; không gồm ảnh private/account |

Consent enum thêm `AI_KNOWLEDGE`, notice `local-v2`. Job enum thêm KNOWLEDGE, pin `question,knowledgeVersion,knowledgeContext,consentId`; output riêng read-only. Citation/schema lỗi là AI_INVALID_CITATION/AI_INVALID_OUTPUT; missing pinned context AI_CONTEXT_MISSING; provider chưa cấu hình AI_UNAVAILABLE/AI_CONFIG; consent bị thu hồi/wrong purpose chặn trước call. Chưa có OpenAPI/generated client formal cho extension này.

PATCH case cùng name/input/expected version là no-op (version/status/selection giữ nguyên). Đổi tên riêng tăng case version, giữ selection/status nếu inputHash không đổi. Đổi input kỹ thuật vẫn STALE. Date gửi không hợp lệ/quá khứ bị từ chối generate. Đầu vào thiếu vẫn có diagnostic từ server; readiness UI giúp sửa trước.

## Phiên hồ sơ & camera — 18/10/2026

Contract chi tiết tại [GUIDED_PACKING.md](../GUIDED_PACKING.md). GET/POST `cases/:id/guidance`; PATCH `cases/:id/guidance/:session`. POST cần Idempotency-Key và case_version; PATCH pin expected_revision/step_id, action CONFIRM/MANUAL/SKIP, method BUTTON/VOICE và manual_checked=true. Scope chủ hồ sơ + session phải khớp. Input hash/SOP version thay đổi trả 409 GUIDANCE_STALE/SOP_VERSION_MISMATCH; revision/bước đổi trả VERSION_CONFLICT/CHECKPOINT_MISMATCH; ảnh chưa đạt hoặc kiểm tay thiếu lý do trả 422 CHECK_REQUIRED. Terminal case và production chưa duyệt chặn thực hiện.

Checkpoint API thêm case_id/session_id/session_revision (cùng có hoặc cùng vắng để tương thích API thử cũ). Bound call recheck trước provider và transaction lưu, chỉ kết quả server validate mới dùng để chuyển. Không có trường client-supplied AI result ở PATCH. Retry xóa pass cũ; stale response không ghi vào bước mới. Phiên kết thúc không mutate case status/plan/completion/material movements. Knowledge thêm scope NURSERY và access METADATA_ONLY; metadata không tham gia technical retrieval.
