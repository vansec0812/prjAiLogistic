# Deploy PlantCare lên Vercel

## Demo Phú quý/sen đá trên cloud — 23/10/2026

Theo yêu cầu mới “bật demo Phú quý/sen đá như bản local”, Production đã đặt `PLANTCARE_PHOTO_DEMO_ENABLED=true` và triển khai READY `dpl_9yKY6JEXxTw6eugH2Pfx4qyTosu6` tại https://plantcare-logistic.vercel.app. Đây là ngoại lệ demo ảnh có cấu hình riêng, thay thế các mô tả “demo chỉ local” bên dưới; không đổi NODE_ENV. Có thể tắt bằng cách bỏ flag rồi redeploy.

Nút “Khám phá bản dùng thử trực tiếp” tạo tài khoản MEMBER riêng cho mỗi khách mới; không chia sẻ `local-demo` hoặc seed hồ sơ local. Nhận ảnh mẫu, tạo/chọn PA1/PA2 và hướng dẫn MVP dùng cùng gate. Quyền owner, CSRF, xác nhận số đo/hành trình, checklist và giới hạn AI giữ nguyên. SMS thiếu vẫn fail closed; TRIAL và catalog/rule chưa duyệt không được mở bởi flag.

Cloud smoke thực đã upload hai fixture, nhận đúng `sen-da-20261023-v2` / `phu-quy-red-20261020-v1`, tạo giá 15.000đ/8.000đ và 3.400đ/900đ, khởi chạy cả hai hướng dẫn với đủ ảnh (sen đá 4/4 bước, Phú quý 6/8 bước). Hai khách có ID riêng; truy cập chéo hồ sơ trả 404. Smoke không gọi Gemini, không kiểm camera/micro vật lý hoặc SMS.

## Deployment tài khoản mới — 23/10/2026

Theo yêu cầu và xác thực CLI của user, đã tạo `namnguyen2142006-lab/plantcare-logistic`, root `apps/web`, Next.js/Node 24. Link production: https://plantcare-logistic.vercel.app. Deployment READY `dpl_EtZsEYCGHHHLuJyvHLhXowSyYZDY`. Neon `plantcare-db`, Free `free_v3`, Singapore `sin1`, chỉ kết nối Production sau khi user chấp nhận điều khoản. APP_ORIGIN khớp domain mới, PLANTCARE_STORAGE=postgres; OTP secret ngẫu nhiên mới và Gemini key server lưu Secret, AI quota 100 theo cấu hình local đã được đồng ý. `.vercelignore` loại env/local DB/outputs/source/test khỏi upload; không chuyển dữ liệu local.

Cloud build/typecheck/postbuild PASS; trang chủ, health và session trả HTTP200. Cookie session không tồn tại cũng trả user=null sau truy vấn PostgreSQL, không tạo tài khoản. Chrome đã mở được trang chủ, ảnh `output/qa/vercel-plantcare-live.jpg`. Runtime production-gated, SMS chưa cấu hình, demo local chưa bật trên cloud; không tuyên bố đã kiểm flow đăng ký/OTP, Gemini thật hoặc demo sen đá trên production. Build báo Next 16.4.0 có advisory critical; cần xử lý nâng cấp ở task riêng, không tự chạy audit fix --force. Không kết nối Git tự deploy hoặc nâng gói trả phí.

## Runtime đang triển khai — 21/10/2026

Theo yêu cầu tự triển khai mới, ứng dụng chạy trực tiếp trên Vercel Node 24 Functions tại `sin1`, dùng database Neon riêng `plantcare-production` trên gói Free. Root Directory là `apps/web`, bật include ngoài root; install/build/output lấy từ `apps/web/vercel.json`.

Đặt `PLANTCARE_STORAGE=postgres`, `APP_ORIGIN=https://prj-ai-logistic.vercel.app` và secret `PLANTCARE_OTP_SECRET` ≥32 ký tự. Kết nối Neon chỉ Production để tự cấp `DATABASE_URL`; không dùng database của project khác, không gắn preview vào production. Không đặt `PLANTCARE_BACKEND_URL` trong mode này. Mẫu tại `deploy/vercel-cloud.env.example`. Gemini/SMS ở server env, không có prefix `NEXT_PUBLIC_`. Storage target là hằng build không bí mật, đổi target cần rebuild. `postbuild` kiểm mọi NFT trace và loại env/dữ liệu local khỏi artifact, kể cả trên Windows.

Schema `plantcare` có cùng constraints, owner checks, version/idempotency và trigger bất biến. Ảnh chuẩn hóa và exports nằm trong `private_files` dạng BYTEA, chỉ đọc qua API có auth/owner; không có URL ảnh public. Không cần `/tmp` hoặc volume. Tệp tối đa 20 MiB; database Free có hạn mức, phù hợp dữ liệu MVP, cần theo dõi dung lượng trước khi tăng sử dụng.

