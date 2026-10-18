# Deploy frontend Vercel và backend Node có ổ lưu trữ

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
