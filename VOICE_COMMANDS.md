# Hướng dẫn tiếng Việt và lệnh đóng gói

Tạo hồ sơ → thông tin cây → ảnh hướng dẫn → **Bắt đầu với AI**. Chi tiết: [GUIDED_PACKING.md](GUIDED_PACKING.md). Micro và quyền kiểm ảnh bật riêng; TTS không cần micro.

| Câu nói | Hành động |
| --- | --- |
| “Đã xong”, “Xong rồi”, “Đã xong bước này”, “Tiếp tục bước tiếp theo” | Xác nhận manual; visual kiểm ảnh và chuyển đúng một bước khi đạt, không cần AI nhắc câu lệnh trước |
| “Đồng ý”, “Dạ vâng”, “OK”, “Tôi xác nhận” | Cùng điều kiện xác nhận, không bỏ qua lỗi/ảnh chưa đạt |
| “Kiểm tra”, “Kiểm tra lại” | Kiểm ảnh, không tự xác nhận visual từ lượt kiểm riêng |
| “Tôi gặp lỗi”, “Tôi làm sai” | Ghi lỗi, xóa pass cũ, tạm dừng bước |
| “Tôi đã xử lý lỗi”, “Đã khắc phục” | Resolve manual; visual cần ảnh mới đạt; không tăng bước |
| “Nhắc lại”, “Giúp tôi” | Đọc lại bước hoặc giải thích cách xử lý lỗi theo SOP |
| “Dừng lại”, “Tắt camera” | Dừng camera, nghe lệnh, kiểm ảnh |

Chỉ nhận toàn bộ câu cho phép sau chuẩn hóa dấu/khoảng trắng, final transcript của phiên hiện tại. “Chưa xong bước này”, “Đừng tiếp tục bước tiếp theo”, câu kể người khác không xác nhận. Khóa đồng bộ trước TTS/check/mutation, bỏ sự kiện mic cũ, mở nghe sau 800 ms khi đủ điều kiện. Có nút thay thế; nhận giọng thật vẫn có thể sai.

Bật **Cho AI kiểm tra hình ảnh** mặc định kiểm khoảng 12 giây khi hình thay đổi ở bước visual, không tự chuyển vì monitoring. Hiện/đọc lỗi kèm remedy. Thu hồi consent/tắt camera/ẩn tab/rời màn hình hủy lượt chờ/media. Reload giữ tiến độ/lỗi nhưng không tự bật quyền/mic. Lỗi quyền/mạng dừng nghe, người dùng bật lại khi sẵn sàng.

## Lời đọc SOP

packingNarration tự đọc “Bước N.” và speech_vi của đúng SOP/version/bước; demo PA1/PA2 dùng lời đã hardcode theo ảnh. Không đọc lời nhắc nói đã xong để chuyển bước, không ghép thêm hướng dẫn câu lệnh vào lời đọc. Các yêu cầu kiểm trực tiếp vẫn hiển thị trên màn hình và được kiểm trước chuyển bước. vietnameseSpeechText chỉ đổi cách phát âm: 18 cm → “18 xen ti mét”, 3,2 kg → “3 phẩy 2 ki lô gam”, 10–32 °C → “10 đến 32 độ C”, -5 °C → “âm 5 độ C”; giữ nghĩa so sánh/độ chính xác thập phân. Không để LLM viết lại chỉ dẫn hoặc thêm ngưỡng.

Ưu tiên voice vi-VN trên thiết bị, không dùng voice ngoại ngữ đọc tiếng Việt. **Dùng giọng AI** mở audio device trong thao tác người dùng và gửi text chuẩn hóa tới Gemini TTS; server quota/cache/timeout, xác minh WAV PCM playable trước trả. TTS/Vision dùng quota chung; không gửi transcript mic.

SpeechRecognition/webkitSpeechRecognition có thể dùng dịch vụ từ xa; không bảo đảm offline/mọi browser. Không MediaRecorder, không lưu/gửi audio mic tới backend. Cần HTTPS/localhost. Không hỗ trợ giữ nút thao tác. Nguồn: [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), [Gemini speech generation](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation).

## Kiểm chứng

tests/packing-voice-commands.test.ts kiểm lệnh/phủ định/khóa/sự kiện trễ; tests/pronunciation.test.ts kiểm đơn vị/số; tests/vietnamese-tts.test.ts kiểm payload/cache/WAV; tests/e2e/live-packing.spec.ts kiểm camera/giọng/provider giả lập, lỗi/resume và một xác nhận chỉ chuyển một bước. Evidence tại .code/implementation.md. Bộ mặc định không gọi provider trả phí; chưa đo micro vật lý trong xưởng hoặc độ đúng chuyên môn.