Lớp tương thích SQL dùng worker thread có một connection TLS xác minh chứng thư; callback transaction synchronous không bị tách giữa connection. PostgreSQL advisory transaction lock giữ semantics ghi của SQLite giữa instance. SQL chặn event loop trong thời gian round-trip: chấp nhận cho MVP hiện tại, chưa phù hợp tải lớn; bước tiếp theo là repository async và khóa theo resource sau khi có load evidence. Lỗi mạng/timeout không tự replay mutation. Dữ liệu local `.data` không được tự chuyển lên cloud.

Vercel Route Handler dùng `after` và `maxDuration=300`; outbox/lease vẫn bền vững, request tiếp theo phục hồi job hết lease. Chưa có worker nền luôn chạy hoặc cron tần suất cao. Font Noto Sans kèm OFL được bundle để xuất PDF tiếng Việt.

Kiểm thử database thật (file env bị Git bỏ qua):

```powershell
$env:PLANTCARE_POSTGRES_TEST='1'
node --env-file=.env.cloud.local node_modules/vitest/vitest.mjs run tests/postgres.integration.test.ts
```

Fixture có UUID riêng và được dọn theo đúng owner; không đụng dữ liệu người dùng. Các kiểm tra hiện có cho SQLite vẫn phải qua. Khóa Gemini chỉ cấu hình trong Vercel Secret, không ghi vào repo. Thiếu SMS trả `SMS_UNAVAILABLE`, không sinh mã giả trong production. Demo ảnh/Phú quý vẫn local; cấu hình SOP chưa duyệt vẫn chặn production. Deploy kỹ thuật không thay phê duyệt chuyên môn hay kiểm thử SMS/load/restore.

## Phương án Node có volume vẫn được hỗ trợ

Cập nhật 18/10/2026 theo lựa chọn của người dùng. Repo có Docker backend, cấu hình Vercel và proxy API. Chưa tạo hosting hoặc domain; điền SMS, Gemini và hai origin HTTPS thật trước khi chạy trên Internet.

## Kiến trúc

Trình duyệt → Next.js trên Vercel → HTTPS backend Node 24 → volume /data chứa SQLite, ảnh private và exports. Backend là một process sống lâu, có dispatcher khởi động và mỗi 5 giây.

