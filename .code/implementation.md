# Bằng chứng triển khai website local — 2026-10-12

Đây là bản ghi bổ sung cho task xây website theo PDF/MD, không thay đổi nội dung SRS hoặc xác nhận R0/R1 đã phát hành. Nguồn yêu cầu và trang vẫn nằm tại `source-index.md`/`traceability.md`; các quyết định còn OPEN tiếp tục có hiệu lực.

## Vercel và dữ liệu cloud — 21/10/2026

Theo yêu cầu tự triển khai: tạo Neon project riêng `plantcare-production` (Free/Singapore), kết nối Production, giữ dữ liệu local và env người dùng. Runtime Vercel Node24/`sin1` dùng PostgreSQL cho hồ sơ/session/jobs/private bytes. Adapter synchronous giới hạn tại MVP, transaction cùng connection/TLS/advisory lock; `after` và lease thay timer trên Functions. PDF có Noto Sans/OFL đi kèm. Đã phát hiện và sửa lỗi bundler đổi đường dẫn worker; kiểm file tracing phải loại `.data`, env và artifacts khỏi output.

Kiểm thực trước deploy: 184 unit PASS; 4 PostgreSQL integration PASS với DB Neon thật; 6 workflow + 10 MVP + 15 camera/voice E2E PASS (provider/camera trong E2E là mock). Build production/TypeScript đã qua. HTTP smoke trên bản production đóng gói và Neon thật đã PASS auth/cookie/CSRF, tạo hồ sơ, owner isolation, private upload/read; không gọi AI trong lần này. Artifact kiểm đủ runtime/worker/pg/font và không còn tham chiếu `.data`/env sau postbuild. URL thật kiểm bằng `scripts/check-vercel.mjs` sau deployment; `--ai` kiểm thêm một Vision job thật qua `after`, giữ usage tính quota khi dọn fixture. SMS thật, rule/SOP approval, HA/load/restore và worker nền liên tục chưa có evidence; không có fake OTP hoặc tự publish cấu hình để làm smoke qua. Cấu hình/rollback tại [VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md).

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

## Nâng cấp flow, report và RAG — 2026-10-15

Yêu cầu bổ sung của người dùng: tối ưu flow, đầu ra chi tiết, ảnh giống ảnh chụp, tìm hiểu nguồn và chọn RAG trước. Phạm vi liên quan FR-10..19, FR-21..24, FR-26, FR-48/53 và TC-02/03/08/09/10/12; không đóng toàn bộ acceptance hoặc FR chat/alternatives.

- Readiness trước generate: 8 kiểm, link đúng bước còn thiếu, giá unknown không chặn; server chặn ngày gửi không hợp lệ/quá khứ. Navigation giữ trạng thái đang chuyển để tránh bấm tiếp liên tiếp cùng bước.
- PATCH không đổi dữ liệu không tạo revision hoặc mất selection. Đổi tên riêng giữ phương án nếu input hash không đổi; input kỹ thuật thay đổi vẫn STALE.
- Report packing-report-v2: bill/thành tiền, input-specific preflight, assumptions, thao tác/checkpoints/stop conditions/tools/material IDs, handover/recipient checks, sources/scope/limitations. Rule physics vẫn draft-local-1, chưa đổi các ngưỡng chuyên môn.
- PDF Unicode, Markdown, JSON provenance và ZIP chứa cả tài liệu + ảnh/fallback; owner/CSRF/idempotency/private storage. Share projection bỏ account/raw snapshot/private uploads, generic material names; trang chia sẻ giữ nhãn ảnh AI và thao tác chi tiết.
- 7 ảnh AI mới, 3 ảnh đã sửa qua ImageGen để kiểm bố cục hộp/kiện; PNG gốc, WebP tổng khoảng 1,39 MB, hash/provenance trong manifest. FOLIAGE dùng cây mẫu trầu bà; nhóm khác giữ SVG. PDF embed JPEG, mẫu 11 trang khoảng 1,03 MB. Ảnh không là chứng cứ checklist hoặc approval kỹ thuật.
- `/app/knowledge`: 11 metadata nguồn, 11 claims, lexical retrieval tách cây chậu/xương rồng/container; abstract/metadata và 16 video chưa đọc excluded khỏi claims. Readiness/report không cần external provider.
- Gemini RAG read-only có AI_KNOWLEDGE consent riêng, pinned context/version, idempotency, quota/rate/timeout và strict schema/citation membership. Citation đúng ID không bảo đảm semantic truth; server giữ needs_expert cho corpus UNREVIEWED. Adapter chưa gọi model thật.

Evidence ngày 2026-10-15:

