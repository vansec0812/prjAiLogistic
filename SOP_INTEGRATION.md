# PlantMove — tích hợp SOP có nguồn, bản kiểm thử v2

Thay checklist `packing-pilot-v1` bằng catalog `apps/web/src/data/live-sops.json`. Mã giao diện và backend cùng nạp qua schema ở `src/lib/live-packing.ts`; không còn dùng checklist bốn bước cũ. Bản nghiên cứu trước được lưu riêng tại `docs/sop-research`, không thay bằng một hồ sơ giả đã duyệt.

## Phạm vi

7 nhánh, 40 bước: sen đá nguyên chậu/rễ trần; xương rồng nguyên chậu/rễ trần; trầu bà nhỏ nguyên chậu/rễ trần. Sáu nhánh cũ có số bước 6/6/6/6/6/5; nhánh cây nguyên chậu chung FedEx mới có 5 bước. Đây là trình tự ứng viên để thẩm định, chưa là SOP vận hành hoặc hướng dẫn riêng đã kiểm chứng cho mọi loài trong nhóm.

- [Eurosender](https://www.eurosender.com/en/pack-ship/plants/succulents-cactus): chuỗi nguyên chậu/rễ trần và đoạn riêng xương rồng. Các nhánh xương rồng là cách tổ chức thử nghiệm từ các mục cùng nguồn, không tự nhận là SOP riêng đã được nguồn duyệt cho một giống.
- [Izzy’s Tropicals](https://izzyplants.com/blogs/the-complete-guide-to-shipping-plants/how-to-ship-small-plants-a-complete-step-by-step-guide): hướng dẫn cây nhỏ có nhắc small pothos, Option A/B. Đây là nguồn shop nước ngoài, chưa là tiêu chuẩn Việt Nam hoặc thử nghiệm riêng Epipremnum của shop người dùng. Phạm vi kích thước của nguồn được giữ và đổi đơn vị; không tự áp dụng cho cây lớn.

Mỗi bước có nguồn/mục, lời đọc tiếng Việt, hướng dẫn kiểm tay và loại kiểm tra. Bước visual có criterion_id, mô tả đạt/lỗi, vùng cần chụp và trường hợp không xác minh. Các tiêu chí quan sát do PlantMove đề xuất, chưa được người có chuyên môn thẩm định. Văn bản kỹ thuật là tóm tắt để duyệt; phải đọc nguồn và xác nhận đầy đủ thao tác/vật tư trước vận hành. Không sao chép cả bài nguồn, không lấy ảnh mạng làm ảnh được cấp phép.

Các số có trong catalog được gắn nguồn, là tham chiếu chờ thẩm định. Không dùng chúng làm mặc định mọi loài, tuyến hoặc hãng. Lịch chuẩn bị/độ ẩm phải do shop xác nhận; luồng thử không xác minh ETA, sức chịu vận chuyển hoặc cam kết nhận gửi từng đơn.

## Hành vi

1. Tạo hồ sơ → thông số cây → upload/chụp tự nhận diện/fill → kiểm/sửa số đo và xác nhận → ảnh hướng dẫn → Bắt đầu với AI. UI mặc định cây nguyên chậu chung FedEx; không tự chọn nhánh loài/rễ trần từ ảnh. Các nhánh cũ giữ trong catalog/API với context/scope guard, không tự áp dụng cho cây ngoài nguồn.
2. Nguồn/phạm vi/trạng thái review nằm trong mục thu gọn. REFERENCE production cần PLANTCARE_REFERENCE_GUIDE_ENABLED=true và profile đã xác nhận. Không đổi DRAFT/reviewer/approved_at/production_enabled; TRIAL vẫn bị chặn production, không cấp quyền publish hoặc hoàn tất kiện.
3. Bước manual-only không có nút gửi ảnh và API từ chối nếu cố gửi. Kiểm độ khô/chuẩn bị rễ/chọn chậu do người phụ trách xác nhận. Không ép AI báo đạt từ ảnh.
4. Bước visual: nói “Đã xong bước này”/“Tiếp tục bước tiếp theo” hoặc bấm nút → nhắc camera → đếm ngược → kiểm ảnh và xác nhận khi đạt. Quyền kiểm ảnh cũng bật kiểm định kỳ khoảng 12 giây khi hình thay đổi, chỉ báo lỗi/không auto advance. Không quay/lưu video, micro bật riêng. Không suy phần bị che, số lớp ẩn, độ chắc hoặc độ ẩm.
5. JSON giữ step_id, observed, status, reason, manual_check_required; bổ sung criterion_results với đủ mã tiêu chí. Server từ chối mã lạ/thiếu/trùng; tổng hợp trạng thái từ tiêu chí. Một kết quả chưa xác minh không tự thành đạt vì phần tổng kết AI ghi passed.
6. Bước tiếp cần xác nhận kiểm trực tiếp và ảnh đạt, hoặc kiểm tay có lý do ≥10 ký tự. “Tôi gặp lỗi” lưu lỗi/xóa pass; resolve riêng không tăng bước. Kết quả AI cũ giữ trong override. Bỏ qua ghi chưa hoàn tất; kết thúc hướng dẫn không xác nhận kiện an toàn.
7. Khi xong có thể tải JSON biên bản không ảnh/video. Không tự lưu media hoặc upload bộ ảnh. Kết quả và tiến độ lưu trong phiên private của hồ sơ; tải lại cần bật lại camera/micro/consent. Không nối vào hồ sơ hoàn tất/trừ kho.

## Kiểm thử và đánh giá

`npm run typecheck`, `npm test`, và `npx playwright test --config playwright.live.config.ts`. Bộ trình duyệt dùng camera/voice/provider giả lập để kiểm luồng. Không lấy số test đạt làm tỷ lệ AI đánh giá đúng.

Tại Windows sandbox, Turbopack có thể không tạo được junction của sharp; dùng `npm run build -- --webpack`. Việc build hoặc chạy server có thể cần quyền hệ thống phù hợp khi Windows chặn tạo thư mục/tiến trình.

Đánh giá ảnh thật: xem `evaluation/live-sop/README.md`. Công cụ kiểm hash ảnh, nguồn khai báo, nhãn người duyệt, phiên bản, criterion_id, tách cây/phiên và thống kê ma trận nhầm lẫn, báo đạt nhầm, lỗi bị bỏ sót, không xác minh, phân nhóm. Chưa có dữ liệu: report NOT_RUN, metrics=null. Không tự gọi API hàng loạt hoặc giả nhãn/độ chính xác.

Thử provider thật có opt-in trong `playwright.gemini.config.ts`, ảnh trắng chỉ kiểm giao tiếp/schema. Kết quả lượt thử và các checks thực tế được ghi trong báo cáo bàn giao cùng gói cập nhật; không mặc định provider luôn khả dụng.

## Những việc còn cần con người/dữ liệu

- Shop/người có chuyên môn duyệt từng nhánh: loài, vật tư, thao tác, tiêu chí và ngoại lệ; hãng/dịch vụ xác nhận cho tuyến/đơn cụ thể. Phiếu duyệt được xuất riêng, không ký thay.
- Ảnh thật có nhãn theo tiêu chí, gồm đúng/lỗi/không xác minh; đánh giá mù trên cây/phiên chưa dùng chỉnh prompt.
- Thử đóng gói và vận chuyển thực để xác nhận hiệu quả bảo vệ. Chưa có bằng chứng này, không chuyển production_enabled=true hoặc công bố độ chính xác/an toàn.

## Tái tạo catalog

`python scripts/build-live-sop.py` tạo lại JSON từ nội dung đã biên tập trong script, bảo tồn hồ sơ nghiên cứu cũ. Khi sửa kỹ thuật/tiêu chí phải tăng version, cập nhật hồ sơ duyệt và đánh giá lại. Không sửa version đang tham chiếu rồi gọi đó là cùng bản.

## Luồng hợp nhất 18/10/2026

Xem [GUIDED_PACKING.md](GUIDED_PACKING.md) để dùng phiên lưu tiến độ, xác nhận bằng lời nói, kiểm owner/revision và nguồn FedEx mới. `/app/live-packing` mở entry tạo hồ sơ; phiên thực hiện nằm tại `/app/cases/:id/guide`.
