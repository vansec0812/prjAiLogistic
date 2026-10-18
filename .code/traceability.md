# Truy vết yêu cầu PlantCare

Nguồn: SRS p.7-8 (UR), p.15-32 (FR), p.52-54 (NFR), p.59-108 (UI), p.109-113 (TC).

Tất cả hàng **OPEN** về nghiệm thu đầy đủ/release. Website local đã có implementation/test evidence cho một phần luồng, ghi tại [implementation.md](implementation.md); chưa đủ điều kiện đóng các hàng vì provider, rule approval, policy và nhiều acceptance còn thiếu. Mốc là đề xuất kế hoạch; P0/P1, UR và acceptance theo PDF. TC trong cột test là truy vết gốc khi có; phần kiểm bổ sung là kế hoạch của SE. UI không có row riêng cho mọi modal/API.

## 53 yêu cầu chức năng

| FR | P / nguồn / UR | Nội dung | Trang | Mốc | UI | Test nguồn / bổ sung | Acceptance từ SRS | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FR-01 | P0 / Gốc / UR-01 | Đăng ký tài khoản | 15 | M2 | UI-04 | TC-01 | Dữ liệu hợp lệ và OTP đúng tạo đúng một tài khoản; thiếu tên hoặc sai định dạng không tạo bản ghi hoạt động. | OPEN |
| FR-02 | P0 / Gốc / UR-01 | Gửi và xác minh OTP qua SMS | 15 | M2 | UI-05 | TC-01 | Mã hết hạn, dùng lại hoặc nhập cho số khác đều bị từ chối; mã đúng chỉ dùng được một lần. | OPEN |
| FR-03 | P0 / Bổ sung / UR-01 | Đăng nhập và quản lý phiên | 15 | M2 | UI-03 | TC-01 | Đăng xuất rồi gọi API riêng tư trả 401; sai mật khẩu dùng thông báo chung; phiên hết hạn đưa về đăng nhập. | OPEN |
| FR-04 | P0 / Bổ sung / UR-01 | Quên và đổi mật khẩu | 16 | M2 | UI-06 | TC-01 | Token dùng lại bị chặn; mật khẩu cũ không đăng nhập được; lỗi SMS không làm mất tài khoản. | OPEN |
| FR-05 | P1 / Bổ sung / UR-10 | Hồ sơ và thay đổi số điện thoại | 16 | M7b | UI-25 | Integration đổi số/reauth; XT-AUTH | Số mới chỉ thay thế sau xác minh; người dùng không thể nâng quyền bằng request sửa hồ sơ. | OPEN |
| FR-06 | P1 / Bổ sung / UR-12 | Trang chủ và thư viện kiến thức | 16 | M7b | UI-01, UI-02, UI-40 | Public published/search/404 | Khách mở URL bài công khai được; bài nháp trả 404; kết quả tìm kiếm không chứa hồ sơ riêng tư. | OPEN |
| FR-07 | P0 / Bổ sung / UR-02 | Tạo hồ sơ đóng gói và lưu nháp | 17 | M2 | UI-07 | TC-02 | Tải lại trang mở đúng dữ liệu đã lưu; hai tab sửa đồng thời không ghi đè âm thầm. | OPEN |
| FR-08 | P0 / Gốc / UR-02 | Chụp hoặc tải ảnh cây | 17 | M2 | UI-08 | TC-02 | Ảnh sai định dạng hoặc vượt giới hạn bị chặn riêng từng file; từ chối camera không chặn nhập thủ công. | OPEN |
| FR-09 | P0 / Gốc / UR-02 | AI gợi ý nhận dạng cây | 17 | M4 | UI-08, UI-09 | Vision/schema/USER precedence; XT-BUDGET | AI không nhận ra vẫn tiếp tục bằng chọn danh mục/nhập tay; mỗi trường gợi ý có nguồn AI và trạng thái chưa xác nhận. | OPEN |
| FR-10 | P0 / Gốc / UR-03 | Xác nhận đặc tính và số đo cây | 18 | M2 | UI-09, UI-38 | TC-02 | Không sinh phương án khi thiếu số đo bắt buộc; chỉnh gợi ý AI không bị ghi đè ở lần phân tích sau. | OPEN |
| FR-11 | P0 / Gốc / UR-04 | Ảnh vật tư và dụng cụ sẵn có | 18 | M2/M4 | UI-10 | TC-02 | Ảnh không nhận dạng được dẫn đến biểu mẫu nhập tay; AI không tạo số lượng có sẵn nếu người dùng chưa xác nhận. | OPEN |
| FR-12 | P0 / Gốc / UR-04 | Khai báo hộp và vật tư thủ công | 18 | M2/M3 | UI-11 | TC-03 | Hộp 25 x 25 x 40 cm không được chọn cho bao hình cây 30 x 30 x 55 cm cộng đệm; vật tư thiếu được liệt kê rõ. | OPEN |
| FR-13 | P1 / Bổ sung / UR-04 | Kho vật tư cá nhân | 19 | M7a | UI-21 | TC-08 mở rộng kho; XT-CONCURRENCY | Sửa vật tư trong kho không làm thay đổi phương án cũ; hoàn tất hai lần không trừ kho hai lần. | OPEN |
| FR-14 | P0 / Gốc / UR-05 | Thông tin vận chuyển | 19 | M2 | UI-12 | Date/duration/orientation validation | Ngày gửi quá khứ bị chặn khi tạo yêu cầu mới; không tự suy ra thời gian hành trình chắc chắn từ khoảng cách. | OPEN |
| FR-15 | P0 / Gốc / UR-05 | Nhiệt độ môi trường và dự báo | 19 | M4 | UI-12, UI-39 | TC-04 | API thời tiết lỗi/hết tầm dự báo cho nhập tay; dữ liệu quá hạn không được hiển thị như dữ liệu mới. | OPEN |
| FR-16 | P0 / Bổ sung / UR-06 | Ưu tiên và xem lại dữ liệu đầu vào | 20 | M2/M5 | UI-13 | TC-04; Manual consent-off E2E | Nút tạo bị vô hiệu khi thiếu dữ liệu cứng; link mở đúng bước; consent AI không tick sẵn; không consent vẫn tạo bằng engine và sơ đồ thư viện. | OPEN |
| FR-17 | P0 / Bổ sung / UR-06 | Tạo tác vụ xử lý bất đồng bộ | 20 | M4 | UI-13, UI-14 | TC-05 | Double-click không tạo hai job cùng khóa; đóng trình duyệt không làm mất job; mở lại xem được trạng thái. | OPEN |
| FR-18 | P0 / Gốc / UR-06 | Rule Engine tạo phương án đóng gói | 20 | M3 | UI-15 | TC-03, TC-06 | Mỗi phương án có trace rule_id/version; AI ngừng hoạt động vẫn tạo được kế hoạch bằng đầu vào thủ công và rule/template; thiếu điều kiện trả NEEDS_INPUT/NEEDS_EXPERT. | OPEN |
| FR-19 | P0 / Bổ sung / UR-06 | Kiểm ràng buộc và vật tư còn thiếu | 21 | M3/M5 | UI-15 | TC-03, TC-06 | Không hiển thị nút bắt đầu đóng gói cho phương án FAIL; Phương án hộp quá nhỏ bị loại và ghi lý do có thể đọc được. | OPEN |
| FR-20 | P1 / Bổ sung / UR-07 | So sánh và lựa chọn phương án | 21 | M7c | UI-16 | TC-07; <=3 alternatives, cost completeness | Giá thiếu hiện Chưa đủ dữ liệu thay vì 0; phương án được chọn lưu với phiên bản và input hash. | OPEN |
| FR-21 | P0 / Gốc / UR-06 | Minh họa đầy đủ từng bước | 21 | M3/M5 | UI-15, UI-17 | TC-06 | 100% bước có hình hoặc sơ đồ hợp lệ; ảnh tạo lỗi không làm mất hướng dẫn; số bước và số hình khớp nhau. | OPEN |
| FR-22 | P0 / Bổ sung / UR-08 | Checklist và ảnh kiểm tra đóng gói | 22 | M5 | UI-18 | TC-08 | Tải lại giữ tiến độ; chưa xác nhận bước bắt buộc không thể hoàn tất; ảnh kiểm tra thuộc đúng hồ sơ. | OPEN |
| FR-23 | P1 / Bổ sung / UR-08 | Hoàn tất và ghi nhận dùng vật tư | 22 | M7a | UI-18 | TC-08; XT-CONCURRENCY multi-material | Request lặp trả cùng kết quả; tồn thiếu yêu cầu điều chỉnh; đã PACKED vẫn xuất được hướng dẫn. | OPEN |
| FR-24 | P0 / Bổ sung / UR-08 | Xuất PDF và bản in hướng dẫn | 22 | M5 | API/flow liên quan | TC-09 | PDF khớp phương án được chọn, font không lỗi; không chứa điện thoại hoặc khóa API; export lỗi có thử lại. | OPEN |
| FR-25 | P1 / Bổ sung / UR-09 | Hỏi AI trong ngữ cảnh hồ sơ | 23 | M7c | UI-41 | Chat read-only/injection/consent/quota | Câu hỏi về dữ liệu chưa có được hỏi lại; câu trả lời không tự đánh dấu checklist hoặc trừ kho. | OPEN |
| FR-26 | P0 / Bổ sung / UR-09 | Lịch sử và phiên bản phương án | 23 | M5 | UI-07, UI-19, UI-20 | TC-07 | Sau sửa chiều cao, phiên bản cũ còn nguyên; hồ sơ của tài khoản khác không xuất hiện trong tìm kiếm. | OPEN |
| FR-27 | P1 / Bổ sung / UR-07 | Nhân bản hồ sơ và lưu mẫu | 23 | M7a | UI-22 | TC-07 | Mẫu mở lại yêu cầu xác nhận số đo và ngày gửi; không tự chạy AI hoặc tiêu hao quota. | OPEN |
| FR-28 | P1 / Bổ sung / UR-09 | Đánh giá kết quả sau vận chuyển | 24 | M7a | UI-20 | Feedback version/owner/history | Feedback gắn đúng phiên bản đã sử dụng; người dùng sửa được; admin xem báo cáo tổng hợp theo quyền. | OPEN |
| FR-29 | P1 / Bổ sung / UR-10 | Thông báo trong website | 24 | M7a | UI-07, UI-23 | Event dedup/preferences/no SMS nghiệp vụ | Một sự kiện chỉ tạo một thông báo; tùy chọn in-app không tắt OTP; không gửi SMS nghiệp vụ ngoài mục đích xác thực. | OPEN |
| FR-30 | P1 / Bổ sung / UR-11 | Tạo yêu cầu hỗ trợ hoặc chuyên gia | 24 | M7b | UI-24, UI-34 | TC-10 | Không đồng ý chia sẻ thì ticket chỉ chứa mô tả; chuyên gia chưa phân công không đọc được ảnh hồ sơ. | OPEN |
| FR-31 | P1 / Bổ sung / UR-11 | Trao đổi hỗ trợ và đóng yêu cầu | 25 | M7b | UI-24 | TC-10 | Tin nhắn mới có thông báo; người ngoài ticket bị 403/404; nội dung HTML được escape. | OPEN |
| FR-32 | P1 / Bổ sung / UR-11 | Chuyên gia duyệt phương án | 25 | M7b | UI-34, UI-35 | TC-10 | Bản điều chỉnh có tác giả và lý do; expert không tự hoàn tất checklist hoặc đổi số đo của chủ hồ sơ. | OPEN |
| FR-33 | P1 / Bổ sung / UR-10 | Tải dữ liệu và xóa tài khoản | 25 | M7b | UI-25 | TC-12 | Người dùng tải được dữ liệu của mình; link hết hạn bị chặn; sau purge không còn ảnh truy cập được qua URL cũ. | OPEN |
| FR-34 | P0 / Bổ sung / UR-13 | Quản lý người dùng và vai trò | 26 | M2/M5 | UI-28 | TC-11; XT-CONCURRENCY last admin | Member không gọi được API admin; admin cuối cùng được bảo vệ; audit thể hiện trước/sau nhưng không chứa mật khẩu. | OPEN |
| FR-35 | P1 / Bổ sung / UR-12 | Danh mục cây và đặc tính | 26 | M3 tối thiểu / M7b đầy đủ | UI-29 | TC-11 | Phương án chỉ tham chiếu bản published; archive không làm mất tên cây trong lịch sử snapshot. | OPEN |
| FR-36 | P0 / Bổ sung / UR-12 | Danh mục vật tư và sơ đồ bước | 26 | M3 | UI-29, UI-33, UI-44 | TC-11 | Mọi step_code sử dụng có hình published; thiếu hình chặn xuất bản rule/template có tham chiếu đó. | OPEN |
| FR-37 | P0 / Bổ sung / UR-13 | Quy tắc đóng gói và vận chuyển | 27 | M3 | UI-30, UI-43 | TC-11 | Rule đổi chỉ tác động job mới; rollback có audit; không có rule hợp lệ dẫn tới yêu cầu xác nhận/chuyên gia. | OPEN |
| FR-38 | P0 / Bổ sung / UR-13 | Cấu hình tích hợp Gemini API | 27 | M4/M5 | UI-31 | TC-11 | Response quản trị không trả secret; đổi model phải vượt bộ fixture; mất quyền API hiện lỗi cấu hình thay vì lộ stack trace. | OPEN |
| FR-39 | P0 / Bổ sung / UR-14 | Hạn mức và ngân sách AI | 27 | M4 | UI-27, UI-32 | TC-05; XT-BUDGET | Vượt quota không gọi provider; nhiều user đồng thời không vượt trần concurrency; admin thấy usage và lỗi tách biệt. | OPEN |
| FR-40 | P0 / Bổ sung / UR-14 | Quản lý tác vụ và retry vận hành | 28 | M4/M5 | UI-14, UI-32 | TC-05; XT-JOB | Job timeout chuyển trạng thái kết thúc; lỗi 401 cấu hình không retry mù; worker restart xử lý job bị treo bằng lease. | OPEN |
| FR-41 | P1 / Bổ sung / UR-12 | CMS bài viết và FAQ | 28 | M7b | UI-02, UI-33, UI-40, UI-44 | TC-11 | XSS trong nội dung không chạy; slug trùng bị chặn; khách chỉ thấy published và bài đúng ngày hiệu lực. | OPEN |
| FR-42 | P1 / Bổ sung / UR-14 | Báo cáo và nhật ký kiểm toán | 28 | M1/M5 tối thiểu / M7b đầy đủ | UI-27 | TC-11 | Tổng job khớp trạng thái DB trong kỳ; export neutralize công thức CSV; operator không đổi audit. | OPEN |
| FR-43 | P0 / Bổ sung / UR-14 | Cấu hình SMS và thời tiết | 29 | M2/M4 | UI-31 | SMS signature/replay/outage; TC-01,04 | Webhook giả không thay trạng thái; weather lỗi vẫn có nhập tay; SMS outage không chấp nhận OTP giả. | OPEN |
| FR-44 | P0 / Bổ sung / UR-14 | Xử lý lỗi và trang hệ thống | 29 | M2..M6 | UI-37 | XT-UI errors/offline/409 | 429 hiện thời gian thử lại; 409 yêu cầu tải bản mới; offline không báo Đã lưu server khi chưa lưu. | OPEN |
| FR-45 | P0 / Bổ sung / UR-10 | Quản lý quyền truy cập ảnh | 29 | M2/M5 | API/flow liên quan | TC-09, TC-12 | Đổi object_id sang ảnh người khác bị chặn; ảnh không được index công khai; URL hết hạn không đọc được. | OPEN |
| FR-46 | P1 / Bổ sung / UR-06 | Chọn ảnh minh họa do AI tạo | 30 | M7c | API/flow liên quan | TC-06; AI image flag/fallback/review | Tắt feature ảnh AI vẫn đủ hình ở mọi bước; hình AI không thay số đo, danh sách vật tư hoặc quy tắc đã duyệt. | OPEN |
| FR-47 | P1 / Bổ sung / UR-09 | Ghi nhận bàn giao và tình trạng nhận cây | 30 | M7a | UI-19 | Handoff/receipt/date/manual validation | SHIPPED cần ngày bàn giao; RECEIVED ghi ngày và cho đánh giá; tracking chưa tích hợp được ghi rõ là tự khai báo. | OPEN |
| FR-48 | P0 / Bổ sung / UR-10 | Quản lý consent và thông tin về AI | 30 | M4/M7b | UI-08, UI-25 | TC-10, TC-12 | Không consent AI thì không gọi Gemini; vẫn nhập tay và tạo kế hoạch bằng Rule Engine; đồng ý chuyên gia không đồng nghĩa công khai ảnh. | OPEN |
| FR-49 | P0 / Gốc / UR-08 | Chia sẻ liên kết chỉ xem | 31 | M5 | UI-26, UI-42 | XT-SHARE | Người nhận chỉ xem/in, không sửa; link hết hạn/thu hồi trả 404; sửa hồ sơ không làm nội dung snapshot chia sẻ đổi theo. | OPEN |
| FR-50 | P0 / Gốc / UR-13 | Theo dõi chất lượng nhận diện AI | 31 | M4/M6 | UI-36 | Evaluation/correction/unknown/model regression | Báo cáo phân biệt self-confidence với độ chính xác đo được; unknown không bị tính như dự đoán đúng; model đổi có regression report. | OPEN |
| FR-51 | P0 / Gốc / UR-05 | Tự lấy bối cảnh hành trình có nguồn | 31 | M4 | UI-39 | TC-04 mở rộng coverage/manual priority | Không có nguồn hợp lệ trả unknown và cho nhập tay; thời gian chỉ là ước tính; chỉnh tay ưu tiên, AI không ghi đè. | OPEN |
| FR-52 | P0 / Gốc / UR-06 | Giải thích quy tắc đã áp dụng | 32 | M3/M5 | API/flow liên quan | Fixtures determinism/action trace/conflict | Mọi hành động/cảnh báo truy nguyên được rule; fixture cùng input/version cho cùng output; rule conflict không giải được trả NEEDS_EXPERT. | OPEN |
| FR-53 | P0 / Gốc / UR-06 | Tiếp tục khi AI không khả dụng | 32 | M3/M4/M6 | API/flow liên quan | AI-off end-to-end; SMS pending | Tắt Gemini vẫn hoàn tất hồ sơ mẫu bằng nhập tay; đăng ký chưa OTP không truy cập tính năng chính; không có quy tắc hợp lệ phải chuyển hỗ trợ. | OPEN |