| Check | Kết quả |
| --- | --- |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd test` | 31 test PASS, trong đó một test chạy 12 ca retrieval và lưu output/qa/retrieval-eval.json |
| `npm.cmd run test:e2e` | 6 suites PASS, thêm ZIP thực/private owner, no-op save, readiness, purpose consent và UI tri thức mobile/desktop |
| `npm.cmd run test:e2e -- --grep "pinned share"` | PASS sau cập nhật trang chia sẻ: nhãn AI + ba thao tác nhìn thấy, revoke/private export/ZIP |
| `npm.cmd run build` | PASS; fix asset tracing để chỉ scope public, bản cuối không có warning toàn project |
| `npm.cmd run test:production` | PASS: dev auth disabled, private API 401, storage 404, CSP không unsafe-eval |
| PDF/layout | Render 11 trang bằng PyMuPDF, kiểm từng trang: Unicode/6 bước/ảnh/cảnh báo/bill/trace/nguồn, không cắt/chồng chữ |

Research và trạng thái access/license ở [../research/README.md](../research/README.md). Evaluation mới là regression kỹ thuật do SE soạn; chưa chuyên gia duyệt/held-out benchmark. Chưa có metric model accuracy, giảm hư, giảm chi phí đối chứng, provider integration, hoặc approval go-live.

## Tích hợp dev-nam và kiểm Vercel — 18/10/2026

Gộp `origin/dev-nam` tại `2dd69b5` (SOP/camera/voice) vào develop, giữ bản RAG/report `cadc883`. Ba conflict `.code/decisions.md`, `components/app.tsx`, `server/api.ts` được giải quyết bằng cách giữ cả hai luồng; không bỏ features cũ hoặc đổi rule/SOP approval.

Default Playwright chỉ chạy workflow port 3001; `test:e2e:live` chạy SOP port 3107; provider thật vẫn opt-in riêng. Tách outputDir workflow/live/gemini để tránh hai runner xóa trace của nhau. Camera/voice có ngân sách test 90 giây cho cold dev compilation Windows, giữ assertion nghiệp vụ và timeout provider.

Evidence trên tree đã gộp: typecheck PASS, 98 unit/regression tests PASS, production build PASS và production smoke PASS. Workflow: 5 ca PASS ở lượt đầu; export/share có lỗi artifact bị runner khác xóa, chạy lại riêng sau tách outputDir PASS (bao gồm PDF/ZIP thực và cross-owner). SOP: 9 ca PASS ở lượt đầu; ca đầu bị timeout 30 giây tại page.goto('/') khi cold compile, đang kiểm lại bằng cấu hình 90 giây. Đây là kiểm phần mềm bằng camera/voice/provider giả lập; không gọi Gemini thật, không đo độ đúng chuyên môn hoặc đạt performance production.

Không tạo deployment Vercel. SQLite/local uploads/exports/OTP secret, worker trong process và font theo máy là các dependency chưa tương thích deployment serverless nguyên trạng. Hướng cấu hình build, nguồn Vercel và điều kiện chuyển đổi tại [../VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md); không tuyên bố toàn bộ backend đã sẵn sàng production trên Vercel.

## Hồ sơ & camera, nguồn mới và xác nhận tiếng Việt — 18/10/2026

Entry `/app/new` tạo case và mở `/app/cases/:id/guide`; camera preview bật/bật lại độc lập, CTA mới xin quyền native nhưng không tự bật micro/gửi ảnh. Một phiên private pin owner/case/inputHash/SOP version/revision, lưu kết quả server validate và xác nhận BUTTON/VOICE. Refresh khôi phục tiến độ với media/consent tắt. Bước manual nhận self-report; visual không chuyển vì lời đồng ý nếu thiếu/failed/unverifiable, trừ kiểm tay explicit có lý do. Không mutate plan/case completion/kho. Giữ failed image khi override, xóa pass cũ trước recheck và từ chối late result.

Tri thức v3: 19 sources/19 claims ngắn, 16 ca retrieval; nguồn metadata-only không tạo claim. Thêm nhánh cây chậu FedEx 5 bước (tổng 7 nhánh/40 bước), chú giải AmericanHort/VBN/USDA trong SOP; FAO scope NURSERY riêng. Sáu SOP cũ giữ nguyên version. Hai giáo trình chỉ metadata, FedEx Canada mới đọc text/chưa kiểm hình; toàn bộ nguồn/rights/candidate UNREVIEWED/NOT_CONFIRMED. Không fine-tune, nhập bảng nhiệt hoặc copy/index toàn văn.

Tích hợp thêm origin/dev-nam b920625 qua merge với feature commit 6233016. Conflict README, VOICE_COMMANDS, live-packing component/hook/schema/parser giữ luồng private theo hồ sơ mới; narration và guidedDecision của dev-nam được dùng với guard đúng checkpoint, thêm compatibility packingCommand. Những ghi chú cũ về controller RAM/nút Bắt đầu được thay bởi flow tại ../GUIDED_PACKING.md. Lời đọc giữ speech_vi theo catalog; nghe mẫu đọc bước hiện tại. Không bỏ RAG/report/ảnh photoreal đã có.

| Check thực chạy | Kết quả |
| --- | --- |
| `npm run typecheck` | PASS sau tích hợp b920625 |
| `npm test` | 130 tests, 11 files PASS; gồm DB owner/stale/revision/replay/override/no inventory và 16 ca lexical retrieval |
| `npm run test:e2e:live` | 12/12 PASS trên tree đã giải conflict, camera/voice/provider giả lập; 3.5 phút gồm cold compilation |
| `npm run test:e2e` | 6/6 PASS trước merge bổ sung narration/guard; các route/domain workflow không đổi bởi merge này |
| `npm run build -- --webpack` | PASS trên tree tích hợp cuối |
| `npm run test:production` | PASS trên build cuối: dev auth 404, private API 401, storage 404, CSP không unsafe-eval |
| Preview/layout | HTTP 200 `/app/new` ở loopback; mở panel qua open_in_codex (queued); xem screenshot desktop/mobile 390px, không overflow. Artifacts ignored tại output/qa/unified-guide-mobile.png và voice-commands.png |

Lượt browser đầu phát hiện helper test chưa đợi async commit và mock session dùng CSRF cũ; sửa helper chờ bước mới và session mock giữ token hiện tại. Browser cũng phát hiện nghe lệnh không resume sau chuyển manual step khi TTS tắt; sửa wrapper speech luôn resume có điều kiện khi hoàn tất. Bộ 12 ca cuối gồm regression resume này, lệnh lặp, phủ định, thu hồi consent, stop/unmount, camera mở lại, manual override, JSON không media, entry/resume và failed visual không chuyển. Không nới assertion nghiệp vụ để che lỗi.

Không gọi Gemini thật hoặc bật billing; không đánh giá accuracy ảnh cây/micro vật lý, chưa approval chuyên môn hoặc deploy Vercel. Các release gate gốc tiếp tục OPEN.

## Flow ảnh tự điền, AI từng bước và deploy tách — 18/10/2026

Thay entry camera ngay bằng /app/new → /plant → /instructions → /guide. Upload/chụp tạo private image và tự chạy Vision; tên/nhóm chưa nhập, vật liệu chậu mặc định chưa xác nhận, fragility và số đọc rõ từ nhãn là gợi ý. Giữ số manual/late edits/confirmed, không suy cm/kg từ pixel. Plant confirmation bắt buộc trước ảnh kết quả. 5 ảnh nguyên chậu dùng library photoreal AI cho FOLIAGE với nhãn minh họa, nhóm khác SVG; ảnh kiểm toàn bộ là hộp còn mở. Vật tư/hành trình/full plan vẫn giữ đường đi riêng.

“Đã xong bước này”/“Tiếp tục bước tiếp theo” xác nhận đúng bước: manual self-report; visual kiểm ảnh nếu chưa có kết quả rồi advance một lần khi pass/commit, hoặc override có lý do. REPORT_ISSUE xóa pass, lưu currentIssue/revision, resolve không tăng bước. Monitoring ảnh thay đổi mỗi khoảng 12 giây chỉ báo lỗi. Uniform frame trả unverifiable trước quota/provider. Stop/hidden/unmount dừng tracks/lượt chờ; refresh media/consent off, progress/issue persisted. Copy dài/trial/dev banner được rút gọn hoặc đưa vào details.

TTS giữ fixed SOP, normalize cách đọc khoảng/số âm/thập phân/so sánh/đơn vị ở client và server; xác minh WAV PCM trước trả, cache pin từ điển. Gemini thật phát hiện enum GenerateContent không nhận MIME lowercase application/json; sửa Vision/RAG sang APPLICATION_JSON, giữ protocol TTS 3.8 đúng hiện hành. Không đổi rule/SOP approvals hoặc thêm biological thresholds.

Người dùng chọn Vercel frontend + Node persistent backend. beforeFiles external HTTPS rewrite giữ cùng-origin auth/CSRF, private/no-store và tắt rewrite caching; Vercel handler fail trước DB. Docker Node24/Linux/user node/font tiếng Việt, volume /data, stable OTP secret, validate env startup và dispatcher startup/mỗi 5 giây. REFERENCE flag cho coaching production explicit, TRIAL vẫn chặn; Engine production NEEDS_EXPERT với rules DRAFT. Không case completion/inventory từ guide. Cấu hình deploy thật tại ../VERCEL_DEPLOYMENT.md.

| Check thực chạy | Kết quả |
| --- | --- |
| Typecheck | PASS sau thêm camera/normalizer/deploy và provider smoke |
| npm test | 153 tests/14 files PASS trên code cuối; thêm guard ảnh đồng màu không tiêu quota |
| Workflow E2E | 6/6 PASS trong lần cập nhật; full manual plan/checklist/stock/export giữ nguyên nghiệp vụ |
| Live browser | 13 ca đã PASS qua các lượt chạy; chạy lại ca lỗi selector bằng last-failed và các ca create/capture/responsive bằng grep. Camera, nhận giọng và provider giả; upload/API private thật. Bao phủ autofill giữ số nhập, kết quả, done một lần, định kỳ báo lỗi, issue/resolve, negation, override/skip, stale/resume, unsupported voice, camera permission/cleanup |
| Build Windows | npm run build -- --webpack PASS trên code cuối; production smoke PASS dev auth 404/private API401/storage404/CSP |
| Build frontend Vercel | VERCEL=1 + HTTPS upstream fixture + distDir riêng PASS; routes-manifest có beforeFiles /api/v1/* trước API local. Chưa gọi Vercel hosting |
| Proxy smoke | PASS forwarding body 3 MiB/hash/query/Origin/CSRF/cookie, no-store/cache opt-out, owners riêng và frontend không khởi tạo DB |
| Docker Linux | Build final plantcare-backend:flow-v2 PASS (Node24/bookworm); npm ci/prune báo 0 vulnerabilities tại lúc chạy |
| Container smoke | PASS production auth/Secure cookies, private upload, bound REFERENCE/uniform frame giữ bước/no AI call, draft engine gate, PDF tiếng Việt; restart giữ case/ảnh/voice checkpoint/session. Lease giả của worker chết hết hạn sau restart, kiểm DB job SUCCEEDED trước API poll: periodic idle recovery PASS. Container/volume test được cleanup |
| Gemini Vision thật | PASS job SUCCEEDED/vision-v1/UNCONFIRMED, ảnh trắng không sinh số đo |
| Gemini checkpoint thật | PASS schema cho ảnh AI minh họa có chi tiết, manual_check_required=true; không đo accuracy. Blank frame API guard PASS unverifiable/không gọi provider |
| Gemini RAG thật | PASS RAG_WITH_GEMINI, pinned plantcare-evidence-20261018-v3, 5 nguồn context, server validate citation/schema |
| Gemini TTS thật | HTTP200, WAV PCM 1.449.954 bytes, decode 30,08 giây/RMS>0; browser Web Audio phát hoàn tất khi không có voice Việt cài trên máy. Không là đánh giá phát âm bởi con người |
| UI | Xem screenshot mobile results/guide và desktop guide, 390px không overflow; ảnh minh họa có provenance; preview 3000 health ok/aiConfigured true. Artifacts ignored output/qa/*-v3.png |

Provider smoke là ít lượt opt-in, chỉ dùng ảnh trắng/ảnh AI mẫu và lời SOP, không ảnh người dùng hoặc nhãn chuyên môn. Bộ mặc định không gọi provider trả phí. Chưa đánh giá micro vật lý trong xưởng, ảnh cây thật có nhãn/accuracy, SMS thật, backup/restore/load/HA hoặc approval chuyên môn. Chưa tạo hosting/domain/Vercel deployment; cần backend HTTPS và secrets SMS/Gemini trên môi trường triển khai. R0/R1 gốc tiếp tục OPEN. File env người dùng đang sửa được giữ ngoài commit.

## Checkbox xác nhận thông số trước submit — 18/10/2026

Theo yêu cầu người dùng, dùng một checkbox rõ nghĩa “Tôi xác nhận thông số cây và chậu đã chính xác” tại form cây/chậu. Chưa tích thì khóa Xem hướng dẫn, Lưu & tiếp tục và tab bước sau; handler cũng chặn tiếp tục. Sửa thông số bỏ confirmed và khóa lại. Lưu nháp vẫn cho phép chưa xác nhận. Không đổi schema hoặc guard server/readiness đã có.

Typecheck PASS; E2E create/autofill/results/guide PASS với regression cho chưa tích, tích, bỏ tích và sửa số sau xác nhận; kiểm cả hai nút và tab vật tư. Provider giả lập, không gọi Gemini trả phí trong thay đổi này. Ánh xạ FR-10..17/TC-02, không đóng nghiệm thu FR/NFR gốc.
## AI điền đầy đủ thông số cây/chậu — 18/10/2026

Theo yêu cầu mới: Vision v2 đánh giá đủ tên/nhóm cây và sáu trường height/length/width/potDiameter/potHeight/weight. Schema bắt buộc đúng sáu entries không trùng, đúng cm/kg và cặp source/value: số đọc từ nhãn/thước/cân, ước tính nháp từ ảnh rõ hoặc null/UNKNOWN. Prompt vision-autofill-v4, vẫn UNCONFIRMED/measurements:null; client đọc được job v1 lịch sử, giữ số manual/confirmed và bỏ candidate UNKNOWN khi tự điền tên. Không dùng số mẫu cố định hoặc gọi ước tính là đo/cân thực tế. Checkbox và kiểm thực tế vẫn bắt buộc.

Đã bỏ toàn bộ mục Cách xử lý ảnh và đoạn người dùng chỉ định. Copy còn lại nhắc ngắn số AI có thể là ước tính; form vẫn giữ đủ trường và cho sửa. Không đổi Rule Engine, giá trị an toàn hoặc publication SOP.

Kiểm thực chạy: 156 unit/API tests/14 files PASS, typecheck PASS, production webpack build PASS; E2E create/autofill và camera capture 2/2 PASS (provider giả) kiểm đủ tên/nhóm/sáu ô, giữ chiều cao đã nhập, nhãn ước tính, checkbox khóa submit và không còn mục xử lý ảnh. Gemini opt-in thật PASS với 2 ảnh: ảnh trắng 6 UNKNOWN/null, không có candidate nhóm xác định; ảnh cây AI mẫu trả tên/nhóm FOLIAGE và đủ 6 số dương, có VISUAL_ESTIMATE. Đây là kiểm giao tiếp/độ đầy đủ, không đo độ chính xác số/khối lượng từ ảnh hoặc an toàn vận chuyển. Không dùng ảnh riêng của người dùng; giữ file env người dùng ngoài commit.
## Flow theo PRD MVP đã chốt — 19/10/2026

Đã đọc toàn bộ PRD Word do user giao; fingerprint/locator và ma trận 10 tính năng ở [prd-mvp-20261019.md](prd-mvp-20261019.md). Flow mới bắt buộc xác nhận cây/NEED_INPUT → hành trình/kênh/ngày → xác nhận → PA1/PA2 từ danh mục → chọn → bước/hình/lời đọc đã pin → camera tùy chọn/Bắt đầu → hậu kiểm → lưu. Cấu hình/bundle bất biến, review độc lập và reauth activation; OTP login/profile; nguồn/confidence từng trường. Giữ API/plan/kho/PDF legacy và tách Vercel/Node-volume.

| Kiểm thực chạy | Kết quả |
| --- | --- |
| npm run typecheck; npm run build | PASS TypeScript và production Turbopack |
| npm test | PASS 165 tests / 16 files, gồm rule/unknown/confidence/manual precedence/owner/revision/voice và operator last-admin/session revoke |
| npm run test:e2e | PASS 6 suites: OTP/reset/owner/CSRF, FAIL/STALE, kho completion atomic/idempotent, PDF/share/private upload, no-op/RAG và responsive legacy |
| npm run test:e2e:live | PASS 13 suites: flow MVP ảnh/confidence/hành trình/2 phương án/Bắt đầu, camera capture, voice/checkpoint, lỗi/resolve, revoke/countdown/stop, resume, permission và UI |
| npm run test:e2e:mvp | PASS 4 suites: alternative/start/postcheck/history guards; manual UI pause/offline/resume/postcheck mobile; config independent review/reauth/conflict; OTP login/lock |
| Gemini Vision v3 opt-in thật | PASS 2 ảnh: blank giữ 6 unknown/null, ảnh AI cây trả 5 số gợi ý + 1 unknown; đủ 10 key confidence; không đo accuracy |
| npm run test:production | PASS dev auth off, private API/storage, CSP production |
| npm run test:proxy | PASS beforeFiles/body/query/CSRF/cookies/private cache và frontend không tạo DB |
| UI QA | Đã xem screenshots options/postcheck mobile và history desktop; 390px không overflow; không có pageerror ở manual flow |

Artifact test/ảnh dùng scratch DB, output/qa và test-results ignored. Real provider chỉ dùng ảnh trắng/ảnh AI thư viện, không ảnh người dùng. Không nâng quyền hoặc tạo approval thật trên DB người dùng; API duyệt trong DB E2E riêng không phải bằng chứng chuyên môn. Mock/camera giả không đo độ chính xác hoặc hiệu năng thiết bị thật. NFR/pilot/ảnh cây có nhãn/SMS thật/weather-route provider/hosting HTTPS và chuyên gia duyệt seed tiếp tục OPEN. REFERENCE flag không vượt gate MVP.

File `.env.example` có chỉnh sửa riêng trước task, giữ ngoài commit; không xuất secret/log ảnh. Phần Docker/Linux và restart volume được bổ sung bằng kết quả smoke khi hoàn tất, không coi build đơn thuần là deploy.

Docker/Linux bổ sung: build webpack trong image Node24 PASS; smoke API production + Secure/HttpOnly/SameSite cookie/private upload + REFERENCE legacy + gate draft MVP/legacy + operator CLI + PDF tiếng Việt PASS. Restart disposable persistent volume PASS: case/ảnh private/checkpoint/session và idle lease recovery tồn tại sau restart. Image local `plantcare-backend:prd-mvp`, không publish registry hoặc provision hosting.

## Demo theo ảnh người dùng — 20/10/2026

Đã đọc đủ source/pa1 bước 1..6 và source/pa2 bước 1..8, tạo 14 WebP giữ nguyên khung/chú thích (941 × 1672), tổng 2.627.020 byte. Manifest có hash ảnh gốc và WebP. Hardcode bộ demo version riêng, mặc định UI local chọn demo sau input confirmation; hồ sơ cũ có CTA đổi trước Bắt đầu. Không sửa rule/config đã duyệt hoặc bundle lịch sử, không thay ảnh gốc người dùng. BOM theo ảnh, đơn giá null. Chi tiết tại [packing-photo-demo.md](packing-photo-demo.md).

Gallery và phiên dùng cùng ảnh/bước/lời đọc. Server Vision gửi đúng ảnh mẫu đã kiểm checksum + frame thực hiện riêng, chỉ xét frame làm bằng chứng. Phiên pin threshold, nguồn và ảnh. Hậu kiểm 7 mục mỗi PA, fixation bắt buộc kiểm tay. Production chặn bộ demo; API không có demo:true giữ engine thường. Bổ sung guard không tạo demo mới khi đang đóng gói.

Kiểm thực chạy:

- `npm.cmd test`: **172 PASS / 17 files**, gồm payload hai ảnh qua fetch mock, sai hash/path, input/confidence, không mutate và production gate.
- `npm.cmd run test:e2e:mvp`: **7 PASS**, đi hết 6/8 bước và hậu kiểm/lưu, ảnh đúng bước trên desktop/mobile, chuyển bộ cũ giữ lịch sử, OTP/quyền/revision/cấu hình/khôi phục offline.
- `npm.cmd run test:e2e:live`: **13 PASS**, gồm tạo hồ sơ đến demo PA2 8 bước và các regression camera/voice/consent/lỗi/nhận lệnh.
- `npm.cmd run typecheck`: PASS. `npm.cmd run build`: PASS, gồm TypeScript và production routes. Không chạy build đồng thời Next E2E vì các artifact type được tái tạo có thể gây TS6053; build tuần tự sau E2E đã đạt.
- E2E phát hiện phản hồi RESUME đến muộn có thể bật active sau sự kiện offline. Đã guard theo generation + online/visibility và xóa thông báo mất mạng khi có mạng; chạy lại toàn bộ 7 bài MVP PASS, không đổi kỳ vọng để che lỗi.
- Kiểm trực quan `output/qa/demo-pa1-guide.png` và `demo-pa2-guide.png`: ảnh đủ khung/caption; E2E kiểm không tràn 390/1440 px, ảnh tải đủ 941 × 1672. Gallery và ảnh guide tại output/qa/demo-pa*-*.png (ignored).
- Local chạy webpack dev ở http://127.0.0.1:3000 với `.next-preview`; health trả OK/development, aiConfigured=true. Đây là trạng thái cấu hình, không chứng minh key/provider hoạt động.

Không gọi Gemini thật hoặc kiểm camera/micro vật lý trong task demo này. Không có fine-tuning, approval chuyên môn, đo accuracy hoặc deploy hosting. Nguồn gốc người dùng cung cấp không tự chứng minh quyền sử dụng để training. File .env.example có sửa riêng được giữ nguyên, không xuất nội dung; source PNG giữ nguyên, delivery WebP dùng độc lập trên web.

## Lời đọc theo ảnh và xác nhận tự nhiên — 20/10/2026

Theo yêu cầu tiếp theo: packingNarration chỉ ghép “Bước N.” + speech_vi đã pin theo ảnh. Bỏ đoạn nhắc nói đã xong để chuyển bước, bỏ câu nhắc sau ảnh đạt và hint lặp trên UI. Không sửa speech_vi/snapshot cũ; các yêu cầu kiểm trực tiếp vẫn hiện trên màn hình. Các câu “Đã xong”, “Xong rồi”, “Tôi đã làm xong” là CONFIRM thay CHECK; yêu cầu “Kiểm tra” giữ CHECK, không tự chuyển. Vẫn chặn lỗi/unknown, giữ kiểm tay có lý do, không tự bật micro.

Kiểm thực chạy: `npm.cmd test` **177 PASS / 17 files**; `npm.cmd run test:e2e:live` **15 PASS**, gồm hai bài mới PA1/PA2 xác minh tự đọc đúng speech_vi + ảnh ở bước 1–3, hiểu câu hoàn tất ngắn để kiểm rồi chuyển, phủ định giữ bước và không có lời nhắc trong text thực gửi SpeechSynthesis; `npm.cmd run build` **PASS** gồm TypeScript. E2E dùng camera/nhận giọng/Vision giả lập, không thay kiểm thiết bị/provider thật. Các kiểm toàn bộ bước ảnh, ownership/revision và media lifecycle tiếp tục đạt trong unit/E2E; không sửa quy tắc eligibility hoặc trạng thái chuyên môn.

## Preset Phú quý và bỏ badge nguồn — 20/10/2026

Đã xem ảnh `source/cayphuquy.jpg` và nối preset đúng yêu cầu: Cây phú quý lá đỏ / FOLIAGE / cao tổng 50 cm / dài tán 40 cm / rộng tán 40 cm / đường kính chậu 20 cm / cao chậu 25 cm / 5 kg / HIGH / Gốm / sứ. Hash nguồn và fixture cùng `b2baee7d230508e523bd2c11f9a625f81ad7b6613cdd0715af6c35f5a2279fed`; source gốc không đổi. Bản chạy nhận fingerprint tĩnh, không cần đọc thư mục source lúc runtime. Không xem số mẫu là kết quả AI đo/cân.

Endpoint private development kiểm upload owner/case/purpose và khớp ảnh qua decode/nén/resize; trả sampleId, không gọi Gemini hoặc tạo job. UI điền mẫu trước nhánh AI-config, source=DEMO/confidence=null; bỏ mọi badge nguồn/phần trăm/Cần nhập tay, vẫn giữ validation và checkbox. USER/late edit/confirmed được bảo vệ; scan ảnh khác có thể thay gợi ý DEMO chưa sửa. Giữ nguyên HIGH và gốm/sứ trong case/bundle; demo có cả PA1/PA2, engine thường vẫn NEEDS_EXPERT. Mobile chuyển form về một cột để đọc đầy đủ tên và mức dễ hư. Workflow theo agent.md và [packing-photo-demo.md](packing-photo-demo.md).

Kiểm thực chạy:

- `npm.cmd test`: **182 PASS / 18 files**, gồm fixture hash, JPEG→WebP/resize 380/757/1200 px, ảnh trắng/sai/ảnh khác, đủ 10 trường, phân biệt DEMO/AI/USER, không tự xác nhận và HIGH giữ gate thường.
- `npm.cmd run typecheck`: **PASS**. `npm.cmd run build`: **PASS**, gồm TypeScript/production routes.
- `npm.cmd run test:e2e:mvp`: **10 PASS** ở lần chạy cuối, gồm upload ảnh thực từ browser, điền đúng toàn bộ trường mà không cần Gemini, checkbox, snapshot HIGH, cả PA1/PA2, không còn badge, owner/case/CSRF/nonmatch và regression hướng dẫn/hậu kiểm/lịch sử. Lần đầu có một ECONNRESET khi test đọc guidance; chạy lại cùng kiểm/assertions không sửa, cả 10 đạt.
- Sau chỉnh mobile, chạy lại hai bài `--grep 'Phu quy sample'`: **2 PASS**, xem trực quan output/qa/phu-quy-pa1-profile.png và phu-quy-pa2-profile.png. Source/fixture giữ nguyên; không tràn hoặc cắt tên/độ dễ hư trên mobile.
- Regression upload/chụp thường: `playwright test --config playwright.live.config.ts --grep 'PRD create|camera capture uploads'`: **2 PASS**, nhánh ảnh khác vẫn nhận diện/gợi ý và giữ manual/checkbox.
- Local `/app/new` trả HTTP200, web tiếp tục ở http://127.0.0.1:3000. Không chạy Gemini thật/camera/micro vật lý hoặc deploy/publish trong task này; các kiểm AI dùng mock. Không thay env riêng người dùng hoặc ghi approval chuyên môn.

## Tên phương án và copy giao diện — 20/10/2026

Theo yêu cầu mới: PA1 hiển thị “Phương án an toàn nhất”, PA2 hiển thị “Phương án tối ưu chi phí nhất”. Dùng nhãn theo ID ở lớp trình bày cho cả hồ sơ cũ; bộ đề xuất mới cũng lưu tên mới, bỏ mô tả và notes demo kiểu “6 bước theo bộ ảnh bạn cung cấp”. Thu gọn banner/chú thích thành “Chế độ demo”/“Ảnh hướng dẫn”, bỏ dòng giải thích nguồn ảnh ở bảng chi phí. Không đổi mã, ảnh, số/thứ tự bước, lời đọc hoặc snapshot lịch sử. `playwright test --config playwright.mvp.config.ts --grep 'Phu quy sample|old catalog results'`: **3 PASS**, có assert đúng hai tên và không còn câu nguồn thừa. `npm.cmd run build`: **PASS**, gồm TypeScript. Chỉnh sửa copy không tạo test unit mới hoặc chạy lại provider thật.

## Khôi phục giọng AI local — 21/10/2026

Điều tra lỗi không nghe hướng dẫn: server local được mở trong môi trường chặn outbound; kiểm tra kết nối Google cùng môi trường trả `EACCES`. Có 20 lượt `FAILED_USAGE_UNKNOWN`, sau đó endpoint speech trả `429 AI_QUOTA`. Khởi động lại đúng server với quyền kết nối Gemini; theo xác nhận của người dùng, đặt riêng `AI_DAILY_CALL_LIMIT=100` trong `apps/web/.env.local` được Git bỏ qua. Giữ nguyên lịch sử usage và quota mặc định trong code.

Máy không có giọng Việt cài sẵn còn cần mở AudioContext bằng tương tác người dùng. `LivePacking.control` nay gọi `activate` ngay khi bấm Bắt đầu/Tiếp tục phiên, trước request điều khiển, khi lời đọc đang bật, âm lượng > 0 và thiếu giọng Việt. Giữ generation guard nếu phiên bị dừng trong lúc mở âm thanh. Không bật camera/micro hoặc chuyển bước từ thao tác nghe.

Kiểm thực: `npm.cmd run typecheck` **PASS**; E2E mới `--grep 'MVP start and resume play cloud narration'` **1 PASS** (không có giọng Việt, tự phát từ Bắt đầu và Tiếp tục, dùng lại audio cache); regression `--grep 'automatically narrates|PRD create'` **3 PASS**. Bốn bài browser này dùng provider/thiết bị giả lập. Kiểm riêng trên Chrome đang dùng và Gemini thật: `/api/v1/live-packing/speech` HTTP200, usage `SUCCEEDED`, giao diện báo “Đã đọc xong” sau cả nghe trực tiếp và Tiếp tục phiên; ảnh tại `output/qa/tts-fixed.jpg`. Không xác minh âm lượng loa vật lý hoặc chất lượng phát âm bằng người nghe; không chạy production build hoặc toàn bộ test suite cho thay đổi này.

## Giọng phản hồi khi kiểm ảnh bước 1 — 22/10/2026

Log phiên trước có speech HTTP200 nhưng checkpoint HTTP503: câu đọc lỗi kiểm ảnh không chứng minh bộ phát giọng bị hỏng. Lần điều tra này chưa tái hiện được HTTP503 cũ: kiểm tra trực tiếp hai ảnh mẫu và bài tích hợp qua API đều trả JSON hợp lệ. Không kết luận nguyên nhân 503 khi thiếu body phản hồi cũ.

Đã xác định lỗi độc lập trong client: mỗi kết quả kiểm ảnh trả lại guidance/boundSop có tham chiếu object mới. Effect đọc bước phụ thuộc object SOP nên cleanup có thể hủy ngay lượt đọc kết quả đang tạo/phát, dù bước không đổi. Chuyển dependency sang nội dung narration đã pin; kết quả ảnh/revision mới cùng bước không ngắt giọng hoặc đọc lại lời bước. Lượt kiểm thủ công gặp lỗi nay đọc chính thông báo tiếng Việt từ API thay vì luôn đọc câu lỗi chung. Vẫn giữ bước khi lỗi/ảnh chưa đạt, giữ xác nhận riêng và các guard camera/micro.

Kiểm thực: `npm.cmd run typecheck` **PASS**; `playwright.live.config.ts --grep 'MVP camera .* result finishes'` **2 PASS**, gồm kết quả đạt/cần chỉnh, cloud speech trì hoãn có decode/phát hết, không abort request hoặc lặp lời bước. Bài `MVP camera service failure` **1 PASS** sau khi chọn đúng alert lỗi (Next có một route announcer rỗng cùng role); Bắt đầu/Tiếp tục và lời PA1/PA2 **3 PASS**. Sáu bài này dùng thiết bị/provider giả lập. Ảnh QA tại `output/qa/camera-step-1-feedback.png`.

Opt-in `RUN_REAL_GEMINI=1` + `playwright.gemini.config.ts --grep 'real demo step one'`: **1 PASS**, hai lượt Gemini thật qua session MVP riêng và quota kiểm thử, ảnh mẫu đã bọc trả `passed`, ảnh `source/cayphuquy.jpg` chưa bọc trả `needs_adjustment`; HTTP200, đúng schema/revision và không tự chuyển bước. Đây là bằng chứng giao tiếp trên hai mẫu, không phải đánh giá accuracy hoặc camera/micro/loa vật lý. Không thay model, quota 100 đã được đồng ý, dữ liệu lịch sử hay approval chuyên môn; không chạy toàn bộ suite/production build. Server local được mở lại trên cổng 3000 vì process cũ đã dừng.

## Giá vật liệu bao gói demo — 22/10/2026

Theo bộ giá mới người dùng cung cấp: PA1 2.000 + 1.000 + 200 + 200 = 3.400đ; PA2 500 + 200 + 200 = 900đ. `demo-pricing.ts` giữ chung BOM/tổng và version nguồn, cộng bằng Decimal. Demo mới lưu bốn/ba dòng giá; demo cũ tổng null nhận cùng bảng giá ở lớp hiển thị/export, không ghi đè DB hoặc giá đã biết. Card và bảng “So sánh chi phí vật liệu bao gói” dùng cùng dữ liệu. Giữ nguyên ảnh, lời/bước, lựa chọn và các guard phiên; vật tư tem/vận đơn ngoài bộ giá không được gán giá 0.

Kiểm thực: typecheck **PASS**; `vitest run tests/packing-demo.test.ts` **7 PASS** (giá/tổng, số dòng, không mutation, lịch sử giá đã biết và non-demo); `playwright test --config playwright.mvp.config.ts --grep 'photo demo shows the supplied material prices'` **2 PASS** cho bundle mới và fixture demo cũ chưa có giá, kiểm card, từng đơn giá, tổng, đúng cột và snapshot không đổi. Chrome trên hồ sơ local cũ thực tế cũng đã hiện 3.400đ/900đ và đầy đủ bảng năm loại vật liệu; ảnh `output/qa/material-prices-live.jpg`, QA tự động tại `demo-material-prices-cards.png`/`demo-material-prices-comparison.png`. Không gọi AI, đổi dữ liệu người dùng, chạy toàn bộ suite/build production hoặc deploy trong task giá này.

## Hạn mức giọng Gemini và thay key local — 22/10/2026

Giọng mất ở phiên PA2 bước 1 do Gemini TTS trả HTTP429 `RESOURCE_EXHAUSTED`: QuotaFailure `GenerateRequestsPerDayPerProjectPerModel-FreeTier`, limit 10 cho `gemini-3.8-flash-lite-tts`, RetryInfo khoảng 1 giờ. Lúc kiểm tra DB local mới dùng 46/100 lượt; kiểm ảnh HTTP200 không chứng minh TTS còn quota. Một câu thử cố định xác nhận chính xác lỗi provider; không lưu raw key, audio hoặc prompt cá nhân vào log.

Server nay phân biệt quota TTS theo ngày/tốc độ với quota local; chỉ dùng RetryInfo hợp lệ để báo giờ thử lại tại Việt Nam. Cooldown lưu bền trong `limits`, scope hash key/model, chặn trước reserve/gọi provider cho mọi nội dung mới, không chặn audio cache. Failed usage vẫn được tính; metadata chỉ model/error_code. Không tự tăng hạn mức Google, đổi model hoặc bật billing. Key mới do user cung cấp đã thay trong `.env.local` bị Git ignore; Next xác nhận reload env. Kiểm endpoint local với key mới trả HTTP200, audio/wav 130.918 byte, RIFF/WAVE hợp lệ.

Kiểm thực: typecheck **PASS**; `vitest run tests/vietnamese-tts.test.ts` **12 PASS**, gồm quota/cooldown/expiry/cache và đổi key; `playwright.live.config.ts --grep 'Gemini speech quota|MVP start and resume play cloud narration|MVP camera .* result finishes'` **4 PASS**. Bài browser dùng provider/thiết bị giả lập; teardown Windows chờ tắt server test, đã dọn đúng cây process cổng 3107, lệnh thoát 0. Không chạy toàn bộ suite/build/deploy. Chrome ban đầu bị giới hạn công cụ xét duyệt tạm thời, sau thời điểm cho phép đã truy cập lại được; form người dùng vẫn giữ tại tab cũ, kiểm âm thanh ở tab riêng.

Chrome + key mới: bấm Dùng giọng AI tại PA2 bước 1, DB ghi SUCCEEDED, giao diện “Đã đọc xong”; ảnh `output/qa/tts-new-key.jpg`. Không bật camera/micro, thay bước hoặc kết luận đã nghe âm thanh qua loa vật lý.

## Demo sen đá theo dữ liệu mới nhất — 23/10/2026

Đọc Word mới `Bản sao của Cây vạn lộc (1).docx` và hai RAR user cung cấp; xem ảnh cây mới và đủ 8 ảnh hướng dẫn. Word mới có Nhựa/LOW và chậu cao 8 cm; user bổ sung chiều cao tổng 13 cm. Thay dữ liệu gốm/sứ/trung bình và ảnh chậu trắng trong bản trước còn đang triển khai. Lưu nguồn/hash tại source-index.md. Không sửa tài liệu gốc. Các bản trích/copy tạm ở `output/imports/` được ignore để tránh đưa nguyên tài liệu vào Git.

Registry ảnh/preset nhận cùng ảnh qua fingerprint, trả sampleId riêng, giữ Phú quý và USER/late edits. Sen đá điền đủ 13/12/12/10/8 cm, 0,3 kg, Nhựa/LOW và chỉ gợi ý route/channel còn trống. Ngày gửi do user chọn, không tự dùng 20/10 đã qua. Bộ `demo-succulent.ts` có hai phương án 4 bước đúng ảnh; version/hash riêng; gallery, lời đọc, Vision reference và hậu kiểm dùng đúng phương án/snapshot. Checklist và production gate giữ nguyên. Phú quý tiếp tục 6/8 bước và giá trước đó.

BOM gồm lượng/quy cách/giá trong Word, băng keo 1,2/0,8 m và phụ trợ 400/100đ. Decimal tính tổng 15.000/8.000đ và tiết kiệm 7.000đ/46,7%. MaterialComparison hiện quy cách khi có, lượng thập phân Việt và dấu — cho đơn giá phụ trợ được phân bổ, không giả 0 hoặc thiếu tổng. Lớp bổ sung giá legacy chỉ áp version Phú quý cũ, không ghi giá Phú quý vào sen đá hoặc sửa snapshot DB. Script tái tạo giữ nguyên đầy đủ ảnh/chú thích, kiểm nguồn đổi trước ghi đè version.

Kiểm thực: `npm.cmd run typecheck` **PASS**; `vitest run tests/succulent-demo.test.ts tests/demo-plant.test.ts tests/packing-demo.test.ts tests/guidance.test.ts tests/live-packing.test.ts` **59 PASS**; sau cập nhật chiều cao 13 cm chạy lại 6 test sen đá **PASS**. `playwright.mvp.config.ts --grep 'updated succulent sample|Phu quy sample upload|photo demo shows the supplied material prices|sample matching is owner'` **7 PASS**, gồm desktop/mobile sen đá từ upload đến hậu kiểm/lưu, số/ảnh/giá, chặn xác nhận thiếu, không gọi model nhận diện, regression Phú quý và owner/CSRF. Ảnh profile/options/cost-comparison/PA1/PA2 tại `output/qa/succulent-*`, đã xem lại profile, card và bảng. Browser dùng DB riêng, không gọi Gemini thật/camera/micro hoặc chứng minh độ chính xác chuyên môn. Không chạy toàn suite/build/deploy.

Server local đã mở lại cổng 3000, health HTTP200. Lần khởi động đầu của Next dừng vì cảnh báo nâng cấp bảo mật dependency; chạy lại lệnh nguyên trạng thì server và test chạy được. Chưa thay dependency trong phạm vi demo này; cảnh báo Next.js 16.4.0 cần được xử lý ở task nâng cấp riêng.

### Cập nhật mới nhất: chỉ hiện liên kết chi phí

User thay yêu cầu thu gọn trước đó: mặc định chỉ có “Xem chi tiết”; tiêu đề, tổng vật tư và mức tiết kiệm đều nằm bên trong disclosure cùng toàn bộ bảng. “Thu gọn” ẩn toàn bộ nội dung lại. Đã bỏ mini-table/CSS tổng bên ngoài và đổi test để kiểm nội dung ẩn. Typecheck và 4 E2E sen đá desktop/mobile, giá Phú quý mới/cũ **PASS**. Đã xem ảnh `output/qa/material-costs-collapsed.png`, chỉ có liên kết mở; không thay số tiền hoặc dữ liệu lưu.

### Chỉnh sửa tiếp theo: hành trình nhập tay

Bảng chi phí thu gọn theo yêu cầu mới: MaterialComparison mặc định chỉ hiện bảng tổng vật tư từng PA và dòng tiết kiệm. Native details/summary “Xem chi tiết” mở toàn bảng, “Thu gọn” đóng lại; bundle mới bắt đầu ở trạng thái đóng. Bảng chi tiết giữ nguyên giá/quy cách/lượng/tổng; màn hình nhỏ cuộn ngang trong vùng bảng. Typecheck **PASS**, 4 E2E sen đá desktop/mobile và giá Phú quý mới/cũ **PASS** (kiểm tổng luôn hiện, chi tiết ẩn/mở/đóng, dòng giá và không tràn viewport). Ảnh đã xem tại `output/qa/material-costs-collapsed.png` và `succulent-cost-comparison.png`. Không gọi AI, đổi dữ liệu hoặc chạy toàn bộ suite/build.

Ảnh đại diện thẻ phương án theo yêu cầu tiếp theo: PA1/PA2 dùng `steps[0].image` của chính phương án; fallback ảnh vật tư khi thiếu ảnh bước. Áp dụng cả hai bộ demo và dữ liệu phương án hiện có, chỉ đổi hiển thị thẻ, không mutate bước hoặc bundle. Typecheck và diff whitespace **PASS**.

Chỉnh giao diện kết quả theo yêu cầu tiếp theo: đã bỏ toàn bộ khối mở rộng “Quy tắc và dữ liệu đã dùng” khỏi `MvpResults`, gồm version/trace/JSON snapshot trên màn hình. Dữ liệu bundle và tải hồ sơ vẫn giữ. Typecheck và diff whitespace **PASS**; thay đổi hiển thị đơn giản, không bổ sung test hoặc chạy lại E2E.

Theo user, hành trình không được điền sẵn khi tải ảnh sen đá. Đã bỏ `applyDemoJourney` và lời gọi trong callback nhận mẫu; nhận ảnh chỉ thay các trường cây/chậu. Nơi đi, nơi đến, kênh bán và ngày gửi của hồ sơ mới trống, người dùng tự nhập theo kịch bản demo. Không xóa/migrate dữ liệu hành trình đã lưu và không thay mẫu cây, ảnh, giá hoặc các bước đóng gói.

Kiểm thực: typecheck **PASS**, `tests/succulent-demo.test.ts` **5 PASS**; browser `playwright.mvp.config.ts --grep 'updated succulent sample'` **2 PASS**. Cả desktop PA1/mobile PA2 kiểm bốn trường trống và nút ước tính bị khóa, rồi nhập tay Hoàng Hoa Thám - Hà Nội → Từ Sơn - Bắc Ninh, Shopee/ngày thực tế, đi hết hướng dẫn và hậu kiểm. Bằng chứng UI `output/qa/succulent-journey-empty.png`; DB kiểm thử riêng, không gọi Gemini thật. Cập nhật hướng dẫn và ADR hiện hành để bỏ mặc định hành trình.
