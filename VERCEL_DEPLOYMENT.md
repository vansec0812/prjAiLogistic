# Kiểm tra trước khi deploy Vercel

Ngày kiểm tra: 18/10/2026. Mã `dev-nam` được tích hợp cùng bản RAG/report hiện có. **Chưa sẵn sàng vận hành toàn bộ ứng dụng trên Vercel nguyên trạng.** Task này merge/kiểm mã, không tạo deployment hoặc dịch vụ ngoài.

## Điểm chặn runtime

| Thành phần hiện tại | Việc cần xử lý |
| --- | --- |
| `server/db.ts`: SQLite local trong `.data`, chứa users/sessions/jobs/quota | DB bền vững dùng chung qua network và adapter/migration; giữ transaction/idempotency/owner/lease/quota. Chỉ thêm DATABASE_URL không đổi được SQLite đồng bộ hiện tại. |
| Upload/export và OTP HMAC secret ghi filesystem | Object storage private và secret OTP ổn định dùng chung. `/tmp` không thay storage bền vững. |
| `jobs.ts`: worker `setTimeout(...).unref()` trong process | Worker/queue hoặc execution model được hỗ trợ, kiểm lease/retry/cancel/restart; không dựa vào process sống sau response. |
| PDF tìm Arial Windows/DejaVu Linux trên máy | Bundle font tiếng Việt có quyền phân phối phù hợp; kiểm tracing và runtime đọc font. |
| SMS/rule/SOP gates | SMS adapter thật, origin/secrets; production tiếp tục chặn rule/SOP chưa duyệt. Không bật demo hoặc đổi NODE_ENV để lách gate. |

Vercel xác nhận SQLite local không có storage bền vững dùng chung giữa function instances: [SQLite trên Vercel](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel). Functions có execution duration hữu hạn: [Function duration](https://vercel.com/docs/functions/configuring-functions/duration). Build qua không loại bỏ các điểm chặn này; `vercel.json`/tăng timeout không thay adapter DB/storage/worker.

## Cấu hình build tham khảo sau khi xử lý runtime

Repo đặt package.json/lockfile ở root, Next app tại `apps/web`, shared source tại `packages`. Với **Root Directory `apps/web`**, chọn preset **Next.js**, Node **24.x**, bật **Include source files outside of the Root Directory in the Build Step**. Install Command có thể override `cd ../.. && npm ci`, Build Command `cd ../.. && npm run build`; output `.next` trong app root. Chưa kiểm bằng Vercel deployment thực tế; sau chuyển backend phải kiểm tracing/assets/font trên môi trường Linux.

Nguồn: [monorepo root/source](https://vercel.com/docs/monorepos/monorepo-faq), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). Không static export app hiện cần auth/API/private storage.

Env production: APP_ORIGIN đúng domain HTTPS, PLANTCARE_MODE=production, SMS adapter và secrets tương ứng; Gemini keys/models chỉ phía server, không NEXT_PUBLIC. `.env.example` là mẫu development. Env DB/storage/queue mới chỉ có tác dụng sau khi viết adapter tương ứng.

## Kiểm bản gộp local

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run test:e2e:live
npm.cmd run test:production
```

Workflow dùng port 3001; SOP/camera/voice giả lập dùng riêng 3107. Provider thật trong `playwright.gemini.config.ts` cần opt-in và có thể tốn quota; không chạy trong task merge. Local pass không thay kiểm Vercel/Linux, provider thật, micro vật lý hoặc approval chuyên môn.

Kết quả/trace tách tại `test-results/workflow`, `test-results/live`, `test-results/gemini` để không xóa artifact của bộ khác. Bộ camera/voice có timeout test 90 giây cho luồng nhiều bước và cold compilation dev trên Windows; không thay timeout provider hoặc ngưỡng nghiệp vụ, không là bằng chứng đạt mục tiêu performance production.

## Hướng triển khai cần chốt

- Toàn bộ backend serverless: migrate DB/network, object storage, secrets và worker; staging kiểm auth/session giữa instance, upload/export private, job recovery và concurrent completion trước production.
- Giữ backend Node trên host có persistent volume/worker: cần thiết kế frontend Vercel gọi backend HTTPS, routing/cookies/origin/CSRF. Repo chưa có cấu hình tách backend đó.

Không tự chọn dịch vụ, bật billing hoặc migrate dữ liệu thật trong task merge.