## 15 yêu cầu chất lượng

| NFR | Nội dung | Trang | Mục tiêu từ SRS, chưa đo | Mốc / evidence | Status |
| --- | --- | --- | --- | --- | --- |
| NFR-01 | Hiệu năng web | 52 | Các API CRUD p95 < 800 ms với 100 user đồng thời trên cấu hình staging xác định; trang chính LCP <= 2,5 giây, CLS <= 0,1 trên bài đo mobile đại diện. Mục tiêu đề xuất, đo riêng upload và AI. | M6; TC-13; load + web vitals report | OPEN |
| NFR-02 | Thời gian AI | 52 | Nhận diện ảnh p95 mục tiêu <= 15 giây; pipeline tạo kế hoạch với hình thư viện p95 <= 120 giây, theo PRD. Timeout call nhận diện 20 giây; tổng job tối đa 180 giây gồm retry; quá SLA báo trạng thái, ảnh AI chạy riêng. | M4/M6; TC-13; latency/deadline/fallback | OPEN |
| NFR-03 | Sẵn sàng và giảm cấp | 52 | SLO nội bộ 99,5%/tháng cho luồng CRUD, loại bảo trì công bố; AI/SMS/weather có trạng thái phụ thuộc riêng. AI lỗi vẫn truy cập lịch sử, nháp, sơ đồ thư viện và hỗ trợ. | M6; TC-13; outage drills + SLO | OPEN |
| NFR-04 | Bảo mật tài khoản | 52 | Mật khẩu hash Argon2id/bcrypt theo cấu hình kiểm tra tải; TLS; CSRF, XSS, CSP và CORS allowlist; admin có MFA/tái xác thực cho tác vụ nhạy cảm; không để khóa API trong bundle frontend. | M2/M6; TC-01,11; auth/security/bundle audit | OPEN |
| NFR-05 | Phân quyền và cô lập | 52 | Kiểm role và owner trên mọi API/object/export/job/ticket. Test truy cập chéo tài khoản cho cả ID trực tiếp lẫn URL ảnh. Quyền chuyên gia hết khi bỏ phân công/thu hồi chia sẻ. | M2..M7; TC-09,10,12; XT-AUTH | OPEN |
| NFR-06 | Dữ liệu và consent | 53 | Không gửi tên/username/SMS/địa chỉ đầy đủ tới AI; xóa EXIF vị trí; dữ liệu lưu private. Công bố thời hạn giữ ảnh, audit và nhà cung cấp. Chính sách pháp lý cần rà soát trước phát hành, đây không phải kết luận pháp lý. | M2/M4/M7b; TC-10,12; consent/EXIF/PII policy | OPEN |
| NFR-07 | Khôi phục | 53 | Backup DB hằng ngày, lưu 30 ngày; snapshot object/versioning theo chi phí; mục tiêu RPO <= 24 giờ, RTO <= 4 giờ. Thực hiện restore thử ở staging ít nhất mỗi quý. | M6; restore/RPO/RTO evidence | OPEN |
| NFR-08 | Khả năng tiếp cận | 53 | Mục tiêu WCAG 2.2 AA cho luồng chính: điều hướng keyboard, focus rõ, label và lỗi gắn field, alt ảnh, vùng chạm >= 44 px, màu không là tín hiệu duy nhất; kiểm screen reader và contrast. | M5/M6; TC-14; keyboard/contrast/screen reader | OPEN |
| NFR-09 | Tương thích | 53 | Responsive từ 360 px; Chrome/Edge/Safari/Firefox hai phiên bản major gần nhất tại lúc nghiệm thu; camera trên Android/iOS có fallback file upload. Không yêu cầu cài app. | M5/M6; TC-14; browser/camera/viewport | OPEN |
| NFR-10 | Quan sát vận hành | 53 | Log JSON với correlation_id; metric job success/latency/queue/429/token/image/cost/SMS; cảnh báo lỗi 5xx > 5% trong 5 phút hoặc queue oldest > 120 giây. Không ghi raw OTP, key, ảnh base64. | M1/M4/M6; TC-13; metric/alert/redaction drill | OPEN |
| NFR-11 | Toàn vẹn và đồng thời | 54 | Transaction cho OTP/quota/tồn kho/chọn phiên bản; optimistic lock cho draft; idempotency cho job/export/complete/webhook. Khóa không giữ xuyên suốt call provider. | M2/M4/M7a; TC-05,08; XT-CONCURRENCY | OPEN |
| NFR-12 | Bảo trì và mở rộng | 54 | Tách adapter Gemini/SMS/weather/storage; schema versioned; fixture regression trước đổi model/prompt/rule. Có thể scale worker độc lập; không hardcode model ID hoặc đơn giá trong UI. | M1/M3/M4; contract/fixture regression + architecture review | OPEN |
| NFR-13 | Bản địa hóa và thời gian | 54 | UI tiếng Việt, số hiển thị theo locale, tiền VNĐ, cm/kg, lưu timestamp UTC và render Asia/Ho_Chi_Minh; số thập phân đầu vào chuẩn hóa dấu phẩy/chấm rõ ràng. | M2/M5/M6; TC-14; cm/kg/VNĐ/UTC/timezone | OPEN |
| NFR-14 | Tính dễ sử dụng | 54 | >= 90% trong 10 người thử đại diện hoàn tất hồ sơ mẫu không cần hướng dẫn trực tiếp; lỗi đo/thiếu vật tư có giải thích; không gắn nút đã lưu nếu request còn lỗi. | M6; TC-14; 10-user usability report | OPEN |
| NFR-15 | Giới hạn dung lượng | 54 | 10 MB/file trước chuẩn hóa; chống ảnh decompression bomb tối đa 30 MP; tối đa 12 ảnh/hồ sơ. Ảnh gửi AI resize <= 2.048 px cạnh dài và giảm dung lượng, theo model đã kiểm thử. | M2/M4; TC-02; XT-UPLOAD | OPEN |

