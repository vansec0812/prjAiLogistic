# Chiến lược kiểm thử và nghiệm thu

Nguồn SRS p.109-113, NFR p.52-55. Các suite và mục tiêu dưới đây là kế hoạch, chưa được chạy vì workspace chưa có ứng dụng.

## Test pyramid theo rủi ro

- Domain/unit: Rule Engine, quantities/units, states, fit/load/conflict/trace, provenance/confirmation, eligibility. Test output/invariant nghiệp vụ, không test nội bộ helper để khóa implementation.
- Integration với PostgreSQL/Redis/storage thật trong test environment: transactions/constraints, owner/scope, idempotency, outbox/lease, reservation, multi-material completion, purge.
- Adapter contract: provider success/errors/timeout/blocked/schema/usage/webhook fixtures; riêng smoke test provider thật ở staging có quota, dữ liệu mẫu không PII.
- E2E: luồng manual chuẩn, AI assist, AI-off, error/offline/409/STALE, PDF/share/expert/privacy; test server rejection chứ không chỉ disabled button.
- Release evidence: load/accessibility/security/restore/model evaluation/pilot chuyên môn.

Chọn Vitest/Jest, Playwright và load tool sau bootstrap; hiện chưa có lệnh `npm test` hoặc test report. CI dự kiến lint/types/unit/contract, integration theo dependency services, critical E2E; staging chạy tải/restore/provider thật. Versions/commands phải được ghi khi code tồn tại.

## TC nguồn và gate

| TC | FR/NFR nguồn | Acceptance bắt buộc | Release |
| --- | --- | --- | --- |
| TC-01 | FR-01..04 | OTP dùng lại/hết hạn/sai purpose/cross-phone bị chặn; reset revoke phiên; chỉ một user ACTIVE | R0 |
| TC-02 | FR-07,08,10,11 | Camera denied/invalid MIME/oversize/AI unknown vẫn manual; refresh draft; 409 giữ edit | R0 |
| TC-03 | FR-12,18,19 | Hộp 25x25x40 không vừa bao hình 30x30x55 + padding; unknown load không READY giả | R0 |
| TC-04 | FR-15,16 | Weather error/expired/out-of-horizon ->unknown/manual/source; không bịa forecast | R0 |
| TC-05 | FR-17,39,40 | Replay same job; bounded retries; expired lease recover; không double side effect hoặc quota race | R0 |
| TC-06 | FR-18,19,21,46 | JSON/schema/semantic lỗi bị chặn; repair <=1; illustration lỗi có library fallback từng step | R0 fallback; R1 AI images |
| TC-07 | FR-20,26,27 | Sửa số đo ->STALE; old version nguyên; unknown price !=0; template phải confirm lại | R0 version; R1 compare/templates |
| TC-08 | FR-22,23 | Required checklist gate; double complete không trừ hai lần; insufficient stock rollback tất cả | R0 checklist; R1 completion |
| TC-09 | FR-24,45 | PDF đúng version/font Việt/no PII; cross-owner job/export/upload blocked; read TTL/share expiry | R0 |
| TC-10 | FR-30..32,48 | No consent no send; expert unassigned blocked; revoke scope; revision author/reason/new version | R0 AI consent; R1 expert |
| TC-11 | FR-34..38,41,42 | Member/admin separation; last admin protected; unapproved rules blocked; CMS XSS/CSV formula safe | R0 governance; R1 CMS/reporting |
| TC-12 | FR-33,45,48 | Data export owner; delete revoke/purge object/provider; backup policy; old URL behavior rõ | R1; R0 asset/consent gates |
| TC-13 | NFR-01..03,10 | 100 concurrent user workload/p95; timeout/503 degrade; web history/draft; metrics/alert/redaction | R0 và R1 |
| TC-14 | NFR-08,09,13,14 | 360/768/1440; keyboard/screen reader; locale/time; >=90% trên 10 pilot user hoàn tất mẫu | R0 và R1 |

## Fixtures bắt buộc

SRS p.112: nhiệt 9,9/10/25/25,1/32/32,1; chậu 14,9/15/29,9/30/50/50,1; cân 1,9/2/9,9/10/25/25,1. Kiểm không gaps/overlap theo draft ranges; fixture không chứng minh ngưỡng được duyệt chuyên môn.

Conflict: HIGH+nóng+long duration, lạnh/nóng min/max đồng thời, kín vs thông thoáng, priority/specificity tie. Kết quả precedence đã duyệt hoặc NEEDS_EXPERT; trace phải nêu conflict, không âm thầm drop rule.

Fit/load: mỗi axis box/padding/orientation; không gập/ép cây; known/unknown box max load, unknown material mass, exact limit và vượt limit; carrier orientation/size/weight. Missing/0 materials, allowed-purchase khác available; invalid unit; null price; box reused condition chưa kiểm.

Vision: blur/unknown/multiple materials/OCR outer-vs-inner label/text injection/malformed JSON/unsupported schema/invalid enum/evidence thiếu; AI không overwrite USER confirmed; unsupported plant group không tự suy rule.

