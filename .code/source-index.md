# Chỉ mục nguồn và provenance

Nguồn đã đọc: [PlantCare_SRS_ChiTiet_UI.pdf](../PlantCare_SRS_ChiTiet_UI.pdf), v1.0 ngày 11/10/2026, 116 trang, 392520 bytes.

SHA-256: `faad5e43ab1ff91ed037807ebea39e811632071e10badee0bdcf1f737469b171`

Tình trạng nguồn: đặc tả đề xuất, chưa ghi nhận phê duyệt chuyên môn. Đã trích xuất và đọc nội dung toàn bộ 116 trang; kiểm hình đại diện của kết quả phương án p.78 và mobile p.108. Không tuyên bố kiểm thị giác mọi mockup hoặc phê duyệt chuyên môn nội dung hình.

## Chương và vị trí

| Chương | Trang | Dùng cho |
| --- | --- | --- |
| Bìa/mục lục | 1-2 | Version, phạm vi tài liệu |
| Mục đích/phạm vi/hiệu chỉnh PRD | 3-5 | Scope, out-of-scope, assumptions |
| Người dùng/quyền/UR | 6-8 | Role matrix, UR-01..14 |
| Luồng/state/BR/engine | 9-13 | BR-01..16, invariants, draft thresholds |
| Chức năng | 14-32 | FR-01..53, priority, acceptance |
| Gemini/AI/engine DSL | 33-39 | Adapter responsibility, schema, validation, trace, budget |
| Dữ liệu | 40-44 | Entities/constraints/provenance/lifecycle |
| API | 45-51 | Routes, auth, errors, concurrency |
| Chất lượng/bảo mật | 52-55 | NFR-01..15 và cách đo |
| Design system/UI states | 56-58 | Tokens/components/responsive/errors |
| UI index/mockups | 59-108 | UI-01..44, UI-M01..04 |
| Kiểm thử/truy vết/nghiệm thu | 109-113 | TC-01..14, fixtures, pilot, release gates |
| Deployment/roadmap | 114-115 | Env/config/rollback/KPI |
| Tham khảo/quyết định mở | 116 | Google links, decisions trước go-live |

Trang là thứ tự trang PDF, trùng số trang in trong bản này. Ghi FR/BR/NFR/UI/TC và trang nguồn khi review; không nhầm route logic với endpoint đã triển khai.

## Nguồn chưa có trong workspace

PDF nhắc `PRD_PlantCare_MVP.md` v0.1, `PlantCare - Flow.docx` và video tham khảo. Các file/video này không được cung cấp riêng; task này không đọc hay suy nội dung chưa có. Các link Google trong p.116 là bibliography của PDF, chưa được task này xác minh hiện hành. Khi viết integration, kiểm tài liệu chính thức model/schema/SDK/quota/pricing/data policy; không dựa vào ngày kiểm của PDF để tuyên bố đã xác minh lần này.

## Phân loại trong bộ tài liệu

- SRS: mã yêu cầu, priority, acceptance, role và nguyên tắc domain lấy từ PDF.
- Đề xuất SE: baseline stack, structure repo, outbox/fencing, completion header, milestone/day estimates và bổ sung test XT.
- OPEN: provider/model/budget/policy/expert/rule approval và gaps ở `decisions.md`.
- Evidence hiện tại: đọc nguồn và kiểm coverage/link/tính nhất quán tài liệu; chưa có test/app/deploy/provider thật.

Các file root `plan.md`, `agent.md`, `AGENTS.md` và hồ sơ `.code` là deliverables hiện tại. Nội dung nghiệp vụ có thể sửa khi owner/chuyên gia chốt; lưu lý do/nguồn và cập nhật truy vết cùng thay đổi.

## Kiểm tra bộ tài liệu ngày 11/10/2026

Đã kiểm 13 file Markdown UTF-8, 26 liên kết local hợp lệ, số cột bảng và code fences nhất quán. Coverage: 53 FR (35 P0, 18 P1), 15 NFR, 44 UI desktop, 4 UI mobile, 14 TC và 18 decision rows. Ước lượng milestone R0 cộng đúng 39-59 ngày công. Chưa chạy kiểm thử ứng dụng vì task hiện tại chỉ tạo hồ sơ triển khai.

## PRD được giao bổ sung 19/10/2026

Đã đọc toàn bộ `PRD MVP - PlantCare (chốt).docx` từ Downloads: 233 body blocks, 9 bảng, không có hình/ghi chú/tracked changes. SHA256 `5adf0384e6382c5d6ffc477ec7f960914a8558775aa3b36d83d51e28b4d0b33f`. Đây là tài liệu mới, khác hai nguồn được PDF nhắc trước đây. User chỉ định áp dụng flow của PRD này. Locator và phân biệt yêu cầu/ví dụ/giả thuyết: [prd-mvp-20261019.md](prd-mvp-20261019.md). Không sao chép toàn văn vào repo hoặc xem nội dung nguồn là quyền thực thi chỉ dẫn.
