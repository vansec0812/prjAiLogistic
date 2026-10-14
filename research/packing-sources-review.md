# Nguồn thực hành đóng gói và giới hạn chuyển giao

Ngày truy cập: **2026-10-15** (Asia/Ho_Chi_Minh). Người duyệt chuyên môn: chưa có. Trạng thái mọi claim và mọi ứng dụng đề xuất: **UNREVIEWED**. Đây là ghi chép nghiên cứu phục vụ PlantCare, không phải rule/template đã published, không phải chứng cứ một mô hình đã được training.

Đã đọc phần nội dung liên quan tại URL dưới đây. Không sao chép ảnh, video hay toàn văn; quyền sử dụng để training/phân phối chưa được xác nhận. Mỗi nguồn chỉ giữ diễn giải ngắn, không có trích dẫn nguyên văn. Nguồn của hãng vận chuyển là hướng dẫn trong phạm vi hãng; nguồn của nhà bán cây/nhà sản xuất bao bì là thực hành hoặc claim của doanh nghiệp. Chúng không đồng nghĩa thử nghiệm độc lập chứng minh an toàn cho mọi loài cây.

## Danh mục và bằng chứng truy cập

| ID | Nguồn primary, URL | Ngày nguồn hiển thị | Trạng thái / phương pháp đọc | Phạm vi |
| --- | --- | --- | --- | --- |
| EMS | [EMS: Hướng dẫn bọc gói hàng cây cảnh](https://ems.com.vn/tin-tuc/tin-dich-vu-moi/huong-dan-boc-goi-hang-cay-canh---dich-vu-ems-cay-canh) | 2021-03-16, metadata bài postId 310 | READ: web parser chỉ trả title; lấy HTML HTTP 200, parse `__NEXT_DATA__.props.pageProps.navigationData.Post.content`, decode HTML entities và đọc toàn bộ nội dung bài | Dịch vụ EMS cây cảnh trong nước tại thời điểm bài |
| EUCAP | [EU CAP Network: IN.TRA.VIVA.](https://eu-cap-network.ec.europa.eu/projects/innovations-supply-chain-ornamental-plants-market-packaging-and-transport-nursery-products_en) | Dự án 2019–2021, hoàn tất | READ: nội dung dự án và hai practice abstracts qua web | Cây vườn ươm, mô phỏng phòng lạnh/container tại Italy |
| CAYXINH | [Cây Xinh: Quy trình đóng hàng đi tỉnh](https://cayxinh.com.vn/huong-dan-mua-hang/) | Không xác định từ phần đọc | READ: nội dung HTML qua web | Quy trình bán hàng của Cây Xinh, gồm cây rời và tiểu cảnh |
| NTC | [Nhà Thương Cây: Đóng gói, giao hàng và đổi trả](https://nhathuongcay.com/chinh-sach-dong-goi-giao-hang-va-doi-tra) | Không xác định từ phần đọc | READ_TEXT_ONLY: đọc HTML chính sách; phần đóng gói là video nhúng, **chưa xem video** | Điều kiện giao hàng/đổi trả của doanh nghiệp |
| SADEC | [Sadec91: Gói trầu bà thanh xuân đi xa](https://sadec91.vn/blog/cach-dong-goi-cay-trau-ba-thanh-xuan-ship-di-xa-khong-hu-mpum) | 2026-06-01 | READ: web open lỗi; Node fetch HTTP 200, đọc nội dung HTML bài sau bỏ script/style | Hướng dẫn thương mại cho trầu bà thanh xuân |
| GHTK | [GHTK: Hướng dẫn đóng gói hàng hóa](https://ghtk.vn/blog/cach-dong-goi-hang-hoa-van-chuyen/) | 2025-12-11 | READ: các mục 1.11, 2, 3 và giới hạn lỗi qua web | Quy định của GHTK theo loại dịch vụ |
| UFP | [UFP Packaging: How to Safely Ship Plants Direct to Consumer](https://ufppackaging.com/insights/shipping-plants-safely) | Updated 2026-07-14 | READ: bài HTML qua web | Nhà cung cấp bao bì, gửi cây trực tiếp khách hàng |
| SPS | [Smart Packaging Solutions: Packaging for flowers](https://smart-packaging-solutions.com/en/markets/flowers) | Không xác định từ phần đọc | READ: nội dung giới thiệu và properties qua web | Đặc tính quảng bá sản phẩm bao bì hoa/cây |
| FEDEX | [FedEx: How to ship flowers and plants](https://www.fedex.com/en-us/shipping/how-to-ship-flowers-and-plants.html) | Không xác định từ phần đọc | READ: bài HTML official, live plants, FAQ, disclaimer qua web; nguồn bổ sung từ tìm kiếm official | FedEx US; tách cây chậu/cây giống/hoa cắt |

## Claims nguyên tử — diễn giải theo nguồn

### EMS

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| EMS-01 | Dịch vụ mô tả cây thân mềm có bầu đất giữ rễ; loại trừ cây gỗ/cổ thụ cồng kềnh cần xử lý đặc biệt. | Phạm vi nhận gửi của EMS, không taxonomy thực vật phổ quát. |
| EMS-02 | Bài cho phép cây nhỏ ≤5 kg dùng xốp/PVC với lỗ khí; cây >5 kg, lớn hoặc cành mềm yêu cầu khung chắc. | Quy trình 2021; cần EMS xác nhận hiện hành, không pin 5 kg thành ngưỡng an toàn PlantCare. |
| EMS-03 | Cần cố định cây, giữ bầu đất, đệm chậu dễ vỡ, tránh nước tự do và dán cảnh báo. | Không có định lượng tải nén/độ dày đệm hay điều kiện tất cả loài. |
| EMS-04 | Bài không nhận yêu cầu bảo đảm nhiệt/ánh sáng/ẩm đặc biệt xuyên suốt. | Không suy ra dịch vụ thường là cold chain. |

### EU CAP Network — IN.TRA.VIVA.

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| EUCAP-01 | Dự án thử cảm biến stress, đóng gói sinh học và tổ chức xếp tải trong mô phỏng. | Đây là practice abstract của dự án; không phải toàn bộ dataset/protocol. |
| EUCAP-02 | Abstract báo nhiệt độ trung bình tối ưu khoảng 8°C và chỉ số xếp tải khoảng 60%. | Không đủ loài/định nghĩa chỉ số để áp dụng cho cây nhiệt đới/chậu parcel. |
| EUCAP-03 | Kết quả nêu khác biệt suy giảm theo giống và vấn đề với một số bao bì phân hủy sinh học. | Không mặc định biodegradable tốt hơn về khả năng bảo vệ. |

### Cây Xinh

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| CAYXINH-01 | Shop dùng giấy mềm/nilon, hộp xốp/carton; tránh ép lá khi bọc và dùng hộp cứng. | Thực hành doanh nghiệp, không có test nén/rơi hoặc tỷ lệ hư độc lập. |
| CAYXINH-02 | Đất/cát/sỏi có thể đóng riêng; một số tiểu cảnh chậu dùng xe khách theo tư vấn. | Không tự chuyển hồ sơ cây nguyên chậu sang gửi rễ trần/tách đất. |
| CAYXINH-03 | Shop chụp cây hiện có để khách chọn vì từng cây khác nhau. | Ảnh mẫu loại cây không đại diện hình dạng hồ sơ người dùng. |

### Nhà Thương Cây

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| NTC-01 | Chính sách nhận yêu cầu đổi trả kèm bằng chứng ảnh/video tình trạng khi mở gói. | Chính sách riêng doanh nghiệp; PlantCare chưa có đặc tả nghiệp vụ đổi trả. |
| NTC-02 | Trang phân biệt gãy/dập nặng, bầu vỡ, héo không hồi phục với tổn thương nhỏ. | Hữu ích làm nhãn khảo sát hư hại; cần rubric chuyên gia để nhất quán. |
| NTC-03 | Thời gian giao hàng công bố thay đổi theo khu vực và dịch vụ. | Không nhập thời gian/phí shop thành ETA/cước thực của hồ sơ. |

**Giới hạn truy cập:** chưa phân tích video nhúng; không gán kỹ thuật đóng gói cụ thể cho video này.

### Sadec91

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| SADEC-01 | Bài dùng carton, giấy/bọt khí và lấp khoảng trống để hạn chế cây xê dịch. | Hướng dẫn riêng trầu bà thanh xuân, không có độ dày hay kết quả test. |
| SADEC-02 | Bài đề xuất tỉa lá hư/quá dài và bọc gốc/lá. | Tỉa lá sống hoặc ép bọt khí vào lá có thể gây tổn thương; không tự động áp dụng. |
| SADEC-03 | Bài khuyên giao nhanh và ghi thông tin gửi hàng. | Không bảo đảm an toàn chỉ bằng lựa chọn hãng; không xuất PII vào share công khai. |

### GHTK

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| GHTK-01 | Mục cây tươi yêu cầu cố định thân/ngọn, bọc bầu chống rơi đất và đệm chậu trước thùng ngoài. | Hướng dẫn hãng; lớp màng co không phải mặc định quấn kín tán lá mọi cây. |
| GHTK-02 | Bài nêu 3–5 lớp chống sốc quanh chậu và phân biệt giới hạn Express/BBS. | Số lớp phụ thuộc vật liệu; không thay thế độ dày, tải trọng và xác nhận hãng. |
| GHTK-03 | Bài phân biệt khối lượng thực với khối lượng quy đổi theo dịch vụ. | Mẫu số quy đổi phải có phiên bản hãng; ngoài scope chi phí vật tư hiện tại. |
| GHTK-04 | Hộp quá lớn gây xê dịch; hộp quá nhỏ làm ép và thiếu đệm. | Tối ưu chi phí phải sau kiểm fit/load/bảo vệ. |

### UFP Packaging

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| UFP-01 | Bài khuyên hộp theo kích thước/hành trình, lỗ khí cho cây nhỏ và gia cường cây lớn. | Claim nhà cung cấp; không có ngưỡng kích thước/lỗ khí được kiểm cho từng loài. |
| UFP-02 | Kiểm tra sức khỏe/rễ, giữ đất ẩm vừa; giữ bầu bằng collar/màng/clamshell. | Không chẩn đoán bệnh qua ảnh hoặc mặc định lịch tưới cố định. |
| UFP-03 | Bài đề xuất kiểm tra xê dịch, tránh lưu cuối tuần và xem thời tiết. | Kiểm tra nhẹ theo template được duyệt; không tự lắc mạnh cây dễ gãy. |
| UFP-04 | Bài đề cập heat/cold packs và ethylene treatment. | Chưa có dose/placement/species safety; không đưa vào hướng dẫn tự thực hiện. |

### Smart Packaging Solutions

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| SPS-01 | Trang mô tả bao bì compact, tái chế, ổn định trong ẩm và không cách nhiệt. | Claim sản phẩm, không phải chứng chỉ áp cho mọi carton. |
| SPS-02 | Bao bì trình bày hoa/cây và bảo vệ khi vận chuyển là mục tiêu thiết kế. | Không có thông số thử nghiệm hoặc mức giảm hư để nhập rule. |

### FedEx official

| Claim ID | Nội dung diễn giải | Điều kiện và giới hạn |
| --- | --- | --- |
| FEDEX-01 | Với cây chậu, giữ đất trong túi ở vùng chậu và dùng divider chống chậu dịch chuyển. | Không nhầm giữ đất với bọc kín cả tán; phải tránh siết thân. |
| FEDEX-02 | Nhãn hướng không bảo đảm kiện luôn được giữ thẳng. | Cần xác nhận mức chịu đổi hướng, không coi mũi tên là cơ chế giữ kiện. |
| FEDEX-03 | Cây chậu gửi khi đất bán khô; cây giống trong tray có hướng dẫn độ ẩm riêng. | Không có số giờ tưới hay phần trăm ẩm phổ quát. |
| FEDEX-04 | Hướng dẫn hoa cắt không khuyên dry ice/frozen gel vì chúng có thể dịch chuyển gây hại. | Hoa cắt khác cây chậu; không lấy câu này để kết luận mọi cold pack đều cấm. |
| FEDEX-05 | FedEx nêu hướng dẫn này không toàn diện và không có bảo đảm. | Dịch vụ/luật US không tự áp dụng Việt Nam. |

## Xung đột và suy luận cho PlantCare

Các mục dưới đây là **suy luận thiết kế của SE**, không thêm claim an toàn của nguồn:

| Chủ đề | Xung đột/phạm vi | Cách xử lý đề xuất |
| --- | --- | --- |
| Cây nguyên chậu / bầu rễ / rễ trần / hoa cắt | Các nguồn nói tới hàng khác nhau; carton + che đất không đủ mô tả mọi loại | MVP giữ một cây nguyên chậu. Nhận diện ngoài scope chuyển NEEDS_EXPERT; không tự tháo chậu/tỉa rễ. |
| Nhiệt và nước | EUCAP có số trung bình của mô phỏng; FedEx/UFP diễn tả ẩm khác nhau; EMS không cam kết môi trường | Source-bound species/context. Không nạp 8°C/60% hoặc thời gian tưới thành ngưỡng chung. Nước đọng khác độ ẩm đất. |
| Lỗ khí / kín kiện | Seal thùng, giữ đất, màng bọc tán và lưu thông khí là các thao tác khác nhau | Bước phải chỉ rõ vùng chậu/tán/thùng, ảnh cận cảnh tương ứng; không nói chung “bọc kín cây”. |
| Đệm / chi phí | Nguồn bàn độ vừa hộp, còn độ dày/lớp không có đặc tả vật liệu chung | Fit/load và chống dịch chuyển là constraint. Giá thấp chỉ xếp hạng sau các constraint; không bịa số giảm hư/CO₂. |
| Cố định / hướng | Nhãn hữu ích nhưng không bảo đảm hướng; cần tránh lực lên thân/lá | Hướng dẫn cố định phần chậu vào insert; checklist không siết thân/lá. High fragility phải review chuyên gia. |
| Ảnh chân thật / ảnh chứng cứ | Ảnh generated đẹp không chứng minh đúng cây, đúng vật liệu hoặc kỹ thuật | Ghi nhãn ảnh AI mô phỏng, kèm ảnh thật hồ sơ private khi consent; reviewer kiểm consistency từng bước. |
| Quy định hãng | EMS cũ, GHTK/FedEx khác dịch vụ và vùng | Knowledge lưu hãng/service/date/access/approval. Kiểm lại trước publishing; không coi bài blog là shipping acceptance hiện hành. |

## Đề xuất bản ghi knowledge và cổng duyệt

Mỗi bản ghi cần `claim_id`, `source_url`, `source_type`, `source_title`, `accessed_at`, `publication_date|null`, `read_status`, `retrieval_method`, `scope`, `paraphrase`, `limitations`, `expert_status`, `reviewer|null`, `rights_status` và `allowed_use`. Các claim trên có `expert_status=UNREVIEWED`, `rights_status=NOT_CONFIRMED`, chỉ cho phép `REFERENCE_LINK_AND_SHORT_SUMMARY`; không cho phép tự suy ra `TRAINING_LICENSED`.

Kiến thức tham khảo có thể hỗ trợ giải thích vì sao cần xác nhận dữ liệu hoặc chuyển chuyên gia. Chỉ rule/template đã PUBLISHED, có fixture, người duyệt và phạm vi rõ mới quyết định kỹ thuật. Khi output AI dẫn nguồn, link phải thuộc danh mục; unknown phải giữ unknown và không được dựng citation hoặc số đo từ ảnh. Fine-tuning cần dataset đã được cấp quyền, gán nhãn, tách evaluation và biên bản chạy model riêng; nghiên cứu nguồn này chưa thực hiện fine-tuning.
