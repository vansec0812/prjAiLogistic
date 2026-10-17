# Đánh giá bằng ảnh thực tế

Chưa có bộ ảnh thật được gán nhãn cho các checkpoint mới. Ba ảnh AI do người dùng gửi trước đây không dùng làm bằng chứng đánh giá thực tế. Các ảnh minh họa/test trong ứng dụng chưa có nhãn và provenance đủ để coi là bộ nghiệm thu.

Không cần ảnh để chạy thử camera + Vision API theo tiêu chí văn bản. Cần ảnh thật có nhãn để biết hệ thống kiểm tra đúng đến đâu. Không tự bật tải ảnh lên hoặc lưu ảnh từ camera.

## Thu thập

Chụp khi có đồng ý của shop; tránh mặt người, địa chỉ, số điện thoại. Giữ ảnh gốc cục bộ ở thư mục riêng do nhóm quản lý. Không đưa ảnh riêng tư vào public hoặc Git. Ảnh AI tạo chỉ dùng minh họa, không gắn `origin=real_photo`.

Mỗi checkpoint gồm trường hợp đúng, lỗi rõ và không xác minh (mờ, tối, che khuất, sai đối tượng). Chụp trước khi vùng cần kiểm bị che. Ghi kết quả kiểm tay riêng; ảnh không chứng minh độ chắc, độ ẩm hoặc hiệu quả vận chuyển.

Người có kinh nghiệm gán nhãn theo từng criterion_id, ghi danh tính người duyệt và thời điểm. Nếu bất đồng, thảo luận và ghi nhãn cuối trước khi đánh giá. Tách cây/phiên dùng chỉnh prompt (`tuning`) khỏi cây/phiên đánh giá (`evaluation`); không chọn lại ảnh dựa trên kết quả AI để làm đẹp báo cáo.

## Cấu trúc mẫu — ví dụ minh họa, không phải ảnh đã có

Thêm vào `manifest.json.samples`:

```json
{
  "id": "shop1-session1-frame1",
  "origin": "real_photo",
  "image_path": "private/frame1.jpg",
  "image_sha256": "SHA256_THUC_CUA_FILE",
  "plant_session_id": "shop1-plant1-session1",
  "split": "evaluation",
  "reviewer": "TEN_NGUOI_GAN_NHAN",
  "labeled_at": "THOI_DIEM_ISO_8601",
  "sop_id": "SUCCULENT-POTTED-ES",
  "sop_version": "2026.10-trial.1",
  "step_id": "ESP-03",
  "criterion_labels": { "ESP-03-C1": "needs_adjustment" },
  "manual_notes": "KET_QUA_KIEM_TRUC_TIEP_RIENG"
}
```

Trong `predictions.json`, mỗi ảnh evaluation có đúng một phần tử, chứa `sample_id`, `image_sha256`, `sop_id`, `sop_version`, `model`, `prompt_version`, `latency_ms` (hoặc null), `cost` (hoặc null), và `result` là JSON Vision API của đúng ảnh đó. Chưa có công cụ tự gọi hàng loạt API; không thay bằng dự đoán giả. Biên bản tải từ giao diện giúp xem kết quả nhưng không tự là bộ đánh giá, vì không giữ ảnh và hash ảnh.

## Chạy đo

Tại thư mục gốc dự án:

```
node scripts/evaluate-live-sop.mjs evaluation/live-sop/manifest.json evaluation/live-sop/predictions.json evaluation/live-sop/report.json
```

Công cụ không gọi API, không tính chi phí khi chưa biết. Khi rỗng trả `NOT_RUN_NO_REAL_LABELED_IMAGES`, các chỉ số là null. Khi có dữ liệu, kiểm hash ảnh, SOP/phiên bản/tiêu chí, sự lặp và tách tập; báo ma trận nhầm lẫn, báo đạt nhầm trong các lần báo đạt, lỗi chuyển thành đạt, tỷ lệ lỗi không phát hiện (bao gồm không xác minh), tỷ lệ không xác minh, kết quả từng nhóm/SOP/bước và từng tiêu chí. Độ trễ chỉ tính cho bản ghi có số đo.

Ngưỡng nghiệm thu cần chốt trước đợt đo và theo mức độ lỗi; công cụ không tự tuyên bố “đạt 85%” hoặc phê duyệt vận hành.
