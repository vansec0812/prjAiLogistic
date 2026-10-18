# Đặc tả UI để triển khai

Nguồn SRS p.56-108. Routes là logic nguồn, không endpoint/route đã chạy. Mockup chứa dữ liệu minh họa, không kết quả chuyên môn được áp dụng cho cây thật.

## Tokens và components

- Primary `#146445`, nền `#F4F7F3`, text `#203329`, border `#DCE5DE`; warning `#8A4A00/#FFF0D9`, error `#AC302D/#FCE7E4`. Kiểm contrast khi implement.
- Font Unicode tiếng Việt; body 16 px, labels 14-16 px, heading 24-32 px; lưới 8 px, gutter 16/24 px, radius 12 px, controls/touch >=44 px.
- Mobile 360-767 một cột, nav tối đa 4 mục lõi; 768-1023 một/hai cột; >=1024 sidebar 204-240 px, main max 1200 px; sticky CTA không che field/cảnh báo.
- Components: AppShell/PublicHeader, WizardStepper, UploadCard, SourceBadge, MeasurementField, MaterialEditor, WeatherSourcePanel, RuleTrace, PlanCard, StepViewer, ChecklistItem, VersionTimeline, ShareDialog, TicketThread, RuleEditor, JobTable, BudgetMeter, ConsentPanel, Empty/ErrorState.

## Hành vi xuyên suốt

| Trạng thái | Hành vi bắt buộc |
| --- | --- |
| AI suggested | Badge source, self-confidence đúng nhãn, chưa xác nhận, accept/edit; đo/cân thực vẫn bắt buộc |
| NEED_INPUT / NEEDS_INPUT | Field và lý do cụ thể, focus/link đúng bước; server validation, không chỉ disable CTA |
| QUEUED/RUNNING | Stage thực/poll auth, không % giả; cho rời trang, cancel best-effort; draft không mất |
| FAIL/missing materials | Lý do fit/load/quantity và CTA sửa; không bắt đầu/select; không giả vật tư đang có |
| WARN_ACK/HIGH | Warning ở đầu và bước liên quan; acknowledge chỉ theo rule/code/version; warning hard không dismiss |
| STALE | Nêu input đổi, xem/export old snapshot; generate lại; không start/complete old checklist |
| Offline/409 | Giữ dữ liệu user, báo chưa lưu; retry/reconcile bản server; không ghi Đã lưu trước commit |
| 401/403/404/expired link | Lỗi thân thiện và CTA thích hợp, không lộ tài nguyên/PII; session expiry giữ nội dung an toàn |
| Empty/deleted | Thông tin thực/CTA; không hiển thị seed metrics như dữ liệu user |

Consent không tick sẵn, AI analysis/image/expert share là mục đích riêng. Form label/đơn vị luôn thấy, field errors linked, aria-live status, alt step images; keyboard/focus/modal return. P1 nav/CTA chỉ bật khi feature có backend và acceptance đã đạt.

## 44 màn hình desktop

