# Review giáo trình Việt Nam — metadata và phạm vi sử dụng

Ngày kiểm tra: **2026-10-18**, Asia/Saigon. Phạm vi: hai trang thư viện chính thức và biểu ghi đầy đủ liên kết từ trang thứ hai. **Chưa đọc toàn văn hai giáo trình; chưa huấn luyện mô hình.**

## VN-TEXTBOOK-01 — Hoa, cây cảnh đại cương

| Trường | Kết quả xác minh trên trang giới thiệu |
| --- | --- |
| Nguồn | [Thư viện Học viện Nông nghiệp Việt Nam](https://infolib.vnua.edu.vn/gioi-thieu-tai-lieu-moi/giao-trinh-hoa-cay-canh-dai-cuong-63799) |
| Tác giả | Nguyễn Văn Tình, Nguyễn Anh Đức, Bùi Ngọc Tân; chủ biên: Phạm Thị Minh Phương, Đặng Văn Đông |
| Xuất bản | NXB Học viện Nông nghiệp; ký hiệu xếp giá `635.90711 GIA 2025` |
| Ngày | Trang cập nhật 26/09/2025. Không thấy trường năm xuất bản riêng; không đồng nhất ngày cập nhật với năm xuất bản sách. |
| Access/license | Trang HTML đọc được; chưa có toàn văn. Không thấy giấy phép training/RAG hoặc tái sử dụng ảnh: **UNKNOWN**. |

Trang giới thiệu nêu bảy chương; phần mục lục cho biết chương 2 về phân loại, chương 3 về yêu cầu sinh thái, chương 7 về thu hoạch/xử lý/bảo quản/vận chuyển **hoa cắt**. Đây là **tên chương**, không phải nội dung chương đã đọc. Không suy ra ngưỡng nhiệt, độ ẩm, thời gian tưới hoặc cách đóng gói cây có chậu từ mục lục này. [Nguồn](https://infolib.vnua.edu.vn/gioi-thieu-tai-lieu-moi/giao-trinh-hoa-cay-canh-dai-cuong-63799)

## VN-TEXTBOOK-02 — Kỹ thuật trồng hoa cây cảnh

| Trường | Kết quả xác minh từ catalog |
| --- | --- |
| Nguồn | [Thư viện số Đại học Lâm nghiệp](https://elib.vnuf.edu.vn/handle/123456789/179?locale=vi); [biểu ghi đầy đủ](https://elib.vnuf.edu.vn/handle/123456789/179?mode=full) |
| Tác giả | Catalog ghi `KS Phạm Văn, Duệ`; dạng hiển thị chuẩn hóa để tra cứu: Phạm Văn Duệ |
| Năm | `dc.date.issued = 2005`; ngày nhập kho 03/04/2012 không phải năm xuất bản |
| Nhà xuất bản | Trường `dc.publisher` chỉ ghi “Hà Nội”; chưa xác minh tên nhà xuất bản. |
| Access/license | Đọc được metadata. Trang liệt kê PDF 36,68 MB nhưng phần truy xuất không cung cấp liên kết toàn văn đọc được; chưa đọc PDF. Quyền training/RAG/ảnh: **UNKNOWN**. |

Mục lục metadata nêu chương I đại cương, II hoa hồng, III hoa mai, VI lan, VIII bảo quản hoa cắt và các nhóm cây khác. Biểu ghi nhảy từ VI sang VIII; **không tự bổ sung chương VII**. Mục lục và tóm tắt không đủ chứng minh SOP hay ngưỡng an toàn vận chuyển. [Biểu ghi](https://elib.vnuf.edu.vn/handle/123456789/179?mode=full)

## Trạng thái corpus và SOP

| Nguồn | Registry/bibliography | RAG trả lời kỹ thuật | SOP candidate | Rule production |
| --- | --- | --- | --- | --- |
| VN-TEXTBOOK-01 | `METADATA_REVIEWED` | `EXCLUDED_METADATA_ONLY` | Chỉ đầu mối tìm chương/toàn văn hợp lệ | Không đủ căn cứ |
| VN-TEXTBOOK-02 | `METADATA_REVIEWED` | `EXCLUDED_METADATA_ONLY` | Chỉ đầu mối tìm chương/toàn văn hợp lệ | Không đủ căn cứ |

Metadata có thể giúp người biên soạn xác định sách cần đọc; không đưa vào context để AI tạo chỉ dẫn sinh thái/packing. Khi có toàn văn và quyền sử dụng phù hợp, cần ghi phiên bản, trang, loại cây, điều kiện áp dụng, trích xuất claim ngắn và chuyên gia review trước khi đưa vào corpus kỹ thuật. Kiến thức hoa cắt không tự chuyển sang cây có chậu. Nguồn cũ cần kiểm lại tính phù hợp với vật tư, carrier và hành trình hiện tại.

## Đề xuất đầu vào PlantCare — suy luận thiết kế, không phải claim từ sách

- Giữ phân biệt cây có chậu, hoa cắt, cây rễ trần; ca ngoài phạm vi một cây/chậu hiện tại cần người có chuyên môn, không âm thầm đổi phương pháp.
- AI có thể gợi ý tên/nhóm cây; người dùng xác nhận. Khi chưa rõ loài hoặc yêu cầu chăm sóc, ghi `UNKNOWN`, không điền thông số từ tiêu đề chương.
- Yêu cầu đo/cân thật chiều cao, tán, kích cỡ chậu, tổng khối lượng; xác nhận kích thước **trong** hộp và tải trọng từ nguồn vật tư.
- Thu thập hành trình, thời điểm, thời lượng và nguồn nhiệt độ dự kiến. Không coi thời tiết ngoài trời là nhiệt độ trong kiện.
- Các thông số sinh thái chỉ được dùng để sinh cảnh báo/SOP sau khi có nguồn nội dung đúng đối tượng và approval; review metadata này không thay đổi rule, runtime hoặc tài sản ảnh.