Browser luôn gọi /api/v1 cùng origin frontend. Rewrite **beforeFiles** chạy trước Route Handlers, giữ cookie, Origin, CSRF, query và body. Backend kiểm APP_ORIGIN/owner/version, cookie Secure/HttpOnly/SameSite=Lax. API trả private, no-store và x-vercel-enable-rewrite-caching: 0, kể cả ảnh/PDF/TTS/lỗi. Không mở CORS wildcard hoặc cache API private. Nguồn: [Vercel rewrites](https://vercel.com/docs/routing/rewrites).

Nếu API lọt tới Vercel Function, handler trả 503 BACKEND_ROUTING_REQUIRED trước khởi tạo DB. Build Vercel thiếu PLANTCARE_BACKEND_URL sẽ fail. Không đặt SQLite/files trong /tmp hoặc bật demo để deploy.

## 1. Backend

Chọn host Docker có **persistent volume**, HTTPS ingress và outbound SMS/Gemini. Dùng một replica, không filesystem tạm hoặc service kết thúc process sau response. Scale/HA cần DB/queue khác.

Từ root repo, chỉ tạo env nếu chưa có:

    Copy-Item deploy/backend.env.example .env.backend.local
    # Điền giá trị thật trước khi chạy.
    docker compose up -d --build
    docker compose ps

Không ghi đè env đã điền. File secret bị Git/Docker build bỏ qua; dùng secret manager của host khi có.

| Biến backend | Giá trị |
| --- | --- |
| APP_ORIGIN | Origin frontend HTTPS cố định, không slash cuối/path; ví dụ https://ten-du-an.vercel.app. Domain preview khác cần backend staging riêng. |
| PLANTCARE_OTP_SECRET | Chuỗi ngẫu nhiên riêng ≥32 ký tự, giữ ổn định giữa restart/đổi image. |
| GEMINI_API_KEY, GEMINI_VISION_MODEL | Key/model đã được cấp quyền, chỉ backend. |
| GEMINI_TTS_MODEL | Mẫu gemini-3.8-flash-lite-tts; kiểm quyền trên project trước khi dùng. |
| AI_DAILY_CALL_LIMIT | Tổng calls/day deployment gồm Vision/TTS/RAG; mẫu 200, điều chỉnh theo ngân sách. Kiểm ảnh định kỳ tiêu thụ quota này. |
| SMS_ADAPTER_URL, SMS_ADAPTER_TOKEN | HTTPS adapter nhận JSON phone/code/purpose/request_id và Bearer token. Không log OTP/key. |
| PLANTCARE_DATA_DIR | Compose đặt /data, volume plantcare-data lưu DB/ảnh/export. |
| PLANTCARE_DEPLOYMENT_TARGET | Compose đặt backend, bật kiểm env startup và dispatcher phục hồi job. |
| PLANTCARE_REFERENCE_GUIDE_ENABLED | Compose đặt true để bật hướng dẫn tham khảo theo hồ sơ. Không publish rule/SOP hoặc complete case. |

Compose bind 127.0.0.1:3004. Cấu hình HTTPS ingress của host chuyển tới cổng này, có origin backend riêng. Giữ Set-Cookie/Origin/CSRF, tắt cache API và cho phép thời gian gọi AI. Không đặt PLANTCARE_BACKEND_URL trên backend.

Health tại /api/v1/health. Image chạy user node, có healthcheck, DejaVu Sans tiếng Việt. Thiếu cấu hình bắt buộc dừng startup. Đăng ký chỉ ACTIVE sau OTP đúng, production không có demo auth.

Backend cap multipart tổng 12 MiB; file gốc 10 MiB/30 MP; client chuẩn hóa ảnh cây ≤1920 px/3 MiB. Kiểm lại giới hạn upload/timeout của cả host và Vercel trên deployment thật; smoke local không chứng minh giới hạn hạ tầng ngoài.

## 2. Vercel

Import repo, production branch main:

| Thiết lập | Giá trị |
| --- | --- |
| Framework | Next.js |
| Root Directory | apps/web |
| Include source files outside Root Directory | Bật, vì shared source/lockfile ở root |
| Node | 24.x |
| Install Command | cd ../.. && npm ci |
| Build Command | cd ../.. && npm run build -- --webpack |
| Output Directory | .next |

apps/web/vercel.json chứa install/build/output. apps/web/package.json giúp nhận diện framework/runtime; cài dependency vẫn dùng root lockfile. Không tạo lockfile thứ hai. Nguồn: [monorepo](https://vercel.com/docs/monorepos/monorepo-faq), [Node runtime](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Đặt env theo deploy/vercel.env.example:

    PLANTCARE_BACKEND_URL=https://backend-domain
    APP_ORIGIN=https://ten-du-an.vercel.app

APP_ORIGIN khớp backend và URL người dùng mở. Không đưa Gemini/SMS key hoặc storage vào Vercel. Đổi upstream cần redeploy vì rewrite được tạo lúc build. Đổi domain frontend phải cập nhật cả hai deployment.

## 3. Kiểm tra

    npm.cmd run typecheck
    npm.cmd test
    npm.cmd run test:e2e
    npm.cmd run test:e2e:live
    npm.cmd run test:proxy
    docker build -f deploy/Dockerfile -t plantcare-backend:flow-v2 .
    npm.cmd run test:container

Proxy smoke dùng upstream giả, kiểm body 3 MiB, cookie/CSRF/query/cache và không có frontend DB. Container smoke dùng container/volume riêng: Linux auth/ảnh/guidance/PDF/restart/session/job recovery rồi xóa đúng tài nguyên test. Không dùng dữ liệu hiện có hoặc provider thật. Truyền tag khác: npm run test:container -- <tag>.

Trên URL Vercel thật: đăng ký/OTP → đăng nhập → tạo hồ sơ → upload/chụp → AI tự điền → xác nhận số đo → ảnh hướng dẫn → AI từng bước. Kiểm camera/micro điện thoại HTTPS, phủ định/lệnh hoàn tất, lỗi ảnh, thu hồi quyền, reload, private ảnh giữa hai owner và PDF. Kiểm queued job sau restart; không chỉ xem health/build xanh. Gọi Vision/TTS thật có thể tính phí, dùng ít calls và theo dõi quota. Đã smoke Gemini từ local; chưa kiểm SMS và URL Vercel thật.

## Vận hành và phạm vi

Giữ volume khi cập nhật image: docker compose up -d --build. **Không dùng docker compose down -v với dữ liệu cần giữ.** Sao lưu nhất quán toàn bộ /data và secret trước cập nhật, giữ DB/WAL/files cùng snapshot; thử restore trên staging. Restart smoke không thay backup/restore drill hoặc đo RPO/RTO.

Worker phục hồi QUEUED/RUNNING hết lease bằng logic hiện có. Theo dõi disk, health/5xx, queue age, SMS/Gemini và AI usage. Scale/HA, purge/retention và alert đầy đủ vẫn cần vận hành riêng.

REFERENCE hướng dẫn và ghi nhận bước theo nguồn; ảnh chỉ kiểm phần nhìn thấy. SOP/rule vẫn DRAFT/UNREVIEWED, TRIAL vẫn bị chặn production. Engine trả NEEDS_EXPERT với rules chưa duyệt. FINISHED không đổi case thành PACKED hoặc trừ kho. Triển khai kỹ thuật không thay approval chuyên môn/release gates của plan.md.