| UI | Màn hình | Route logic nguồn | FR | Trang mockup | Release / ghi chú |
| --- | --- | --- | --- | --- | --- |
| UI-01 | Trang chủ | `/` | FR-06 | 64 | R1; public shell tối thiểu R0, CMS/library đầy đủ R1 |
| UI-02 | Thư viện và bài hướng dẫn | `/guides` | FR-06, FR-41 | 65 | R1; public shell tối thiểu R0, CMS/library đầy đủ R1 |
| UI-03 | Đăng nhập | `/login` | FR-03 | 66 | R0 |
| UI-04 | Đăng ký | `/register` | FR-01 | 67 | R0 |
| UI-05 | Xác minh SMS OTP | `/verify-phone` | FR-02 | 68 | R0 |
| UI-06 | Khôi phục mật khẩu | `/reset-password` | FR-04 | 69 | R0 |
| UI-07 | Tổng quan người dùng | `/app` | FR-07, FR-26, FR-29 | 70 | R0 lõi / R1 mở rộng |
| UI-08 | Ảnh cây và quyền gửi AI | `/app/cases/:id/plant/photos` | FR-08, FR-09, FR-48 | 71 | R0 |
| UI-09 | Xác nhận thông tin cây | `/app/cases/:id/plant` | FR-09, FR-10 | 72 | R0 |
| UI-10 | Ảnh vật tư | `/app/cases/:id/materials/photos` | FR-11 | 73 | R0 |
| UI-11 | Khai báo vật tư và hộp | `/app/cases/:id/materials` | FR-12 | 74 | R0 |
| UI-12 | Hành trình và nhiệt độ | `/app/cases/:id/shipment` | FR-14, FR-15 | 75 | R0 |
| UI-13 | Xem lại hồ sơ | `/app/cases/:id/review` | FR-16, FR-17 | 76 | R0 |
| UI-14 | Tiến trình xử lý | `/app/jobs/:id` | FR-17, FR-40 | 77 | R0 |
| UI-15 | Kết quả phương án | `/app/cases/:id/plans` | FR-18, FR-19, FR-21 | 78 | R0 |
| UI-16 | So sánh phương án | `/app/cases/:id/compare` | FR-20 | 79 | R1 |
| UI-17 | Hướng dẫn từng bước | `/app/cases/:id/steps/:n` | FR-21 | 80 | R0 |
| UI-18 | Checklist và hoàn tất | `/app/cases/:id/checklist` | FR-22, FR-23 | 81 | R0 lõi / R1 mở rộng |
| UI-19 | Lịch sử hồ sơ | `/app/history` | FR-26, FR-47 | 82 | R0 lõi / R1 mở rộng |
| UI-20 | Phiên bản và phản hồi | `/app/cases/:id/versions` | FR-26, FR-28 | 83 | R0 lõi / R1 mở rộng |
| UI-21 | Kho vật tư cá nhân | `/app/materials` | FR-13 | 84 | R1 |
| UI-22 | Mẫu đóng gói | `/app/templates` | FR-27 | 85 | R1 |
| UI-23 | Trung tâm thông báo | `/app/notifications` | FR-29 | 86 | R1 |
| UI-24 | Hỗ trợ và trao đổi | `/app/support/:ticket?` | FR-30, FR-31 | 87 | R1 |
| UI-25 | Tài khoản và quyền riêng tư | `/app/settings` | FR-05, FR-33, FR-48 | 88 | R0 lõi / R1 mở rộng |
| UI-26 | Chia sẻ và xem liên kết | `/shared/:token` | FR-49 | 89 | R0; owner quản lý bằng dialog dưới case, D-07 |
| UI-27 | Tổng quan quản trị | `/admin` | FR-39, FR-42 | 90 | R0 lõi / R1 mở rộng |
| UI-28 | Người dùng và quyền | `/admin/users` | FR-34 | 91 | R0 |
| UI-29 | Danh mục cây và vật tư | `/admin/catalogs` | FR-35, FR-36 | 92 | R0 lõi / R1 mở rộng; catalog tối thiểu cần cho engine, D-03 |
| UI-30 | Rule Engine và phiên bản | `/admin/rules` | FR-37 | 93 | R0 |
| UI-31 | Cấu hình Google AI Studio | `/admin/integrations` | FR-38, FR-43 | 94 | R0 |
| UI-32 | Tác vụ và ngân sách AI | `/admin/ai/jobs` | FR-39, FR-40 | 95 | R0 |
| UI-33 | CMS và thư viện minh họa | `/admin/content` | FR-36, FR-41 | 96 | R0 lõi / R1 mở rộng |
| UI-34 | Hàng đợi chuyên gia | `/expert/tickets` | FR-30, FR-32 | 97 | R1 |
| UI-35 | Duyệt hồ sơ bởi chuyên gia | `/expert/tickets/:id` | FR-32 | 98 | R1 |
| UI-36 | Chất lượng nhận diện | `/admin/ai/quality` | FR-50 | 99 | R0 |
| UI-37 | Trạng thái lỗi và dữ liệu trống | `/system-states` | FR-44 | 100 | R0; states trong component/flow, không cần route production demo |
| UI-38 | Đặc tính cây và chi tiết chậu | `/app/cases/:id/plant/traits` | FR-10 | 101 | R0 |
| UI-39 | Nguồn nhiệt độ và thời lượng | `/app/cases/:id/shipment/context` | FR-15, FR-51 | 102 | R0 |
| UI-40 | Chi tiết bài hướng dẫn | `/guides/:slug` | FR-06, FR-41 | 103 | R1; public shell tối thiểu R0, CMS/library đầy đủ R1 |
| UI-41 | Hỏi đáp theo hồ sơ | `/app/cases/:id/chat` | FR-25 | 104 | R1 |
| UI-42 | Trang người nhận liên kết | `/shared/:token` | FR-49 | 105 | R0; recipient public chỉ xem scope |
| UI-43 | Chỉnh sửa rule cấu hình | `/admin/rules/:id/edit` | FR-37 | 106 | R0 |
| UI-44 | Soạn và duyệt nội dung | `/admin/content/:id/edit` | FR-36, FR-41 | 107 | R0 lõi / R1 mở rộng |

