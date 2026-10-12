# Hồ sơ kỹ thuật PlantCare

Thư mục `.code` dùng để điều hành triển khai từ SRS ở mức senior SE. Ngày 2026-10-12 đã bổ sung website local tại `apps/web`, shared domain/engine tại `packages`, test và hướng dẫn chạy tại `../README.md`. Thiết kế baseline ban đầu vẫn là đề xuất; phạm vi thực hiện và evidence nằm trong [implementation.md](implementation.md).

| File | Mục đích |
| --- | --- |
| [source-index.md](source-index.md) | Nguồn, fingerprint, trang/chương, cách phân biệt yêu cầu và giả định |
| [architecture.md](architecture.md) | Module boundaries, luồng dữ liệu, failure/transaction và cấu trúc source đề xuất |
| [data-model.md](data-model.md) | Thực thể, constraints, snapshots, provenance, transaction và lifecycle |
| [api-contracts.md](api-contracts.md) | Quy ước REST, endpoints, quyền, idempotency và errors |
| [backlog.md](backlog.md) | Task triển khai, dependency, outputs và acceptance gate |
| [traceability.md](traceability.md) | 53 FR và 15 NFR ánh xạ milestone/UI/test; mọi trạng thái khởi tạo OPEN |
| [ui-spec.md](ui-spec.md) | Tokens, components, state behavior và 44 desktop + 4 mobile UI |
| [test-strategy.md](test-strategy.md) | TC-01..14, fixtures, fault/concurrency, performance và release evidence |
| [decisions.md](decisions.md) | Baseline đề xuất, lệch SRS, quyết định cần owner và gate production |
| [implementation.md](implementation.md) | ADR local, source/runtime thực, evidence kiểm thử và giới hạn chưa nghiệm thu |

Đọc theo thứ tự: `../agent.md` -> `../plan.md` -> `source-index.md` -> `decisions.md` -> hồ sơ của task -> row truy vết. Chỉ dẫn hành vi thuộc `agent.md`, lộ trình thuộc `plan.md`; tránh sao chép làm lệch nguồn.

Nhãn **SRS** là yêu cầu từ PDF; **Đề xuất** là thiết kế/ước lượng của kế hoạch; **OPEN** là chưa có quyết định/bằng chứng. Không suy ra việc được ghi trong tài liệu đồng nghĩa đã triển khai, kiểm thử hoặc được phê duyệt.