## Coverage và cách dùng

Evidence bổ sung 2026-10-15 (không đóng hàng OPEN): readiness/no-op save cho FR-10..17/26; report/ảnh/fallback và export bundle cho FR-18..19/21/24; purpose consent/AI-off cho FR-48/53. Tests tại `tests/report-knowledge.test.ts`, `tests/retrieval-eval.test.ts`, `tests/e2e/workflow.spec.ts`; RAG read-only là scope bổ sung người dùng chọn, không tương đương acceptance đầy đủ chat/alternatives. Giới hạn nguồn/provider/chuyên môn tại `research/README.md` và `.code/implementation.md`.

Có 53 FR: 35 P0, 18 P1; 15 NFR; UI index tại `ui-spec.md`; TC-01..14 tại `test-strategy.md`.

Trước review task, bổ sung đường dẫn PR/test/report ở backlog; không thay OPEN bằng DONE nếu acceptance chưa có evidence. TC-13/14 kiểm NFR xuyên suốt; không có TC gốc cho một FR không có nghĩa bỏ kiểm thử FR đó.


## Giám sát đóng gói và nhận lệnh nói — 17/10/2026
Theo yêu cầu người dùng: bổ sung luồng độc lập /app/live-packing, 6 SOP dự thảo/35 bước, checkpoint ảnh/manual, Gemini Vision/TTS và nhận lệnh tiếng Việt. Không hoàn tất hồ sơ hoặc trừ kho trong luồng thử; không tự phê duyệt SOP. Secrets chỉ qua cấu hình server, không lưu media mặc định. Nguồn và giới hạn: ../SOP_INTEGRATION.md và ../VOICE_COMMANDS.md. Kiểm: tests/live-packing.test.ts, packing-voice-commands.test.ts, live-sop-evaluation.test.ts, vietnamese-voice.test.ts, vietnamese-tts.test.ts và tests/e2e/live-packing.spec.ts. Provider thật, ảnh có nhãn và micro vật lý vẫn cần xác minh; không đóng release gate hoặc FR gốc chỉ vì có test phần mềm.