## 4 màn hình mobile

| UI | Nội dung | FR / NFR | Trang | Gate |
| --- | --- | --- | --- | --- |
| UI-M01 | Chụp/tải ảnh, camera fallback, consent | FR-08,48; NFR-08,09 | 108 | R0; >=360 px, CTA 44 px |
| UI-M02 | Xác nhận số đo/khối lượng với đơn vị | FR-10; NFR-08,09,13 | 108 | R0; decimal comma/dot, đo/cân xác nhận |
| UI-M03 | Step đầy màn hình, hình và warning | FR-21; NFR-08,09 | 108 | R0; prev/next, không che warning |
| UI-M04 | Checklist/required checks | FR-22,23; NFR-08,09 | 108 | R0 progress; completion R1 |

Mobile variants dùng cùng domain/API, không thêm bốn backend feature riêng. Form measurement traits/context có subroute như SRS nhưng giữ wizard bốn nhóm: Cây -> Vật tư -> Hành trình -> Xem lại.

## UI QA và lệch mockup

Kiểm 360/390/768/1440px, zoom 200%, keyboard/screen reader và focus/contrast. Mockup p.75 đánh dấu carrier bắt buộc trong khi FR-14 nói tùy chọn: làm theo FR, nếu cần carrier limits thì hỏi dữ liệu giới hạn tương ứng, không ép chọn một carrier không biết. p.78 vừa ghi hộp đã xác nhận tải trọng vừa yêu cầu xác nhận: chỉ trình bày trạng thái từ engine thực, thiếu tải trọng không tạo PASS. UI-26 shell owner và UI-42 shell public được tách theo quyền. Các ví dụ hình/thao tác/metrics chỉ là mẫu cần duyệt.

## Flow hiện hành theo yêu cầu người dùng — 18/10/2026

Tạo hồ sơ tại /app/new → plant (thông số + upload/chụp tự nhận diện) → instructions (5 ảnh hướng dẫn, CTA Bắt đầu với AI) → guide (camera + bước hiện tại). Trường đã nhập/confirmed không bị overwrite. Ảnh thật phong cách chụp vẫn có nhãn minh họa AI, nhóm khác dùng SVG. Vật tư/hành trình/phương án tiếp tục là nhánh đầy đủ tùy chọn từ màn kết quả.

Guide có một CTA Đã xong bước này, kiểm ảnh, nhắc lại và báo lỗi; micro/quyền kiểm ảnh bật riêng. Lỗi hiện ngay khi có kết quả, giữ bước và remedy; lỗi người dùng báo được lưu. Resolve không skip; resume media off. Copy kỹ thuật/provider/privacy/trạng thái review ở details, bỏ banner local lặp lại. Mobile 390 px được kiểm overflow và screenshot tại output/qa/*-v3.png (ignored). Chi tiết contract tại ../GUIDED_PACKING.md; không sửa danh mục UI/SRS cũ thành nghiệm thu toàn bộ.
