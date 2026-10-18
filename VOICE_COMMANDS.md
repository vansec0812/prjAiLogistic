# Điều khiển kiểm tra đóng gói bằng giọng nói

Ngày 17/10/2026. Bổ sung vào luồng SOP checkpoint hiện có; không thay đổi nội dung/approval SOP, không hoàn tất hồ sơ hoặc trừ kho bằng lời nói.

## Cách dùng

1. Vào Giám sát đóng gói, chọn/xác nhận SOP và bắt đầu phiên thử.
2. Để kiểm ảnh, mở camera và đồng ý gửi khung hình. Bật âm thanh/nghe thử nếu thiết bị cần mở loa; đọc TTS riêng không cần micro.
3. Bật “Điều khiển bằng giọng nói — đồng ý dùng micro để nhận lệnh”, cho phép micro nếu trình duyệt hỏi. Quyền do trình duyệt quản lý; có thể phải cấp lại nếu quyền bị thu hồi hoặc đổi thiết bị.
4. Chờ AI đọc xong và trạng thái “Đang nghe lệnh”. Nói “PlantMove, kiểm tra”, “đã xong rồi”, “xong rồi” hoặc “đã xong”.
5. Hệ thống xác nhận lệnh, nhắc vùng cần đưa trước camera, đếm ngược rồi tự lấy một ảnh của bước hiện tại. Nhận JSON/đọc phản hồi theo cùng API hiện có. Các kiểm tay và điều kiện chuyển bước giữ nguyên.

Bước manual-only: câu nói chỉ nhắc kiểm trực tiếp, không gửi ảnh, không tick hộ hoàn tất. Khi thiếu camera/consent/API, hiển thị và đọc điều kiện cần bổ sung. Nút Kiểm tra và xác nhận thủ công vẫn dùng được khi không bật nhận lệnh.

## Chống kích hoạt sai

- Nhận đúng toàn bộ câu trong danh sách cho phép, chuẩn hóa dấu/cách viết. Không tìm chuỗi “xong rồi” nằm bên trong lời nói dài; “chưa xong”, “đừng kiểm tra”, “khi nào xong rồi…” không là lệnh.
- Chỉ dùng kết quả nhận dạng cuối, bỏ kết quả đang nhận dở.
- Dừng nhận giọng đồng bộ trước khi TTS phát hoặc trước khi nhận lệnh kiểm; đồng thời kiểm cờ đang nói ngay trong sự kiện, không chờ giao diện cập nhật.
- Mỗi phiên nhận dạng có mã riêng; bỏ sự kiện cũ kể cả khi nó tới sau abort. Chặn lệnh lặp bằng khóa kiểm tra đang có.
- Sau khi nói xong, chờ 800 ms trước khi mở lại nghe để giảm tiếng vọng. Trạng thái chờ được hiển thị riêng. Việc nhận dạng vẫn có thể nghe sai ngoài thực tế; không coi thuật toán này là loại bỏ mọi kích hoạt nhầm.
- Lỗi quyền/network/không micro dừng chế độ, yêu cầu người dùng bật lại; không lặp xin quyền hoặc tự gọi Gemini.
- Tắt camera, thu hồi đồng ý gửi ảnh, rời tab, hủy duyệt SOP hoặc kết thúc phiên sẽ dừng nghe; khi quay lại không tự bật micro.

## Quyền riêng tư và tương thích

Chế độ mặc định tắt, chỉ bật sau thao tác người dùng. Permissions-Policy đổi từ microphone=() sang microphone=(self); không tự cấp quyền hoặc cho phép iframe ngoài origin dùng micro. Không dùng MediaRecorder, không tạo file âm thanh, không lưu transcript hay gửi âm thanh tới backend PlantMove/Gemini Vision. Camera vẫn video-only; nhận giọng qua SpeechRecognition/webkitSpeechRecognition riêng.

Trình duyệt có thể dùng dịch vụ nhận dạng từ xa; không bảo đảm offline hoặc hỗ trợ mọi trình duyệt/giọng địa phương. Đã thông báo tại nút bật. Cần HTTPS hoặc localhost. Không hỗ trợ thì checkbox bị vô hiệu và giữ nút Kiểm tra. Tham khảo [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## Kiểm chứng

Logic lệnh/khóa/tiếng vọng/lỗi được kiểm bằng tests/packing-voice-commands.test.ts. Tích hợp camera + TTS + nhận dạng được kiểm bằng trình duyệt với các thành phần giả lập ở tests/e2e/live-packing.spec.ts. Các kiểm này không đo độ chính xác nhận giọng Việt bằng micro thật; cần thử trên điện thoại dự thi trong môi trường đóng gói có tiếng ồn, loa và mạng thực tế.

Không gọi API trả phí để thử tính năng nhận lệnh trong lần thay đổi này. Gemini Vision/TTS giữ model và hạn mức cũ; lỗi khả dụng provider không được tính là thành công nhận ảnh. Không cần thêm API key cho SpeechRecognition của trình duyệt.

## Cập nhật luồng Bắt đầu — 18/10/2026
Sau phản hồi người dùng, thêm chế độ hướng dẫn tự động: chọn/xác nhận SOP và consent ảnh, Mở camera → Bắt đầu. Bắt đầu bật giọng đọc, nhận lệnh qua micro nếu được hỗ trợ và đọc bước hiện tại. Khi chưa hỗ trợ hoặc từ chối micro vẫn có nút kiểm tra và kiểm tay.

“Đã xong” gọi checkpoint ảnh, chưa là xác nhận đặc tính không thấy. Ảnh passed + kiểm tay đã được người dùng xác nhận: đọc xong phản hồi rồi tự chuyển và đọc hướng dẫn bước sau. Ảnh needs_adjustment/unverifiable hoặc provider lỗi: giữ nguyên bước. Nếu ảnh đạt nhưng chưa xác nhận kiểm tay: đọc yêu cầu kiểm tay và chờ “tôi đã kiểm tra trực tiếp” hoặc checkbox. Có thể xác nhận kiểm tay trước khi nói đã xong để sau ảnh đạt chuyển ngay. Câu đầy đủ “đã xong và đã kiểm tra trực tiếp” vừa ghi xác nhận của người dùng vừa yêu cầu kiểm ảnh.

Bước manual-only không gọi Vision, sau xác nhận rõ “tôi đã kiểm tra trực tiếp” thì chế độ Bắt đầu tự sang bước; không ghi đó là kết quả AI. Export giữ manual_confirmed/manual_method. Không tự thêm trường xác nhận từ chữ “đã xong”. Dừng camera, ẩn tab, thu hồi consent hoặc hủy SOP sẽ dừng chế độ; cần bấm Bắt đầu lại. Nghe lại/mẫu vẫn hoạt động riêng, không chuyển bước.

Thay đổi này thay mô tả trước đây về việc luôn phải bấm Bước tiếp. Không thay phê duyệt SOP, không lưu video và không chứng nhận kiện an toàn vận chuyển. Kiểm logic tự chuyển: tests/guided-packing.test.ts; chưa quan sát lại tab thật do quyền đọc tab bị từ chối ở lượt trước.