## Luồng Bắt đầu — 18/10/2026

Yêu cầu: camera → đọc mẫu SOP → nghe lệnh xong → nhắc vị trí → kiểm khung hình → đọc kết quả → tự chuyển khi đủ kiểm ảnh và kiểm tay. Code: apps/web/src/components/live-packing.tsx, apps/web/src/lib/packing-narration.ts, guided-packing.ts và packing-voice-commands.ts. Kiểm logic: tests/packing-narration.test.ts (nguyên văn từng SOP, giới hạn và chỉ số bước), tests/guided-packing.test.ts (đúng bước, trạng thái ảnh, xác nhận tay, phủ định lệnh), tests/vietnamese-tts.test.ts (giữ nguyên nội dung gửi TTS). Các kiểm này không thay kiểm micro/camera vật lý, độ chính xác Gemini hoặc nghiệm thu SOP; không đóng FR/NFR gốc.

## Hồ sơ & camera, nguồn và xác nhận theo bước — 18/10/2026

Bổ sung theo yêu cầu người dùng, không đóng các FR/NFR OPEN: entry chung và private case/session (FR-10..17, TC-02/13); hướng dẫn/lời đọc/checkpoint và manual confirmation (FR-18..21/26, TC-06/07/13); tài liệu có scope, purpose consent/media off khi resume (FR-48/53, TC-13/14). Phạm vi camera trial không thay acceptance đầy đủ của các FR này. Contract/flow tại ../GUIDED_PACKING.md; tests/guidance.test.ts kiểm owner/stale/revision/override/no inventory; packing-narration/guided-packing/packing-voice-commands kiểm guard/lời đọc; live-packing.spec.ts kiểm entry, camera, voice, resume và không chuyển failed image. RAG có 16 ca regression tại research/retrieval-eval.jsonl. Provider/micro/ảnh thật, nguồn được phép training, review chuyên môn và usability pilot tiếp tục OPEN.

