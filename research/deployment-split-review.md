# Review: Vercel frontend + Node persistent backend

Ngày kiểm tra: **2026-10-18**. Scope: nghiên cứu/configuration proposal; không deploy, tạo dịch vụ, chạy container hoặc bật billing. Đã đọc `VERCEL_DEPLOYMENT.md`, `apps/web/next.config.ts`, `server/security.ts`, `db.ts`, `jobs.ts`, API route/upload/export, client API helper và package scripts. Chỉ ghi file này; đề xuất dưới đây chưa là cấu hình đã triển khai.

## Phương án cụ thể

Giữ browser gọi **relative URL `/api/v1/...`** như `components/common.tsx`. Vercel chỉ phục vụ frontend và external rewrite tới một backend HTTPS luôn chạy; backend giữ Next Route Handlers hiện có để tránh đổi toàn bộ application layer. Backend có một replica trên một host với persistent local volume; frontend không được ghi SQLite/files hay chạy worker.

Ví dụ hai origin **placeholder**: frontend `https://plantcare.example.com`, backend `https://backend.example.com`. Backend TLS reverse proxy chỉ chuyển `/api/v1/` tới Node, không công khai `.data` hoặc thư mục volume. Next chính thức khuyên reverse proxy trước server tự host để xử lý body limits/slow requests/rate limits: [Next self-hosting](https://nextjs.org/docs/app/guides/self-hosting).

### Rewrite đề xuất cho build frontend

Trong `next.config.ts`, chỉ bật cấu hình này ở build target frontend, không bật trên backend:

```ts
async rewrites() {
  const upstream = process.env.PLANTCARE_BACKEND_URL; // build-time, HTTPS origin only
  if (!upstream) return { beforeFiles: [], afterFiles: [], fallback: [] };
  // Before returning: validate URL protocol=https:, no credentials/path/query/hash.
  const origin = new URL(upstream).origin;
  return {
    beforeFiles: [{
      source: '/api/v1/:path*',
      destination: `${origin}/api/v1/:path*`,
    }],
    afterFiles: [],
    fallback: [],
  };
}
```

Đây là fragment minh họa, chưa gồm validation/target guard đầy đủ. Frontend production thiếu upstream phải **fail build**, không âm thầm dùng API local. Backend phải bỏ upstream để tránh rewrite vòng lặp. Dùng `beforeFiles`: repo đã có API catchall, nên `fallback` có thể bị route local bắt trước. Kiểm manifest sau build để chắc API chỉ đi external. Không biến đích upstream thành URL từ request/client (SSRF). [Next rewrites: order và external URLs](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites).

Không tạo BFF Route Handler dùng `fetch` chỉ để relay bytes: sẽ đưa upload/export qua Vercel Function. Giữ một nguồn cấu hình routing; không thêm rewrite chồng chéo trong `vercel.json` khi Next config đã đảm nhiệm.

### Env và quyền

| Môi trường | Giá trị đề xuất |
| --- | --- |
| Vercel frontend build | `PLANTCARE_BACKEND_URL=https://backend.example.com`; target frontend explicit; Node 24.x; không Gemini/SMS secret/SQLite volume |
| Backend runtime | `NODE_ENV=production`, `PLANTCARE_MODE=production`, `APP_ORIGIN=https://plantcare.example.com`, `PLANTCARE_DATA_DIR=/var/lib/plantcare` |
| PDF backend | `PLANTCARE_PDF_FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`; cài font trong image Linux và xác nhận license gói |
| Backend provider | Gemini/SMS keys và model qua runtime secret/env, không build arg hoặc `NEXT_PUBLIC_*` |

Giữ `pc-session` **không Domain**, `Path=/`, `HttpOnly`, `Secure`, `SameSite=Lax` như code production. Response `Set-Cookie` đi qua proxy và cookie được browser dùng tại frontend origin: đây là thiết kế same-origin cần xác minh bằng staging browser, không tuyên bố đã test Vercel. Cookie logout phải hết hạn cùng name/path/attributes. Không set `Domain=backend.example.com` hoặc `.vercel.app`. Next mô tả cookie options và domain/protocol khi xóa: [Next cookies](https://nextjs.org/docs/app/api-reference/functions/cookies). Vercel không cho cookie cấp apex `vercel.app`: [Vercel public suffix](https://vercel.com/kb/guide/can-i-set-a-cookie-from-my-vercel-project-subdomain-to-vercel-app).

`checkOrigin()` hiện so sánh đúng một `APP_ORIGIN`; backend phải nhận **Origin của frontend**, không lấy backend URL hay tự tin `Host`/`X-Forwarded-Host`. Giữ `x-csrf-token` gắn session cho private mutations; auth mutations vẫn cần Origin. Không mở wildcard CORS hoặc `*.vercel.app`. Preview dùng backend/data riêng với origin preview đã chốt; chưa cấu hình thì mutation từ preview phải bị từ chối. Không chuyển client sang gọi cross-origin vì sẽ đổi cookie/CORS/CSP contract.

Vercel forward thông tin visitor qua `x-real-ip`/`x-forwarded-*`; chỉ trust khi ingress thực sự xác thực nguồn. Có thể chặn bypass backend bằng secret header do Vercel **set/replace tại routing layer** rồi constant-time compare tại ingress/backend. Không đưa secret vào JS hoặc bảo rằng chỉ kiểm Origin là xác thực proxy. Cơ chế transform/env được mô tả tại [Vercel external rewrites](https://vercel.com/docs/routing/rewrites); nếu dùng phải kiểm khả năng áp dụng với cấu hình Next-generated routing, không copy config cấp thấp đè routes hiện có.

## Body, cache và timeout

| Điểm | Đánh giá cho repo |
| --- | --- |
| Upload app | `req.formData()` được parse **trước** kiểm file `<=10*1024*1024`; file-limit không là request-memory limit. Cần total request bound và reject sớm tại ingress; không chỉ tin Content-Length. |
| Backend TLS proxy | Đề xuất tổng multipart tối đa **12 MiB**, timeout/header/body limits hợp lý; app vẫn giữ file cap **10 MiB** và decode/pixel/owner/consent checks. Một ảnh/request; không gộp 6 ảnh thành một multipart lớn. Đây là config SE đề xuất, không giới hạn do Vercel công bố. |
| Vercel Function | Request/response tối đa **4.5 MB**; tăng `maxDuration`, Server Actions bodySizeLimit không sửa cap này. Tránh relay upload/PDF/ZIP qua Function. [Function limitations](https://vercel.com/docs/functions/limitations). |
| External rewrite | Proxy request timeout **120 giây**; enqueue trả 202 nhanh rồi poll job. Không chờ AI/export đồng bộ đủ 180 giây trên một HTTP request. [Vercel limits](https://vercel.com/docs/limits). |
| Chưa xác minh | Tài liệu đọc không nêu rõ universal payload cap của external rewrite. Không suy Function 4.5 MB áp cho mọi rewrite, cũng không bảo đảm file 10 MiB chắc qua. Cần staging test file cap + multipart overhead và export lớn. |
| Next Proxy middleware | `proxyClientMaxBodySize` experimental, áp khi có `proxy.ts`, có thể chỉ buffer partial body; không là upload reject gate production. Không thêm middleware đọc body ở frontend. [Next option](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize). |
| Private cache | Upstream giữ `Cache-Control: no-store` cho session/jobs/share/export và `private,no-store` cho ảnh. Không gửi public/s-maxage. Vercel hiện tôn trọng cache header upstream cho external rewrites trên project mới; đề xuất thêm `x-vercel-enable-rewrite-caching: 0` cho `/api/v1/:path*` để tắt rõ ràng. [Rewrite caching](https://vercel.com/docs/routing/rewrites). |

Lưu ý lỗi 413/502 từ proxy có thể là HTML/text; API helper hiện `response.json()` vô điều kiện sẽ mất thông báo hữu ích. Cần UI giữ nội dung, báo lỗi proxy/network và cho thử lại idempotently; đừng biến parse lỗi thành thành công.

## Docker/backend bền vững

Đề xuất image `node:24-bookworm-slim`, resolve/pin digest lúc build được kiểm, build Linux bằng `npm ci` từ lockfile để Sharp/native dependencies đúng platform. Không copy `node_modules` Windows. Docker official có Node 24 Debian variants: [Node image](https://hub.docker.com/_/node), [official image repository](https://github.com/nodejs/docker-node). Multi-stage build, non-root, runtime-only dependencies phù hợp hướng dẫn [Docker Node.js](https://docs.docker.com/guides/nodejs/).

- Nếu dùng `output: 'standalone'`: thêm tracing root monorepo; copy đầy đủ artifact root/`apps/web` đúng layout và copy `public`, `.next/static`, data JSON/ảnh cần export; kiểm font. `turbopack.root` hiện có không thay `outputFileTracingRoot`. [Next output/tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
- Node trong container phải bind `0.0.0.0`, không dùng nguyên `npm start` hiện bind `127.0.0.1`. Ví dụ full-install runtime: `node node_modules/next/dist/bin/next start apps/web --hostname 0.0.0.0 --port 3000`; standalone dùng `HOSTNAME=0.0.0.0 PORT=3000 node apps/web/server.js` sau kiểm đúng layout.
- Mount **cả** `/var/lib/plantcare` read-write cho user runtime: SQLite, `-wal`/`-shm`, `otp-secret`, uploads, exports. Không chỉ mount file `.sqlite`. Không bake `.env`, `.data`, backup hoặc secrets vào image.
- Dùng named local volume có tên ổn định; recreate container giữ volume. Volume không là backup, `down -v` có thể mất dữ liệu; cần backup nhất quán DB/files/OTP secret và diễn tập restore. [Docker volumes](https://docs.docker.com/engine/storage/volumes/).
- Giữ **một replica trên cùng host**, không đặt WAL database trên NFS chia cho nhiều node. [SQLite WAL](https://sqlite.org/wal.html). Node 24 có `node:sqlite`, cần test đúng image Node đã pin: [Node 24 SQLite](https://nodejs.org/docs/latest-v24.x/api/sqlite.html).

Compose fragment đề xuất, chưa chạy (TLS proxy ở host/sidecar, không có domain thật):

```yaml
services:
  backend:
    image: plantcare-backend:reviewed-build
    init: true
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PLANTCARE_MODE: production
      APP_ORIGIN: https://plantcare.example.com
      PLANTCARE_DATA_DIR: /var/lib/plantcare
    volumes:
      - plantcare-data:/var/lib/plantcare
    ports:
      - '127.0.0.1:3000:3000'
volumes:
  plantcare-data:
    name: plantcare-data
```

Cần tạo quyền volume cho user non-root trước runtime; không đặt password/API key mẫu trong Compose. TLS proxy chịu HTTPS/public ingress và chỉ chuyển API; port loopback ở fragment chỉ dành host proxy.

### Worker còn phải xử lý

`wakeWorker()` hiện được gọi khi có request, chỉ chạy tối đa 20 jobs/batch bằng timer `unref`. Persistent server giúp process sống nhưng **không tự phục hồi queue khi restart mà chưa có request**, hoặc xử lý phần còn lại sau một batch trong lúc idle. Thêm startup recovery và periodic dispatcher có guard overlap, giữ transaction/lease/fencing/cancel; Next backend singleton là nơi chạy, frontend không khởi động worker. Có graceful shutdown/drain và kiểm restart giữa job. Không coi `restart: unless-stopped` hoặc health GET đánh thức worker là durability design hoàn chỉnh.

## Khả năng kiểm chứng tại máy hiện tại

Chỉ chạy version/context checks read-only:

| Lệnh | Kết quả |
| --- | --- |
| `node --version` / `npm.cmd --version` | v24.19.0 / 11.17.0 |
| `docker version --format '{{json .}}'` | Client 29.8.2, context desktop-linux; Server null. Không nối được `//./pipe/dockerDesktopLinuxEngine` (pipe chưa tồn tại). |
| `docker compose version` | Docker Compose v5.6.0 |
| `docker context show` | desktop-linux |

**Chưa build/run Docker, chưa test image Linux/volume/font, chưa có Vercel deployment.** Không tự bật Docker Desktop. Local Node pass không thay chứng cứ Linux/Vercel.

Khi engine khả dụng, cần kiểm riêng: build image sạch; login→session→mutation→logout qua frontend HTTPS; Origin/CSRF sai bị 403; cookie không Domain và Secure; không cache/private cross-owner; multipart sát 10 MiB và quá cap; export lớn qua rewrite; kill/restart job khi idle; recreate container giữ DB/ảnh/secret; concurrent completion không nhân movement; proxy timeout không nhân side effect; backend URL không vòng lặp. Rule/SOP/SMS/provider production gates tiếp tục fail closed.