Replay: cùng canonical snapshot + pinned versions -> cùng decision/trace (không so timestamp/IDs kỹ thuật). Rule/model đổi có regression report; old plan không mutate. Mọi action/warning/step truy nguyên rule/template/illustration version.

## Test bổ sung thiết kế, ký hiệu XT (không phải TC mới trong PDF)

| ID | Kịch bản cần kiểm |
| --- | --- |
| XT-AUTH | Cùng ID đổi owner/role cho case/upload/job/version/export/share/template/ticket; cache projection không lộ PII |
| XT-CONCURRENCY | Hai tab patch; same key different body 409; hai concurrent complete; nhiều vật tư/một completion; stock race; last-admin race |
| XT-JOB | Crash sau DB commit trước enqueue; sau provider response trước result commit; stale worker lease; cancel/revoke/delete lúc queued/running |
| XT-BUDGET | Nhiều user reserve sát cap; usage lỗi có phí; TTL không release khi call còn chạy; unknown cost reconciliation; manual queue không starve |
| XT-SHARE | Link pin version không đổi khi draft sửa; revoked/expired scope; raw-photo consent; export projection khác owner PDF; signed URL TTL giới hạn |
| XT-UI | WARN_ACK đúng warning/version; FAIL/STALE bypass API bị chặn; offline chưa lưu; 409 giữ user edit; no fake progress/demo KPI |
| XT-UPLOAD | MIME/magic mismatch, decompression bomb >30MP, >10MB, >12 ảnh/case, path/SSRF injection, EXIF geolocation removed |
| XT-PURGE | Worker cleanup retry; provider file failures; old signed URL expiry/proxy; backup rotation và tombstone áp lại sau restore |

## NFR evidence và workload

Load report ghi CPU/RAM/DB/worker concurrency/network/browser, dataset size, arrival/concurrency profile, warm-up/run length, error rate và p50/p95/p99 theo endpoint. NFR CRUD 100 user không có nghĩa 100 Gemini call đồng thời. Tách upload, vision, manual plan và AI-image timing; không gộp thời gian đo/cân user với backend p95.

Targets: CRUD p95 <800ms; LCP <=2,5s/CLS <=0,1; vision p95 <=15s, timeout 20s/call, total job <=180s; plan library <=120s. Alert 5xx >5%/5m hoặc oldest queued >120s. Chứng minh alert thực sự tới kênh vận hành được cấu hình; không chỉ có rule trong file.

Restore staging: backup/version + time begin/end + checksum/sample queries + object restore + RPO/RTO đạt 24h/4h + replay delete tombstones + worker/schema compatibility. Không ghi đè production để thử restore.

Accessibility: keyboard/focus/modal return, aria-live, linked errors, alt illustrations, contrast, touch >=44px, zoom200%, camera/file fallback. Kiểm browser hai major mới nhất tại nghiệm thu, không đóng đinh phiên bản trong plan.

AI evaluation: tối thiểu đề xuất 200 ảnh được chuyên gia label và có quyền dùng; tuning/eval tách biệt. Report accuracy >=85% theo support scope, coverage/unknown/correction theo nhóm/trường; self-confidence không là accuracy. Model/prompts/schema/pricing version pin trong report. Pilot 10 người, đo completion usability; safety trial có rule/vật tư được duyệt riêng.

## Definition of release done

Mỗi P0 có mapping và evidence; không lỗi mất dữ liệu/authorization/FAIL selectable; approval nội dung và providers thật; manual AI-off; PDF/share scope đúng; restore/alert; policy đã quyết. Full R1 thêm mọi P1 và regression phần P0 bị tác động. Review evidence giữ metadata cần thiết, không raw OTP/secret/ảnh người dùng chưa consent.

## Kiểm flow nhận diện/AI và deploy tách — 18/10/2026

Unit/API: plant-recognition giữ manual/late edits/confirmed, chỉ readings đúng unit/origin; guidance REFERENCE/issue/revision, parser phủ định và stale events; pronunciation/WAV; deployment fail-closed. Browser live dùng camera fake + nhận dạng/TTS/provider giả, private upload thực, kết quả/chụp/voice/done một lần/lỗi/resume/stale/fallback/cleanup và responsive. Workflow test cũ kiểm full plan/kho/export riêng.

test:proxy kiểm external beforeFiles/body 3 MiB/cookie/CSRF/private cache/no frontend DB. test:container dùng volume riêng, seed user chỉ fixture test, kiểm production auth/ảnh/PDF/reference/engine gate/restart/idle job recovery và cleanup. Hai bài này không thay Vercel deployment/backup restore hoặc provider thật.

Provider opt-in qua RUN_REAL_GEMINI=1 và playwright.gemini.config.ts: Vision schema/không bịa số trong ảnh trắng; blank frame guard trước quota; checkpoint ảnh minh họa không đo accuracy; RAG pin context/citations; TTS PCM decode/playback. Không bật trong npm test/test:e2e mặc định. Kết quả chạy và giới hạn ở implementation.md; chưa nhãn ảnh thật/micro xưởng/chuyên môn/pilot.