## Flow nhận diện/kết quả/AI và deploy tách — 18/10/2026

Thay entry camera trước hồ sơ bằng plant → instructions → guide. FR-10..17/TC-02: tests/plant-recognition.test.ts kiểm fill giữ manual/late edit/confirmed, tests/e2e/live-packing.spec.ts kiểm upload/chụp thật và kết quả minh họa. FR-18..21/26, TC-06/07/13: guidance.test.ts kiểm REFERENCE/issue guards, browser kiểm done một lần/failed image/issue-resolve/resume/stale. NFR-09/13/14/TC-14: camera fallback, mobile 390, deterministic pronunciation/voice/WAV. NFR-04..07/10..12: deployment.test.ts, scripts/check-proxy.mjs (cookie/CSRF/private cache/no DB) và check-container.mjs (Linux auth/upload/PDF/restart/idle dispatch), không thay staging/load/backup/restore/HA evidence. Provider smoke opt-in tại gemini-real/gemini-tts-real.spec.ts kiểm giao tiếp, không accuracy vận chuyển. Số/giới hạn thực chạy tại implementation.md, FR/NFR gốc vẫn OPEN.

Bổ sung auto-fill đầy đủ 18/10/2026 (FR-10..17, TC-02): plant-recognition.test.ts kiểm v2 đủ sáu trường, nguồn/value/unit/duplicate, unknown và giữ manual/confirmed; E2E create/capture kiểm tất cả ô, nhãn ước tính, checkbox bắt buộc và xóa mục xử lý ảnh; Gemini smoke dùng ảnh cây AI mẫu/ảnh trắng, không accuracy hoặc approval chuyên môn. Evidence tại implementation.md.
## Overlay PRD MVP 19/10/2026

Thay đổi luồng UI/FR liên quan theo tài liệu Word mới được user chỉ định; giữ truy vết SRS gốc để không mất lịch sử. 10 tính năng, main/exception flow và phạm vi loại trừ được map từng locator → code → test trong [prd-mvp-20261019.md](prd-mvp-20261019.md). Overlay không phải nghiệm thu accuracy, SLA hoặc approval chuyên môn.
