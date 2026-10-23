export interface Ward {
  name: string;
}

export interface District {
  name: string;
  wards: string[];
}

export interface Province {
  name: string;
  districts: District[];
}

export const vietnamLocations: Province[] = [
  {
    name: 'Hà Nội',
    districts: [
      {
        name: 'Quận Ba Đình',
        wards: ['Phường Trúc Bạch', 'Phường Cống Vị', 'Phường Điện Biên', 'Phường Đội Cấn', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Liễu Giai', 'Phường Ngọc Hà', 'Phường Ngọc Khánh', 'Phường Phúc Xá', 'Phường Quán Thánh', 'Phường Thành Công', 'Phường Vĩnh Phúc']
      },
      {
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Hàng Bạc', 'Phường Hàng Bài', 'Phường Hàng Trống', 'Phường Tràng Tiền', 'Phường Cửa Đông', 'Phường Cửa Nam', 'Phường Đồng Xuân', 'Phường Hàng Bồ', 'Phường Hàng Bông', 'Phường Hàng Buồm', 'Phường Hàng Gai', 'Phường Hàng Mã', 'Phường Lý Thái Tổ', 'Phường Phan Chu Trinh', 'Phường Phúc Tân', 'Phường Chương Dương', 'Phường Trần Hưng Đạo']
      },
      {
        name: 'Quận Đống Đa',
        wards: ['Phường Cát Linh', 'Phường Hàng Bột', 'Phường Khâm Thiên', 'Phường Khương Thượng', 'Phường Kim Liên', 'Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Nam Đồng', 'Phường Ngã Tư Sở', 'Phường Ô Chợ Dừa', 'Phường Phương Liên', 'Phường Phương Mai', 'Phường Quang Trung', 'Phường Quốc Tử Giám', 'Phường Thịnh Quang', 'Phường Thổ Quan', 'Phường Trung Liệt', 'Phường Trung Phụng', 'Phường Trung Tự', 'Phường Văn Chương', 'Phường Văn Miếu']
      },
      {
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa']
      },
      {
        name: 'Quận Hai Bà Trưng',
        wards: ['Phường Bách Khoa', 'Phường Bạch Đằng', 'Phường Bạch Mai', 'Phường Cầu Dền', 'Phường Đống Mác', 'Phường Đồng Nhân', 'Phường Đồng Tâm', 'Phường Lê Đại Hành', 'Phường Minh Khai', 'Phường Nguyễn Du', 'Phường Phạm Đình Hổ', 'Phường Phố Huế', 'Phường Quỳnh Lôi', 'Phường Quỳnh Mai', 'Phường Thanh Lương', 'Phường Thanh Nhàn', 'Phường Trương Định', 'Phường Vĩnh Tuy']
      },
      {
        name: 'Quận Tây Hồ',
        wards: ['Phường Bưởi', 'Phường Thụy Khuê', 'Phường Yên Phụ', 'Phường Tứ Liên', 'Phường Nhật Tân', 'Phường Quảng An', 'Phường Xuân La', 'Phường Phú Thượng']
      },
      {
        name: 'Quận Thanh Xuân',
        wards: ['Phường Hạ Đình', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Khương Trung', 'Phường Kim Giang', 'Phường Nhân Chính', 'Phường Phương Liệt', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Nam', 'Phường Thanh Xuân Trung', 'Phường Thượng Đình']
      },
      {
        name: 'Quận Hoàng Mai',
        wards: ['Phường Đại Kim', 'Phường Định Công', 'Phường Giáp Bát', 'Phường Hoàng Liệt', 'Phường Hoàng Văn Thụ', 'Phường Lĩnh Nam', 'Phường Mai Động', 'Phường Tân Mai', 'Phường Thanh Trì', 'Phường Thịnh Liệt', 'Phường Trần Phú', 'Phường Tương Mai', 'Phường Vĩnh Hưng', 'Phường Yên Sở']
      },
      {
        name: 'Quận Long Biên',
        wards: ['Phường Bồ Đề', 'Phường Cự Khối', 'Phường Đức Giang', 'Phường Gia Thụy', 'Phường Giang Biên', 'Phường Long Biên', 'Phường Ngọc Lâm', 'Phường Ngọc Thụy', 'Phường Phúc Đồng', 'Phường Phúc Lợi', 'Phường Sài Đồng', 'Phường Thạch Bàn', 'Phường Thượng Thanh', 'Phường Việt Hưng']
      },
      {
        name: 'Quận Nam Từ Liêm',
        wards: ['Phường Cầu Diễn', 'Phường Đại Mỗ', 'Phường Mễ Trì', 'Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Phú Đô', 'Phường Phương Canh', 'Phường Tây Mỗ', 'Phường Trung Văn', 'Phường Xuân Phương']
      },
      {
        name: 'Quận Bắc Từ Liêm',
        wards: ['Phường Cổ Nhuế 1', 'Phường Cổ Nhuế 2', 'Phường Đông Ngạc', 'Phường Đức Thắng', 'Phường Liên Mạc', 'Phường Minh Khai', 'Phường Phú Diễn', 'Phường Phúc Diễn', 'Phường Tây Tựu', 'Phường Thượng Cát', 'Phường Thụy Phương', 'Phường Xuân Đỉnh', 'Phường Xuân Tảo']
      },
      {
        name: 'Quận Hà Đông',
        wards: ['Phường Biên Giang', 'Phường Đồng Mai', 'Phường Dương Nội', 'Phường Hà Cầu', 'Phường Kiến Hưng', 'Phường La Khê', 'Phường Mộ Lao', 'Phường Nguyễn Trãi', 'Phường Phú La', 'Phường Phú Lãm', 'Phường Phú Lương', 'Phường Phúc La', 'Phường Quang Trung', 'Phường Vạn Phúc', 'Phường Văn Quán', 'Phường Yên Nghĩa', 'Phường Yết Kiêu']
      },
      {
        name: 'Huyện Gia Lâm',
        wards: ['Thị trấn Trâu Quỳ', 'Thị trấn Yên Viên', 'Xã Bát Tràng', 'Xã Cổ Bi', 'Xã Đa Tốn', 'Xã Đặng Xá', 'Xã Dương Xá', 'Xã Ninh Hiệp', 'Xã Phù Đổng', 'Xã Yên Thường']
      },
      {
        name: 'Huyện Đông Anh',
        wards: ['Thị trấn Đông Anh', 'Xã Cổ Loa', 'Xã Hải Bối', 'Xã Kim Chung', 'Xã Kim Nỗ', 'Xã Nam Hồng', 'Xã Nguyên Khê', 'Xã Tiên Dương', 'Xã Vĩnh Ngọc', 'Xã Xuân Canh']
      },
      {
        name: 'Huyện Thanh Trì',
        wards: ['Thị trấn Văn Điển', 'Xã Đại Áng', 'Xã Đông Mỹ', 'Xã Ngũ Hiệp', 'Xã Ngọc Hồi', 'Xã Tân Triều', 'Xã Thanh Liệt', 'Xã Tứ Hiệp', 'Xã Vĩnh Quỳnh']
      },
      {
        name: 'Huyện Sóc Sơn',
        wards: ['Thị trấn Sóc Sơn', 'Xã Hiền Ninh', 'Xã Mai Đình', 'Xã Phù Linh', 'Xã Phù Lỗ', 'Xã Quang Tiến', 'Xã Tân Dân', 'Xã Tiên Dược', 'Xã Trung Giã']
      },
      {
        name: 'Huyện Hoài Đức',
        wards: ['Thị trấn Trạm Trôi', 'Xã An Khánh', 'Xã An Thượng', 'Xã Di Trạch', 'Xã Đức Giang', 'Xã Kim Chung', 'Xã La Phù', 'Xã Song Phương', 'Xã Vân Canh']
      },
      {
        name: 'Huyện Mê Linh',
        wards: ['Thị trấn Quang Minh', 'Thị trấn Chi Đông', 'Xã Chu Phan', 'Xã Đại Thịnh', 'Xã Mê Linh', 'Xã Tiền Phong', 'Xã Văn Khê']
      }
    ]
  },
  {
    name: 'Bắc Ninh',
    districts: [
      {
        name: 'TP. Bắc Ninh',
        wards: ['Phường Suối Hoa', 'Phường Ninh Xá', 'Phường Tiền An', 'Phường Vệ An', 'Phường Vũ Ninh', 'Phường Kinh Bắc', 'Phường Đại Phúc', 'Phường Vân Dương', 'Phường Hạp Lĩnh', 'Phường Võ Cường', 'Phường Thị Cầu', 'Phường Đáp Cầu', 'Phường Vạn An', 'Phường Khắc Niệm', 'Phường Kim Chân', 'Phường Nam Sơn', 'Phường Phong Khê']
      },
      {
        name: 'Thị xã Từ Sơn',
        wards: ['Phường Đông Ngàn', 'Phường Đồng Nguyên', 'Phường Tân Hồng', 'Phường Trang Hạ', 'Phường Đình Bảng', 'Phường Đồng Kỵ', 'Phường Châu Khê', 'Phường Phù Chẩn', 'Phường Hương Mạc', 'Phường Phù Khê', 'Phường Tam Sơn', 'Phường Tương Giang']
      },
      {
        name: 'Thị xã Quế Võ',
        wards: ['Phường Phố Mới', 'Phường Bằng An', 'Phường Bồng Lai', 'Phường Cách Bi', 'Phường Đại Xuân', 'Phường Nhân Hòa', 'Phường Phương Liễu', 'Phường Phượng Mao', 'Phường Quế Tân', 'Phường Việt Hùng']
      },
      {
        name: 'Thị xã Thuận Thành',
        wards: ['Phường Hồ', 'Phường An Bình', 'Phường Gia Đông', 'Phường Hà Mãn', 'Phường Ninh Xá', 'Phường Song Hồ', 'Phường Thanh Khương', 'Phường Trạm Lộ', 'Phường Trí Quả', 'Phường Xuân Lâm']
      },
      {
        name: 'Huyện Tiên Du',
        wards: ['Thị trấn Lim', 'Xã Cảnh Hưng', 'Xã Đại Đồng', 'Xã Hoàn Sơn', 'Xã Lạc Vệ', 'Xã Liên Bão', 'Xã Nội Duệ', 'Xã Phật Tích', 'Xã Phú Lâm', 'Xã Tân Chi', 'Xã Tri Phương', 'Xã Việt Đoàn']
      },
      {
        name: 'Huyện Yên Phong',
        wards: ['Thị trấn Chờ', 'Xã Dũng Liệt', 'Xã Đông Phong', 'Xã Đông Thọ', 'Xã Đông Tiến', 'Xã Hòa Tiến', 'Xã Long Châu', 'Xã Tam Đa', 'Xã Tam Giang', 'Xã Thụy Hòa', 'Xã Trung Nghĩa', 'Xã Văn Môn', 'Xã Yên Phụ', 'Xã Yên Trung']
      },
      {
        name: 'Huyện Gia Bình',
        wards: ['Thị trấn Gia Bình', 'Xã Bình Dương', 'Xã Cao Đức', 'Xã Đại Bái', 'Xã Đại Lai', 'Xã Đông Cứu', 'Xã Giang Sơn', 'Xã Lãng Ngâm', 'Xã Nhân Thắng', 'Xã Quỳnh Phú', 'Xã Song Giang', 'Xã Thái Bảo', 'Xã Vạn Ninh', 'Xã Xuân Lai']
      },
      {
        name: 'Huyện Lương Tài',
        wards: ['Thị trấn Thứa', 'Xã An Thịnh', 'Xã Bình Định', 'Xã Lâm Thao', 'Xã Mỹ Hương', 'Xã Phú Hòa', 'Xã Phú Lương', 'Xã Quảng Phú', 'Xã Tân Lãng', 'Xã Trung Chính', 'Xã Trung Kênh', 'Xã Trừng Xá']
      }
    ]
  },
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        name: 'Quận 1',
        wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cô Giang', 'Phường Cầu Kho', 'Phường Cầu Ông Lãnh', 'Phường Đa Kao', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão', 'Phường Tân Định']
      },
      {
        name: 'Quận 3',
        wards: ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 14']
      },
      {
        name: 'TP. Thủ Đức',
        wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường Thủ Thiêm', 'Phường Hiệp Phú', 'Phường Linh Trung', 'Phường Linh Tây', 'Phường Linh Chiểu', 'Phường Tam Bình', 'Phường Bình Chiểu', 'Phường Phước Long A', 'Phường Phước Long B', 'Phường Tăng Nhơn Phú A', 'Phường Long Thạnh Mỹ']
      },
      {
        name: 'Quận 7',
        wards: ['Phường Tân Phong', 'Phường Tân Phú', 'Phường Phú Mỹ', 'Phường Tân Quy', 'Phường Tân Kiểng', 'Phường Tân Hưng', 'Phường Bình Thuận', 'Phường Phú Thuận', 'Phường Tân Thuận Đông', 'Phường Tân Thuận Tây']
      },
      {
        name: 'Quận 10',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15']
      },
      {
        name: 'Quận Bình Thạnh',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28']
      },
      {
        name: 'Quận Tân Bình',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15']
      },
      {
        name: 'Quận Gò Vấp',
        wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17']
      },
      {
        name: 'Quận Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17']
      },
      {
        name: 'Quận Bình Tân',
        wards: ['Phường An Lạc', 'Phường An Lạc A', 'Phường Bình Hưng Hòa', 'Phường Bình Hưng Hòa A', 'Phường Bình Hưng Hòa B', 'Phường Bình Trị Đông', 'Phường Bình Trị Đông A', 'Phường Bình Trị Đông B', 'Phường Tân Tạo', 'Phường Tân Tạo A']
      },
      {
        name: 'Huyện Hóc Môn',
        wards: ['Thị trấn Hóc Môn', 'Xã Bà Điểm', 'Xã Đông Thạnh', 'Xã Nhị Bình', 'Xã Tân Hiệp', 'Xã Tân Thới Nhì', 'Xã Tân Xuân', 'Xã Thới Tam Thôn', 'Xã Trung Chánh', 'Xã Xuân Thới Đông', 'Xã Xuân Thới Sơn', 'Xã Xuân Thới Thượng']
      },
      {
        name: 'Huyện Bình Chánh',
        wards: ['Thị trấn Tân Túc', 'Xã An Phú Tây', 'Xã Bình Chánh', 'Xã Bình Hưng', 'Xã Bình Lợi', 'Xã Đa Phước', 'Xã Hưng Long', 'Xã Lê Minh Xuân', 'Xã Phạm Văn Hai', 'Xã Phong Phú', 'Xã Quy Đức', 'Xã Tân Kiên', 'Xã Tân Nhựt', 'Xã Tân Quý Tây', 'Xã Vĩnh Lộc A', 'Xã Vĩnh Lộc B']
      }
    ]
  },
  {
    name: 'Đà Nẵng',
    districts: [
      {
        name: 'Quận Hải Châu',
        wards: ['Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam', 'Phường Hòa Thuận Đông', 'Phường Hòa Thuận Tây', 'Phường Nam Dương', 'Phường Phước Ninh', 'Phường Bình Thuận', 'Phường Bình Hiên']
      },
      {
        name: 'Quận Thanh Khê',
        wards: ['Phường An Khê', 'Phường Chính Gián', 'Phường Hòa Khê', 'Phường Tam Thuận', 'Phường Tân Chính', 'Phường Thạc Gián', 'Phường Thanh Khê Đông', 'Phường Thanh Khê Tây', 'Phường Vĩnh Trung', 'Phường Xuân Hà']
      },
      {
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Mân Thái', 'Phường Nại Hiên Đông', 'Phường Phước Mỹ', 'Phường Thọ Quang']
      },
      {
        name: 'Quận Ngũ Hành Sơn',
        wards: ['Phường Hòa Hải', 'Phường Hòa Quý', 'Phường Khuê Mỹ', 'Phường Mỹ An']
      },
      {
        name: 'Quận Cẩm Lệ',
        wards: ['Phường Hòa An', 'Phường Hòa Phát', 'Phường Hòa Thọ Đông', 'Phường Hòa Thọ Tây', 'Phường Hòa Xuân', 'Phường Khuê Trung']
      },
      {
        name: 'Quận Liên Chiểu',
        wards: ['Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Minh']
      },
      {
        name: 'Huyện Hòa Vang',
        wards: ['Xã Hòa Bắc', 'Xã Hòa Châu', 'Xã Hòa Khương', 'Xã Hòa Liên', 'Xã Hòa Nhơn', 'Xã Hòa Ninh', 'Xã Hòa Phong', 'Xã Hòa Phú', 'Xã Hòa Phước', 'Xã Hòa Sơn', 'Xã Hòa Tiến']
      }
    ]
  },
  {
    name: 'Hải Phòng',
    districts: [
      {
        name: 'Quận Hồng Bàng',
        wards: ['Phường Hạ Lý', 'Phường Hoàng Văn Thụ', 'Phường Hùng Vương', 'Phường Minh Khai', 'Phường Phan Bội Châu', 'Phường Quán Toan', 'Phường Sở Dầu', 'Phường Thượng Lý', 'Phường Trại Chuối']
      },
      {
        name: 'Quận Ngô Quyền',
        wards: ['Phường Cầu Đất', 'Phường Cầu Tre', 'Phường Đằng Giang', 'Phường Đông Khê', 'Phường Đồng Quốc Bình', 'Phường Gia Viên', 'Phường Lạc Viên', 'Phường Lạch Tray', 'Phường Lê Lợi', 'Phường Máy Chai', 'Phường Máy Tơ', 'Phường Vạn Mỹ']
      },
      {
        name: 'Quận Lê Chân',
        wards: ['Phường An Biên', 'Phường An Dương', 'Phường Cát Dài', 'Phường Dư Hàng', 'Phường Dư Hàng Kênh', 'Phường Hàng Kênh', 'Phường Hồ Nam', 'Phường Kênh Dương', 'Phường Lam Sơn', 'Phường Niệm Nghĩa', 'Phường Nghĩa Xá', 'Phường Trại Cau', 'Phường Trần Nguyên Hãn', 'Phường Vĩnh Niệm']
      },
      {
        name: 'Huyện Thủy Nguyên',
        wards: ['Thị trấn Núi Đèo', 'Thị trấn Minh Đức', 'Xã An Lư', 'Xã Dương Quan', 'Xã Hoa Động', 'Xã Hoàng Động', 'Xã Kiền Bái', 'Xã Lâm Động', 'Xã Lập Lễ', 'Xã Lưu Kiếm', 'Xã Lưu Kỳ', 'Xã Thủy Đường', 'Xã Thủy Sơn']
      },
      {
        name: 'Quận Hải An',
        wards: ['Phường Cát Bi', 'Phường Đằng Hải', 'Phường Đằng Lâm', 'Phường Đông Hải 1', 'Phường Đông Hải 2', 'Phường Nam Hải', 'Phường Thành Tô', 'Phường Tràng Cát']
      }
    ]
  },
  {
    name: 'Cần Thơ',
    districts: [
      {
        name: 'Quận Ninh Kiều',
        wards: ['Phường An Bình', 'Phường An Cư', 'Phường An Hòa', 'Phường An Khánh', 'Phường An Nghiệp', 'Phường An Phú', 'Phường Cái Khế', 'Phường Hưng Lợi', 'Phường Tân An', 'Phường Thới Bình', 'Phường Xuân Khánh']
      },
      {
        name: 'Quận Bình Thủy',
        wards: ['Phường An Thới', 'Phường Bình Thủy', 'Phường Bùi Hữu Nghĩa', 'Phường Long Hòa', 'Phường Long Tuyền', 'Phường Thới An Đông', 'Phường Trà An', 'Phường Trà Nóc']
      },
      {
        name: 'Quận Cái Răng',
        wards: ['Phường Ba Láng', 'Phường Hưng Phú', 'Phường Hưng Thạnh', 'Phường Lê Bình', 'Phường Phú Thứ', 'Phường Tân Phú', 'Phường Yên Thắng']
      }
    ]
  },
  {
    name: 'Lâm Đồng',
    districts: [
      {
        name: 'TP. Đà Lạt',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Xã Tà Nung', 'Xã Trạm Hành', 'Xã Xuân Thọ', 'Xã Xuân Trường']
      },
      {
        name: 'TP. Bảo Lộc',
        wards: ['Phường 1', 'Phường 2', 'Phường B’Lao', 'Phường Lộc Phát', 'Phường Lộc Sơn', 'Phường Lộc Tiến', 'Xã Đại Lào', 'Xã Đam B’ri', 'Xã Lộc Châu', 'Xã Lộc Nga', 'Xã Lộc Thanh']
      },
      {
        name: 'Huyện Đức Trọng',
        wards: ['Thị trấn Liên Nghĩa', 'Xã Bình Thạnh', 'Xã Đà Loan', 'Xã Đa Quyn', 'Xã Hiệp An', 'Xã Hiệp Thạnh', 'Xã Liên Hiệp', 'Xã Ninh Gia', 'Xã Ninh Loan', 'Xã N’Thol Hạ', 'Xã Phú Hội', 'Xã Tà Hine', 'Xã Tà Năng', 'Xã Tân Hội', 'Xã Tân Thành']
      },
      {
        name: 'Huyện Đơn Dương',
        wards: ['Thị trấn Thạnh Mỹ', 'Thị trấn D’Ran', 'Xã Ka Đơn', 'Xã Ka Đô', 'Xã Lạc Lâm', 'Xã Lạc Xuân', 'Xã Pró', 'Xã Quảng Lập', 'Xã Tu Tra']
      }
    ]
  },
  {
    name: 'Khánh Hòa',
    districts: [
      {
        name: 'TP. Nha Trang',
        wards: ['Phường Lộc Thọ', 'Phường Phước Hải', 'Phường Phước Tân', 'Phường Phước Tiến', 'Phường Phương Sài', 'Phường Phương Sơn', 'Phường Tân Lập', 'Phường Vạn Thạnh', 'Phường Vạn Thắng', 'Phường Vĩnh Hải', 'Phường Vĩnh Hòa', 'Phường Vĩnh Phước', 'Phường Vĩnh Thọ', 'Phường Vĩnh Nguyên', 'Phường Vĩnh Trường', 'Xã Phước Đồng', 'Xã Vĩnh Hiệp', 'Xã Vĩnh Ngọc', 'Xã Vĩnh Thái', 'Xã Vĩnh Thạnh', 'Xã Vĩnh Trung']
      },
      {
        name: 'TP. Cam Ranh',
        wards: ['Phường Ba Ngòi', 'Phường Cam Linh', 'Phường Cam Lộc', 'Phường Cam Lợi', 'Phường Cam Nghĩa', 'Phường Cam Phú', 'Phường Cam Phúc Bắc', 'Phường Cam Phúc Nam', 'Phường Cam Thuận']
      },
      {
        name: 'Thị xã Ninh Hòa',
        wards: ['Phường Ninh Đa', 'Phường Ninh Diêm', 'Phường Ninh Giang', 'Phường Ninh Hà', 'Phường Ninh Hải', 'Phường Ninh Hiệp', 'Phường Ninh Thủy']
      }
    ]
  },
  {
    name: 'Thừa Thiên Huế',
    districts: [
      {
        name: 'TP. Huế',
        wards: ['Phường Vĩnh Ninh', 'Phường Phú Nhuận', 'Phường Phú Hội', 'Phường Thuận Hòa', 'Phường Thuận Thành', 'Phường Hương Sơ', 'Phường Kim Long', 'Phường Thủy Xuân', 'Phường An Cựu', 'Phường An Đông', 'Phường An Tây', 'Phường Phước Vĩnh', 'Phường Trường An', 'Phường Tây Lộc', 'Phường Phú Hậu']
      },
      {
        name: 'Thị xã Hương Thủy',
        wards: ['Phường Phú Bài', 'Phường Thủy Châu', 'Phường Thủy Dương', 'Phường Thủy Lương', 'Phường Thủy Phương']
      },
      {
        name: 'Thị xã Hương Trà',
        wards: ['Phường Hương Chữ', 'Phường Hương Văn', 'Phường Hương Vân', 'Phường Hương Xuân', 'Phường Tứ Hạ']
      }
    ]
  },
  {
    name: 'Bình Dương',
    districts: [
      {
        name: 'TP. Thủ Dầu Một',
        wards: ['Phường Phú Cường', 'Phường Hiệp Thành', 'Phường Chánh Nghĩa', 'Phường Phú Hòa', 'Phường Phú Thọ', 'Phường Phú Lợi', 'Phường Định Hòa', 'Phường Phú Mỹ', 'Phường Hòa Phú', 'Phường Phú Tân']
      },
      {
        name: 'TP. Thuận An',
        wards: ['Phường Lái Thiêu', 'Phường An Phú', 'Phường Thuận Giao', 'Phường Bình Hòa', 'Phường An Thạnh', 'Phường Bình Chuẩn', 'Phường Vĩnh Phú', 'Phường Bình Nhâm', 'Phường Hưng Định']
      },
      {
        name: 'TP. Dĩ An',
        wards: ['Phường Dĩ An', 'Phường An Bình', 'Phường Tân Bình', 'Phường Đông Hòa', 'Phường Bình An', 'Phường Bình Thắng', 'Phường Tân Đông Hiệp']
      },
      {
        name: 'TP. Tân Uyên',
        wards: ['Phường Uyên Hưng', 'Phường Tân Phước Khánh', 'Phường Thái Hòa', 'Phường Thạnh Phước', 'Phường Tân Hiệp', 'Phường Khánh Bình']
      },
      {
        name: 'TP. Bến Cát',
        wards: ['Phường Mỹ Phước', 'Phường Thới Hòa', 'Phường Hòa Lợi', 'Phường Tân Định', 'Phường Chánh Phú Hòa']
      }
    ]
  },
  {
    name: 'Đồng Nai',
    districts: [
      {
        name: 'TP. Biên Hòa',
        wards: ['Phường Quyết Thắng', 'Phường Thanh Bình', 'Phường Trung Dũng', 'Phường Hòa Bình', 'Phường Thống Nhất', 'Phường Quang Vinh', 'Phường Tân Phong', 'Phường Bửu Long', 'Phường Trảng Dài', 'Phường Tân Tiến', 'Phường Tân Mai', 'Phường Tam Hiệp', 'Phường Tam Hòa', 'Phường Hố Nai', 'Phường Long Bình', 'Phường Long Bình Tân', 'Phường An Bình']
      },
      {
        name: 'TP. Long Khánh',
        wards: ['Phường Xuân An', 'Phường Xuân Bình', 'Phường Xuân Hòa', 'Phường Xuân Trung', 'Phường Xuân Thanh', 'Phường Phú Bình', 'Phường Suối Tre', 'Phường Bảo Vinh']
      },
      {
        name: 'Huyện Long Thành',
        wards: ['Thị trấn Long Thành', 'Xã An Phước', 'Xã Bàu Cạn', 'Xã Bình An', 'Xã Bình Sơn', 'Xã Cẩm Đường', 'Xã Lộc An', 'Xã Long An', 'Xã Long Đức', 'Xã Phước Bình', 'Xã Phước Thái', 'Xã Tam An', 'Xã Tân Hiệp']
      },
      {
        name: 'Huyện Nhơn Trạch',
        wards: ['Thị trấn Hiệp Phước', 'Xã Đại Phước', 'Xã Long Tân', 'Xã Long Thọ', 'Xã Phú Đông', 'Xã Phú Hội', 'Xã Phú Hữu', 'Xã Phú Thạnh', 'Xã Phước An', 'Xã Phước Khánh', 'Xã Phước Thiền', 'Xã Vĩnh Thanh']
      }
    ]
  },
  {
    name: 'Bà Rịa - Vũng Tàu',
    districts: [
      {
        name: 'TP. Vũng Tàu',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường Thắng Nhất', 'Phường Thắng Nhì', 'Phường Thắng Tam', 'Phường Nguyễn An Ninh', 'Phường Rạch Dừa']
      },
      {
        name: 'TP. Bà Rịa',
        wards: ['Phường Phước Hưng', 'Phường Phước Trung', 'Phường Phước Hiệp', 'Phường Phước Nguyên', 'Phường Long Toàn', 'Phường Long Tâm', 'Phường Kim Dinh', 'Phường Long Hương']
      },
      {
        name: 'Thị xã Phú Mỹ',
        wards: ['Phường Phú Mỹ', 'Phường Phước Hòa', 'Phường Tân Phước', 'Phường Mỹ Xuân', 'Phường Hắc Dịch']
      }
    ]
  },
  {
    name: 'Bắc Giang',
    districts: [
      {
        name: 'TP. Bắc Giang',
        wards: ['Phường Hoàng Văn Thụ', 'Phường Lê Lợi', 'Phường Ngô Quyền', 'Phường Trần Phú', 'Phường Mỹ Độ', 'Phường Thọ Xương', 'Phường Xương Giang', 'Phường Dĩnh Kế', 'Phường Dĩnh Trì', 'Phường Đa Mai']
      },
      {
        name: 'Thị xã Việt Yên',
        wards: ['Phường Bích Động', 'Phường Nếnh', 'Phường Tăng Tiến', 'Phường Hồng Thái', 'Phường Quảng Minh', 'Phường Ninh Sơn']
      },
      {
        name: 'Huyện Lạng Giang',
        wards: ['Thị trấn Vôi', 'Thị trấn Kép', 'Xã An Hà', 'Xã Dương Đức', 'Xã Hương Lạc', 'Xã Mỹ Thái', 'Xã Tân Dĩnh', 'Xã Thái Đào', 'Xã Tiên Lục', 'Xã Xuân Hương', 'Xã Yên Mỹ']
      }
    ]
  },
  {
    name: 'Quảng Ninh',
    districts: [
      {
        name: 'TP. Hạ Long',
        wards: ['Phường Bạch Đằng', 'Phường Bãi Cháy', 'Phường Cao Thắng', 'Phường Cao Xanh', 'Phường Giếng Đáy', 'Phường Hà Khánh', 'Phường Hà Khẩu', 'Phường Hà Lầm', 'Phường Hà Phong', 'Phường Hà Trung', 'Phường Hà Tu', 'Phường Hồng Gai', 'Phường Hồng Hà', 'Phường Hồng Hải', 'Phường Hùng Thắng', 'Phường Trần Hưng Đạo', 'Phường Tuần Châu', 'Phường Việt Hưng', 'Phường Yết Kiêu']
      },
      {
        name: 'TP. Cẩm Phả',
        wards: ['Phường Cẩm Bình', 'Phường Cẩm Đông', 'Phường Cẩm Phú', 'Phường Cẩm Sơn', 'Phường Cẩm Tây', 'Phường Cẩm Thạch', 'Phường Cẩm Thành', 'Phường Cẩm Thịnh', 'Phường Cẩm Thủy', 'Phường Cẩm Trung', 'Phường Cửa Ông', 'Phường Mông Dương', 'Phường Quang Hanh']
      },
      {
        name: 'TP. Uông Bí',
        wards: ['Phường Bắc Sơn', 'Phường Nam Khê', 'Phường Phương Đông', 'Phường Phương Nam', 'Phường Quang Trung', 'Phường Thanh Sơn', 'Phường Trưng Vương', 'Phường Vàng Danh', 'Phường Yên Thanh']
      },
      {
        name: 'TP. Móng Cái',
        wards: ['Phường Bình Ngọc', 'Phường Hải Hòa', 'Phường Hải Yên', 'Phường Ka Long', 'Phường Ninh Dương', 'Phường Trà Cổ', 'Phường Trần Phú']
      }
    ]
  },
  {
    name: 'Hải Dương',
    districts: [
      {
        name: 'TP. Hải Dương',
        wards: ['Phường Bình Hàn', 'Phường Cẩm Thượng', 'Phường Hải Tân', 'Phường Lê Thanh Nghị', 'Phường Ngọc Châu', 'Phường Nguyễn Trãi', 'Phường Nhị Châu', 'Phường Phạm Ngũ Lão', 'Phường Quang Trung', 'Phường Tân Bình', 'Phường Thanh Bình', 'Phường Trần Hưng Đạo', 'Phường Trần Phú', 'Phường Tứ Minh', 'Phường Việt Hòa']
      },
      {
        name: 'TP. Chí Linh',
        wards: ['Phường An Lạc', 'Phường Bến Tắm', 'Phường Cổ Thành', 'Phường Cộng Hòa', 'Phường Đồng Lạc', 'Phường Hoàng Tân', 'Phường Hoàng Tiến', 'Phường Phả Lại', 'Phường Sao Đỏ', 'Phường Tân Dân', 'Phường Thái Học', 'Phường Văn An', 'Phường Văn Đức']
      },
      {
        name: 'Thị xã Kinh Môn',
        wards: ['Phường An Lưu', 'Phường An Phụ', 'Phường An Sinh', 'Phường Duy Tân', 'Phường Hiến Thành', 'Phường Hiệp An', 'Phường Hiệp Sơn', 'Phường Long Xuyên', 'Phường Minh Tân', 'Phường Phạm Thái', 'Phường Phú Thứ', 'Phường Tân Dân', 'Phường Thái Thịnh', 'Phường Thất Hùng']
      }
    ]
  },
  {
    name: 'Hưng Yên',
    districts: [
      {
        name: 'TP. Hưng Yên',
        wards: ['Phường An Tảo', 'Phường Hiến Nam', 'Phường Hồng Châu', 'Phường Lam Sơn', 'Phường Lê Lợi', 'Phường Minh Khai', 'Phường Quang Trung']
      },
      {
        name: 'Thị xã Mỹ Hào',
        wards: ['Phường Bạch Sam', 'Phường Bần Yên Nhân', 'Phường Dị Sử', 'Phường Minh Đức', 'Phường Nhân Hòa', 'Phường Phùng Chí Kiên', 'Phường Phan Đình Phùng']
      },
      {
        name: 'Huyện Văn Giang',
        wards: ['Thị trấn Văn Giang', 'Xã Cửu Cao', 'Xã Liên Nghĩa', 'Xã Long Hưng', 'Xã Mễ Sở', 'Xã Nghĩa Trụ', 'Xã Phụng Công', 'Xã Thắng Lợi', 'Xã Vĩnh Khúc', 'Xã Xuân Quan']
      },
      {
        name: 'Huyện Yên Mỹ',
        wards: ['Thị trấn Yên Mỹ', 'Xã Đồng Than', 'Xã Giai Phạm', 'Xã Hoàn Long', 'Xã Liêu Xá', 'Xã Nghĩa Hiệp', 'Xã Ngọc Long', 'Xã Tân Lập', 'Xã Tân Minh', 'Xã Thanh Long', 'Xã Trung Hòa', 'Xã Trung Hưng', 'Xã Việt Cường', 'Xã Yên Hòa', 'Xã Yên Phú']
      }
    ]
  },
  {
    name: 'Vĩnh Phúc',
    districts: [
      {
        name: 'TP. Vĩnh Yên',
        wards: ['Phường Định Trung', 'Phường Đống Đa', 'Phường Đồng Tâm', 'Phường Hội Hợp', 'Phường Khai Quang', 'Phường Liên Bảo', 'Phường Ngô Quyền', 'Phường Tích Sơn', 'Phường Thanh Trù']
      },
      {
        name: 'TP. Phúc Yên',
        wards: ['Phường Đồng Xuân', 'Phường Hùng Vương', 'Phường Nam Viêm', 'Phường Phúc Thắng', 'Phường Tiền Châu', 'Phường Trưng Nhị', 'Phường Trưng Trắc', 'Phường Xuân Hòa']
      },
      {
        name: 'Huyện Bình Xuyên',
        wards: ['Thị trấn Hương Canh', 'Thị trấn Bá Hiến', 'Thị trấn Đạo Đức', 'Thị trấn Gia Khánh', 'Thị trấn Thanh Lãng', 'Xã Hương Sơn', 'Xã Phú Xuân', 'Xã Quất Lưu', 'Xã Sơn Lôi', 'Xã Tam Hợp', 'Xã Tân Phong', 'Xã Thiện Kế', 'Xã Trung Mỹ']
      }
    ]
  },
  {
    name: 'Thái Nguyên',
    districts: [
      {
        name: 'TP. Thái Nguyên',
        wards: ['Phường Cam Giá', 'Phường Chùa Hang', 'Phường Đồng Bẩm', 'Phường Đồng Quang', 'Phường Gia Sàng', 'Phường Hoàng Văn Thụ', 'Phường Hương Sơn', 'Phường Phan Đình Phùng', 'Phường Phú Xá', 'Phường Quan Triều', 'Phường Quang Trung', 'Phường Quang Vinh', 'Phường Tân Lập', 'Phường Tân Long', 'Phường Tân Thành', 'Phường Tân Thịnh', 'Phường Thịnh Đán', 'Phường Tích Lương', 'Phường Trung Thành', 'Phường Túc Duyên']
      },
      {
        name: 'TP. Sông Công',
        wards: ['Phường Bách Quang', 'Phường Cải Đan', 'Phường Châu Sơn', 'Phường Lương Sơn', 'Phường Mỏ Chè', 'Phường Phố Cò', 'Phường Thắng Lợi']
      },
      {
        name: 'TP. Phổ Yên',
        wards: ['Phường Ba Hàng', 'Phường Bãi Bông', 'Phường Bắc Sơn', 'Phường Đắc Sơn', 'Phường Đông Cao', 'Phường Đồng Tiến', 'Phường Hồng Tiến', 'Phường Nam Tiến', 'Phường Tân Hương', 'Phường Tân Phú', 'Phường Thuận Thành', 'Phường Tiên Phong', 'Phường Trung Thành']
      }
    ]
  },
  {
    name: 'Nam Định',
    districts: [
      {
        name: 'TP. Nam Định',
        wards: ['Phường Bà Triệu', 'Phường Cửa Bắc', 'Phường Cửa Nam', 'Phường Hạ Long', 'Phường Lộc Hạ', 'Phường Lộc Hòa', 'Phường Lộc Vượng', 'Phường Năng Tĩnh', 'Phường Ngô Quyền', 'Phường Nguyễn Du', 'Phường Phan Đình Phùng', 'Phường Quang Trung', 'Phường Thống Nhất', 'Phường Trần Đăng Ninh', 'Phường Trần Hưng Đạo', 'Phường Trần Quang Khải', 'Phường Trần Tế Xương', 'Phường Trường Thi', 'Phường Vị Hoàng', 'Phường Vị Xuyên']
      },
      {
        name: 'Huyện Giao Thủy',
        wards: ['Thị trấn Ngô Đồng', 'Thị trấn Quất Lâm', 'Xã Bạch Long', 'Xã Bình Hòa', 'Xã Giao An', 'Xã Giao Châu', 'Xã Giao Hà', 'Xã Giao Hải', 'Xã Giao Hương', 'Xã Giao Lạc', 'Xã Giao Long', 'Xã Giao Nhân', 'Xã Giao Phong', 'Xã Giao Tân', 'Xã Giao Thanh', 'Xã Giao Thiện', 'Xã Giao Thịnh', 'Xã Giao Tiến', 'Xã Giao Xuân', 'Xã Giao Yến', 'Xã Hoành Sơn', 'Xã Hồng Thuận']
      }
    ]
  },
  {
    name: 'Thái Bình',
    districts: [
      {
        name: 'TP. Thái Bình',
        wards: ['Phường Bồ Xuyên', 'Phường Đề Thám', 'Phường Hoàng Diệu', 'Phường Kỳ Bá', 'Phường Lê Hồng Phong', 'Phường Phú Khánh', 'Phường Quang Trung', 'Phường Tiền Phong', 'Phường Trần Hưng Đạo', 'Phường Trần Lãm']
      },
      {
        name: 'Huyện Vũ Thư',
        wards: ['Thị trấn Vũ Thư', 'Xã Bách Thuận', 'Xã Đồng Thanh', 'Xã Dũng Nghĩa', 'Xã Duy Nhất', 'Xã Hiệp Hòa', 'Xã Hòa Bình', 'Xã Hồng Phong', 'Xã Hồng Lý', 'Xã Minh Khai', 'Xã Minh Lãng', 'Xã Minh Quang', 'Xã Nguyên Xá', 'Xã Phúc Thành', 'Xã Song An', 'Xã Song Lãng', 'Xã Tam Quang', 'Xã Tân Hòa', 'Xã Tân Lập', 'Xã Tân Phong', 'Xã Trung An', 'Xã Tự Tân', 'Xã Việt Hùng', 'Xã Việt Thuận', 'Xã Vĩnh Hòa', 'Xã Vũ Đoài', 'Xã Vũ Hội', 'Xã Vũ Tiến', 'Xã Vũ Vinh', 'Xã Xuân Hòa']
      }
    ]
  },
  {
    name: 'Hà Nam',
    districts: [
      {
        name: 'TP. Phủ Lý',
        wards: ['Phường Châu Sơn', 'Phường Hai Bà Trưng', 'Phường Lê Hồng Phong', 'Phường Lương Khánh Thiện', 'Phường Minh Khai', 'Phường Quang Trung', 'Phường Thanh Châu', 'Phường Thanh Tuyền', 'Phường Trần Hưng Đạo']
      },
      {
        name: 'Thị xã Duy Tiên',
        wards: ['Phường Bạch Thượng', 'Phường Châu Giang', 'Phường Duy Hải', 'Phường Duy Minh', 'Phường Đồng Văn', 'Phường Hòa Mạc', 'Phường Hoàng Đông', 'Phường Tiên Nội', 'Phường Yên Bắc']
      }
    ]
  },
  {
    name: 'Ninh Bình',
    districts: [
      {
        name: 'TP. Ninh Bình',
        wards: ['Phường Bích Đào', 'Phường Đông Thành', 'Phường Nam Bình', 'Phường Nam Thành', 'Phường Ninh Khánh', 'Phường Ninh Phong', 'Phường Ninh Sơn', 'Phường Phúc Thành', 'Phường Tân Thành', 'Phường Thanh Bình', 'Phường Vân Giang']
      },
      {
        name: 'TP. Tam Điệp',
        wards: ['Phường Bắc Sơn', 'Phường Nam Sơn', 'Phường Tân Bình', 'Phường Tây Sơn', 'Phường Trung Sơn', 'Phường Yên Bình']
      },
      {
        name: 'Huyện Hoa Lư',
        wards: ['Thị trấn Thiên Tôn', 'Xã Ninh An', 'Xã Ninh Giang', 'Xã Ninh Hải', 'Xã Ninh Hòa', 'Xã Ninh Khang', 'Xã Ninh Mỹ', 'Xã Ninh Thắng', 'Xã Ninh Vân', 'Xã Ninh Xuân', 'Xã Trường Yên']
      }
    ]
  },
  {
    name: 'Thanh Hóa',
    districts: [
      {
        name: 'TP. Thanh Hóa',
        wards: ['Phường An Hưng', 'Phường Ba Đình', 'Phường Điện Biên', 'Phường Đông Cương', 'Phường Đông Hải', 'Phường Đông Hương', 'Phường Đông Sơn', 'Phường Đông Thọ', 'Phường Đông Vệ', 'Phường Hàm Rồng', 'Phường Lam Sơn', 'Phường Nam Ngạn', 'Phường Ngọc Trạo', 'Phường Phú Sơn', 'Phường Quảng Cát', 'Phường Quảng Đông', 'Phường Quảng Hưng', 'Phường Quảng Phú', 'Phường Quảng Tâm', 'Phường Quảng Thành', 'Phường Quảng Thắng', 'Phường Quảng Thịnh', 'Phường Tào Xuyên', 'Phường Tân Sơn', 'Phường Trường Thi']
      },
      {
        name: 'TP. Sầm Sơn',
        wards: ['Phường Bắc Sơn', 'Phường Trung Sơn', 'Phường Trường Sơn', 'Phường Quảng Cư', 'Phường Quảng Châu', 'Phường Quảng Thọ', 'Phường Quảng Vinh', 'Phường Quảng Tiến']
      },
      {
        name: 'Thị xã Bỉm Sơn',
        wards: ['Phường Ba Đình', 'Phường Bắc Sơn', 'Phường Đông Sơn', 'Phường Lam Sơn', 'Phường Ngọc Trạo', 'Phường Phú Sơn']
      }
    ]
  },
  {
    name: 'Nghệ An',
    districts: [
      {
        name: 'TP. Vinh',
        wards: ['Phường Bến Thủy', 'Phường Cửa Nam', 'Phường Đội Cung', 'Phường Đông Vĩnh', 'Phường Hà Huy Tập', 'Phường Hưng Bình', 'Phường Hưng Dũng', 'Phường Hưng Phúc', 'Phường Lê Lợi', 'Phường Lê Mao', 'Phường Quán Bàu', 'Phường Quang Trung', 'Phường Trung Đô', 'Phường Trường Thi', 'Phường Vinh Tân']
      },
      {
        name: 'Thị xã Cửa Lò',
        wards: ['Phường Nghi Hải', 'Phường Nghi Hòa', 'Phường Nghi Hương', 'Phường Nghi Tân', 'Phường Nghi Thu', 'Phường Nghi Thủy', 'Phường Thu Thủy']
      },
      {
        name: 'Thị xã Thái Hòa',
        wards: ['Phường Hòa Hiếu', 'Phường Long Sơn', 'Phường Quang Phong', 'Phường Quang Tiến']
      }
    ]
  },
  {
    name: 'Hà Tĩnh',
    districts: [
      {
        name: 'TP. Hà Tĩnh',
        wards: ['Phường Bắc Hà', 'Phường Đại Nài', 'Phường Hà Huy Tập', 'Phường Nam Hà', 'Phường Nguyễn Du', 'Phường Tân Giang', 'Phường Thạch Linh', 'Phường Thạch Quý', 'Phường Trần Phú', 'Phường Văn Yên']
      },
      {
        name: 'Thị xã Hồng Lĩnh',
        wards: ['Phường Bắc Hồng', 'Phường Đậu Liêu', 'Phường Đức Thuận', 'Phường Nam Hồng', 'Phường Trung Lương']
      },
      {
        name: 'Thị xã Kỳ Anh',
        wards: ['Phường Hưng Trí', 'Phường Kỳ Long', 'Phường Kỳ Liên', 'Phường Kỳ Phương', 'Phường Kỳ Thịnh', 'Phường Kỳ Trinh']
      }
    ]
  },
  {
    name: 'Quảng Bình',
    districts: [
      {
        name: 'TP. Đồng Hới',
        wards: ['Phường Bắc Lý', 'Phường Bắc Nghĩa', 'Phường Đồng Hải', 'Phường Đồng Phú', 'Phường Đồng Sơn', 'Phường Đức Ninh Đông', 'Phường Hải Thành', 'Phường Nam Lý', 'Phường Phú Hải']
      },
      {
        name: 'Thị xã Ba Đồn',
        wards: ['Phường Ba Đồn', 'Phường Quảng Long', 'Phường Quảng Phong', 'Phường Quảng Phúc', 'Phường Quảng Thọ', 'Phường Quảng Thuận']
      }
    ]
  },
  {
    name: 'Quảng Trị',
    districts: [
      {
        name: 'TP. Đông Hà',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường Đông Giang', 'Phường Đông Lễ', 'Phường Đông Lương', 'Phường Đông Thanh']
      },
      {
        name: 'Thị xã Quảng Trị',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường An Đôn']
      }
    ]
  },
  {
    name: 'Quảng Nam',
    districts: [
      {
        name: 'TP. Tam Kỳ',
        wards: ['Phường An Mỹ', 'Phường An Phú', 'Phường An Sơn', 'Phường An Xuân', 'Phường Hòa Hương', 'Phường Hòa Thuận', 'Phường Phước Hòa', 'Phường Tân Thạnh', 'Phường Trường Xuân']
      },
      {
        name: 'TP. Hội An',
        wards: ['Phường Cẩm An', 'Phường Cẩm Châu', 'Phường Cẩm Nam', 'Phường Cẩm Phô', 'Phường Cửa Đại', 'Phường Minh An', 'Phường Sơn Phong', 'Phường Tân An', 'Phường Thanh Hà']
      },
      {
        name: 'Thị xã Điện Bàn',
        wards: ['Phường Vĩnh Điện', 'Phường Điện An', 'Phường Điện Dương', 'Phường Điện Nam Bắc', 'Phường Điện Nam Trung', 'Phường Điện Nam Đông', 'Phường Điện Ngọc']
      }
    ]
  },
  {
    name: 'Quảng Ngãi',
    districts: [
      {
        name: 'TP. Quảng Ngãi',
        wards: ['Phường Chánh Lộ', 'Phường Lê Hồng Phong', 'Phường Nghĩa Chánh', 'Phường Nghĩa Lộ', 'Phường Nguyễn Nghiêm', 'Phường Quảng Phú', 'Phường Trần Hưng Đạo', 'Phường Trần Phú', 'Phường Trương Quang Trọng']
      },
      {
        name: 'Thị xã Đức Phổ',
        wards: ['Phường Nguyễn Nghiêm', 'Phường Phổ Hòa', 'Phường Phổ Ninh', 'Phường Phổ Quang', 'Phường Phổ Thạnh', 'Phường Phổ Minh', 'Phường Phổ Văn', 'Phường Phổ Vinh']
      }
    ]
  },
  {
    name: 'Bình Định',
    districts: [
      {
        name: 'TP. Quy Nhơn',
        wards: ['Phường Bùi Thị Xuân', 'Phường Đống Đa', 'Phường Ghềnh Ráng', 'Phường Hải Cảng', 'Phường Lê Hồng Phong', 'Phường Lê Lợi', 'Phường Ngô Mây', 'Phường Nguyễn Văn Cừ', 'Phường Nhơn Bình', 'Phường Nhơn Phú', 'Phường Quang Trung', 'Phường Thị Nại', 'Phường Trần Hưng Đạo', 'Phường Trần Phú', 'Phường Trần Quang Diệu']
      },
      {
        name: 'Thị xã An Nhơn',
        wards: ['Phường Bình Định', 'Phường Đập Đá', 'Phường Nhơn Hòa', 'Phường Nhơn Hưng', 'Phường Nhơn Thành']
      },
      {
        name: 'Thị xã Hoài Nhơn',
        wards: ['Phường Bồng Sơn', 'Phường Hoài Đức', 'Phường Hoài Hảo', 'Phường Hoài Hương', 'Phường Hoài Tân', 'Phường Hoài Thanh', 'Phường Hoài Thanh Tây', 'Phường Hoài Xuân', 'Phường Tam Quan', 'Phường Tam Quan Bắc', 'Phường Tam Quan Nam']
      }
    ]
  },
  {
    name: 'Phú Yên',
    districts: [
      {
        name: 'TP. Tuy Hòa',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường Phú Đông', 'Phường Phú Lâm', 'Phường Phú Thạnh']
      },
      {
        name: 'Thị xã Sông Cầu',
        wards: ['Phường Xuân Đài', 'Phường Xuân Phú', 'Phường Xuân Thành', 'Phường Xuân Yên']
      },
      {
        name: 'Thị xã Đông Hòa',
        wards: ['Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam', 'Phường Hòa Hiệp Trung', 'Phường Hòa Vinh', 'Phường Hòa Xuân Tây']
      }
    ]
  },
  {
    name: 'Ninh Thuận',
    districts: [
      {
        name: 'TP. Phan Rang - Tháp Chàm',
        wards: ['Phường Bảo An', 'Phường Đài Sơn', 'Phường Đạo Long', 'Phường Đô Vinh', 'Phường Đông Hải', 'Phường Kinh Dinh', 'Phường Mũi Dinh', 'Phường Mỹ Bình', 'Phường Mỹ Đông', 'Phường Mỹ Hải', 'Phường Mỹ Hương', 'Phường Phủ Hà', 'Phường Phước Mỹ', 'Phường Tấn Tài', 'Phường Thanh Sơn', 'Phường Văn Hải']
      }
    ]
  },
  {
    name: 'Bình Thuận',
    districts: [
      {
        name: 'TP. Phan Thiết',
        wards: ['Phường Bình Hưng', 'Phường Đức Long', 'Phường Đức Nghĩa', 'Phường Đức Thắng', 'Phường Hàm Tiến', 'Phường Hưng Long', 'Phường Lạc Đạo', 'Phường Mũi Né', 'Phường Phú Hài', 'Phường Phú Tài', 'Phường Phú Thủy', 'Phường Phú Trinh', 'Phường Thanh Hải', 'Phường Xuân An']
      },
      {
        name: 'Thị xã La Gi',
        wards: ['Phường Bình Tân', 'Phường Phước Hội', 'Phường Phước Lộc', 'Phường Tân An', 'Phường Tân Thiện']
      }
    ]
  },
  {
    name: 'Kon Tum',
    districts: [
      {
        name: 'TP. Kon Tum',
        wards: ['Phường Duy Tân', 'Phường Lê Lợi', 'Phường Ngô Mây', 'Phường Nguyễn Trãi', 'Phường Quang Trung', 'Phường Quyết Thắng', 'Phường Thắng Lợi', 'Phường Thống Nhất', 'Phường Trần Hưng Đạo', 'Phường Trường Chinh']
      }
    ]
  },
  {
    name: 'Gia Lai',
    districts: [
      {
        name: 'TP. Pleiku',
        wards: ['Phường Chi Lăng', 'Phường Diên Hồng', 'Phường Đống Đa', 'Phường Hoa Lư', 'Phường Hội Phú', 'Phường Hội Thương', 'Phường Ia Kring', 'Phường Phù Đổng', 'Phường Tây Sơn', 'Phường Thắng Lợi', 'Phường Thống Nhất', 'Phường Trà Bá', 'Phường Yên Đỗ', 'Phường Yên Thế']
      },
      {
        name: 'Thị xã An Khê',
        wards: ['Phường An Bình', 'Phường An Phú', 'Phường An Phước', 'Phường An Tân', 'Phường Tây Sơn']
      },
      {
        name: 'Thị xã Ayun Pa',
        wards: ['Phường Cheo Reo', 'Phường Đoàn Kết', 'Phường Hòa Bình', 'Phường Sông Bờ']
      }
    ]
  },
  {
    name: 'Đắk Lắk',
    districts: [
      {
        name: 'TP. Buôn Ma Thuột',
        wards: ['Phường Ea Tam', 'Phường Khánh Xuân', 'Phường Tân An', 'Phường Tân Hòa', 'Phường Tân Lập', 'Phường Tân Lợi', 'Phường Tân Thành', 'Phường Tân Tiến', 'Phường Thắng Lợi', 'Phường Thành Công', 'Phường Thành Nhất', 'Phường Thống Nhất', 'Phường Tự An']
      },
      {
        name: 'Thị xã Buôn Hồ',
        wards: ['Phường An Bình', 'Phường An Lạc', 'Phường Bình Tân', 'Phường Đạt Hiếu', 'Phường Đoàn Kết', 'Phường Thiện An', 'Phường Thống Nhất']
      }
    ]
  },
  {
    name: 'Đắk Nông',
    districts: [
      {
        name: 'TP. Gia Nghĩa',
        wards: ['Phường Nghĩa Đức', 'Phường Nghĩa Phú', 'Phường Nghĩa Tân', 'Phường Nghĩa Thành', 'Phường Nghĩa Trung', 'Phường Quảng Thành']
      }
    ]
  },
  {
    name: 'Tây Ninh',
    districts: [
      {
        name: 'TP. Tây Ninh',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường Hiệp Ninh', 'Phường Ninh Sơn', 'Phường Ninh Thạnh']
      },
      {
        name: 'Thị xã Trảng Bàng',
        wards: ['Phường An Hòa', 'Phường An Tịnh', 'Phường Gia Bình', 'Phường Gia Lộc', 'Phường Lộc Hưng', 'Phường Trảng Bàng']
      },
      {
        name: 'Thị xã Hòa Thành',
        wards: ['Phường Hiệp Tân', 'Phường Long Hoa', 'Phường Long Thành Bắc', 'Phường Long Thành Trung']
      }
    ]
  },
  {
    name: 'Bình Phước',
    districts: [
      {
        name: 'TP. Đồng Xoài',
        wards: ['Phường Tân Bình', 'Phường Tân Đồng', 'Phường Tân Phú', 'Phường Tân Thiện', 'Phường Tân Xuân', 'Phường Tiến Thành']
      },
      {
        name: 'Thị xã Bình Long',
        wards: ['Phường An Lộc', 'Phường Hưng Chiến', 'Phường Phú Đức', 'Phường Phú Thịnh']
      },
      {
        name: 'Thị xã Phước Long',
        wards: ['Phường Long Phước', 'Phường Long Thủy', 'Phường Phước Bình', 'Phường Sơn Giang', 'Phường Thác Mơ']
      },
      {
        name: 'Thị xã Chơn Thành',
        wards: ['Phường Chơn Thành', 'Phường Hưng Long', 'Phường Minh Hưng', 'Phường Minh Long', 'Phường Thành Tâm']
      }
    ]
  },
  {
    name: 'Long An',
    districts: [
      {
        name: 'TP. Tân An',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường Khánh Hậu', 'Phường Tân Khánh']
      },
      {
        name: 'Thị xã Kiến Tường',
        wards: ['Phường 1', 'Phường 2', 'Phường 3']
      },
      {
        name: 'Huyện Bến Lức',
        wards: ['Thị trấn Bến Lức', 'Xã An Thạnh', 'Xã Bình Đức', 'Xã Long Hiệp', 'Xã Lương Bình', 'Xã Lương Hòa', 'Xã Mỹ Yên', 'Xã Nhựt Chánh', 'Xã Thạnh Đức', 'Xã Thạnh Hòa', 'Xã Thạnh Lợi', 'Xã Thạnh Phú', 'Xã Tân Bửu', 'Xã Tân Hòa']
      },
      {
        name: 'Huyện Đức Hòa',
        wards: ['Thị trấn Hậu Nghĩa', 'Thị trấn Đức Hòa', 'Thị trấn Hiệp Hòa', 'Xã An Ninh Đông', 'Xã An Ninh Tây', 'Xã Đức Hòa Đông', 'Xã Đức Hòa Hạ', 'Xã Đức Hòa Thượng', 'Xã Đức Lập Hạ', 'Xã Đức Lập Thượng', 'Xã Hiệp Hòa', 'Xã Hựu Thạnh', 'Xã Lộc Giang', 'Xã Mỹ Hạnh Bắc', 'Xã Mỹ Hạnh Nam', 'Xã Tân Mỹ', 'Xã Tân Phú']
      }
    ]
  },
  {
    name: 'Tiền Giang',
    districts: [
      {
        name: 'TP. Mỹ Tho',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường Tân Long']
      },
      {
        name: 'Thị xã Gò Công',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5']
      },
      {
        name: 'Thị xã Cai Lậy',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường Nhị Mỹ']
      }
    ]
  },
  {
    name: 'Bến Tre',
    districts: [
      {
        name: 'TP. Bến Tre',
        wards: ['Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường An Hội', 'Phường Phú Khương', 'Phường Phú Tân']
      },
      {
        name: 'Huyện Châu Thành',
        wards: ['Thị trấn Châu Thành', 'Xã An Hóa', 'Xã An Khánh', 'Xã An Phước', 'Xã Giao Long', 'Xã Hữu Định', 'Xã Phú An Hòa', 'Xã Phú Đức', 'Xã Phú Túc', 'Xã Quới Sơn', 'Xã Tân Thạch', 'Xã Tiên Thủy']
      },
      {
        name: 'Huyện Chợ Lách',
        wards: ['Thị trấn Chợ Lách', 'Xã Hòa Nghĩa', 'Xã Hưng Khánh Trung B', 'Xã Long Thới', 'Xã Phú Phụng', 'Xã Phú Sơn', 'Xã Sơn Định', 'Xã Tân Thiềng', 'Xã Vĩnh Bình', 'Xã Vĩnh Thành']
      }
    ]
  },
  {
    name: 'Trà Vinh',
    districts: [
      {
        name: 'TP. Trà Vinh',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9']
      },
      {
        name: 'Thị xã Duyên Hải',
        wards: ['Phường 1', 'Phường 2']
      }
    ]
  },
  {
    name: 'Vĩnh Long',
    districts: [
      {
        name: 'TP. Vĩnh Long',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 8', 'Phường 9', 'Phường Tân Hòa', 'Phường Tân Hội', 'Phường Tân Ngãi', 'Phường Trường An']
      },
      {
        name: 'Thị xã Bình Minh',
        wards: ['Phường Cái Vồn', 'Phường Đông Thuận', 'Phường Thành Phước']
      }
    ]
  },
  {
    name: 'Đồng Tháp',
    districts: [
      {
        name: 'TP. Cao Lãnh',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 11', 'Phường Hòa Thuận', 'Phường Mỹ Phú']
      },
      {
        name: 'TP. Sa Đéc',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường An Hòa', 'Phường Tân Quy Đông']
      },
      {
        name: 'TP. Hồng Ngự',
        wards: ['Phường An Bình A', 'Phường An Bình B', 'Phường An Lạc', 'Phường An Lộc', 'Phường An Thạnh']
      }
    ]
  },
  {
    name: 'An Giang',
    districts: [
      {
        name: 'TP. Long Xuyên',
        wards: ['Phường Bình Đức', 'Phường Bình Khánh', 'Phường Đông Xuyên', 'Phường Mỹ Bình', 'Phường Mỹ Hòa', 'Phường Mỹ Long', 'Phường Mỹ Phước', 'Phường Mỹ Quý', 'Phường Mỹ Thạnh', 'Phường Mỹ Thới', 'Phường Mỹ Xuyên']
      },
      {
        name: 'TP. Châu Đốc',
        wards: ['Phường Châu Phú A', 'Phường Châu Phú B', 'Phường Núi Sam', 'Phường Vĩnh Mỹ', 'Phường Vĩnh Nguơn']
      },
      {
        name: 'Thị xã Tân Châu',
        wards: ['Phường Long Châu', 'Phường Long Hưng', 'Phường Long Phú', 'Phường Long Sơn', 'Phường Long Thạnh']
      },
      {
        name: 'Thị xã Tịnh Biên',
        wards: ['Phường An Phú', 'Phường Chi Lăng', 'Phường Nhà Bàng', 'Phường Nhơn Hưng', 'Phường Núi Voi', 'Phường Thới Sơn', 'Phường Tịnh Biên']
      }
    ]
  },
  {
    name: 'Kiên Giang',
    districts: [
      {
        name: 'TP. Rạch Giá',
        wards: ['Phường An Bình', 'Phường An Hòa', 'Phường Rạch Sỏi', 'Phường Vĩnh Bảo', 'Phường Vĩnh Hiệp', 'Phường Vĩnh Lạc', 'Phường Vĩnh Lợi', 'Phường Vĩnh Quang', 'Phường Vĩnh Thanh', 'Phường Vĩnh Thanh Vân', 'Phường Vĩnh Thông']
      },
      {
        name: 'TP. Phú Quốc',
        wards: ['Phường Dương Đông', 'Phường An Thới', 'Xã Bãi Thơm', 'Xã Cửa Cạn', 'Xã Cửa Dương', 'Xã Dương Tơ', 'Xã Gành Dầu', 'Xã Hàm Ninh', 'Xã Thổ Châu']
      },
      {
        name: 'TP. Hà Tiên',
        wards: ['Phường Bình San', 'Phường Đông Hồ', 'Phường Mỹ Đức', 'Phường Pháo Đài', 'Phường Tô Châu']
      }
    ]
  },
  {
    name: 'Hậu Giang',
    districts: [
      {
        name: 'TP. Vị Thanh',
        wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7']
      },
      {
        name: 'TP. Ngã Bảy',
        wards: ['Phường Hiệp Lợi', 'Phường Hiệp Thành', 'Phường Lái Hiếu', 'Phường Ngã Bảy']
      },
      {
        name: 'Thị xã Long Mỹ',
        wards: ['Phường Bình Thạnh', 'Phường Thuận An', 'Phường Trà Lồng', 'Phường Vĩnh Tường']
      }
    ]
  },
  {
    name: 'Sóc Trăng',
    districts: [
      {
        name: 'TP. Sóc Trăng',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10']
      },
      {
        name: 'Thị xã Vĩnh Châu',
        wards: ['Phường 1', 'Phường 2', 'Phường Khánh Hòa', 'Phường Vĩnh Phước']
      },
      {
        name: 'Thị xã Ngã Năm',
        wards: ['Phường 1', 'Phường 2', 'Phường 3']
      }
    ]
  },
  {
    name: 'Bạc Liêu',
    districts: [
      {
        name: 'TP. Bạc Liêu',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường Nhà Mát']
      },
      {
        name: 'Thị xã Giá Rai',
        wards: ['Phường 1', 'Phường Hộ Phòng', 'Phường Láng Tròn']
      }
    ]
  },
  {
    name: 'Cà Mau',
    districts: [
      {
        name: 'TP. Cà Mau',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường Tân Thành', 'Phường Tân Xuyên']
      },
      {
        name: 'Huyện Năm Căn',
        wards: ['Thị trấn Năm Căn', 'Xã Đất Mới', 'Xã Hàm Rồng', 'Xã Hàng Vịnh', 'Xã Hiệp Tùng', 'Xã Lâm Hải', 'Xã Tam Giang', 'Xã Tam Giang Đông']
      }
    ]
  },
  {
    name: 'Hòa Bình',
    districts: [
      {
        name: 'TP. Hòa Bình',
        wards: ['Phường Chăm Mát', 'Phường Dân Chủ', 'Phường Đồng Tiến', 'Phường Hữu Nghị', 'Phường Kỳ Sơn', 'Phường Phương Lâm', 'Phường Tân Hòa', 'Phường Tân Thịnh', 'Phường Thái Bình', 'Phường Thống Nhất', 'Phường Thịnh Lang', 'Phường Trung Minh']
      },
      {
        name: 'Huyện Lương Sơn',
        wards: ['Thị trấn Lương Sơn', 'Xã Cao Dương', 'Xã Cư Yên', 'Xã Hòa Sơn', 'Xã Khang Khang', 'Xã Lâm Sơn', 'Xã Liên Sơn', 'Xã Nhuận Trạch', 'Xã Tân Vinh', 'Xã Thanh Cao', 'Xã Thanh Sơn']
      }
    ]
  },
  {
    name: 'Sơn La',
    districts: [
      {
        name: 'TP. Sơn La',
        wards: ['Phường Chiềng An', 'Phường Chiềng Cơi', 'Phường Chiềng Lề', 'Phường Chiềng Sinh', 'Phường Quyết Tâm', 'Phường Quyết Thắng', 'Phường Tô Hiệu']
      },
      {
        name: 'Huyện Mộc Châu',
        wards: ['Thị trấn Mộc Châu', 'Thị trấn Nông trường Mộc Châu', 'Xã Chiềng Hắc', 'Xã Đông Sang', 'Xã Mường Sang', 'Xã Phiêng Luông', 'Xã Tân Lập']
      }
    ]
  },
  {
    name: 'Điện Biên',
    districts: [
      {
        name: 'TP. Điện Biên Phủ',
        wards: ['Phường Him Lam', 'Phường Mường Thanh', 'Phường Nam Thanh', 'Phường Noong Bua', 'Phường Tân Thanh', 'Phường Thanh Bình', 'Phường Thanh Trường']
      },
      {
        name: 'Thị xã Mường Lay',
        wards: ['Phường Na Lay', 'Phường Sông Đà']
      }
    ]
  },
  {
    name: 'Lai Châu',
    districts: [
      {
        name: 'TP. Lai Châu',
        wards: ['Phường Đoàn Kết', 'Phường Đông Phong', 'Phường Quyết Thắng', 'Phường Quyết Tiến', 'Phường Tân Phong']
      }
    ]
  },
  {
    name: 'Lào Cai',
    districts: [
      {
        name: 'TP. Lào Cai',
        wards: ['Phường Bắc Cường', 'Phường Bắc Lệnh', 'Phường Bình Minh', 'Phường Cốc Lếu', 'Phường Duyên Hải', 'Phường Kim Tân', 'Phường Lào Cai', 'Phường Nam Cường', 'Phường Pom Hán', 'Phường Xuân Tăng']
      },
      {
        name: 'Thị xã Sa Pa',
        wards: ['Phường Cầu Mây', 'Phường Hàm Rồng', 'Phường Ô Quý Hồ', 'Phường Phan Si Păng', 'Phường Sa Pa', 'Phường Sa Pả']
      }
    ]
  },
  {
    name: 'Yên Bái',
    districts: [
      {
        name: 'TP. Yên Bái',
        wards: ['Phường Đồng Tâm', 'Phường Hồng Hà', 'Phường Hợp Minh', 'Phường Minh Tân', 'Phường Nam Cường', 'Phường Nguyễn Thái Học', 'Phường Nguyễn Phúc', 'Phường Yên Ninh', 'Phường Yên Thịnh']
      },
      {
        name: 'Thị xã Nghĩa Lộ',
        wards: ['Phường Cầu Thia', 'Phường Pú Trạng', 'Phường Tân An', 'Phường Trung Tâm']
      }
    ]
  },
  {
    name: 'Phú Thọ',
    districts: [
      {
        name: 'TP. Việt Trì',
        wards: ['Phường Bạch Hạc', 'Phường Bến Gót', 'Phường Dữu Lâu', 'Phường Gia Cẩm', 'Phường Nông Trang', 'Phường Tân Dân', 'Phường Thanh Miếu', 'Phường Thọ Sơn', 'Phường Tiên Cát', 'Phường Vân Cơ', 'Phường Vân Phú']
      },
      {
        name: 'Thị xã Phú Thọ',
        wards: ['Phường Âu Cơ', 'Phường Hùng Vương', 'Phường Phong Châu', 'Phường Thanh Vinh']
      }
    ]
  },
  {
    name: 'Tuyên Quang',
    districts: [
      {
        name: 'TP. Tuyên Quang',
        wards: ['Phường An Tường', 'Phường Đội Cấn', 'Phường Hưng Thành', 'Phường Minh Xuân', 'Phường Mỹ Lâm', 'Phường Nông Tiến', 'Phường Phan Thiết', 'Phường Tân Hà', 'Phường Tân Quang', 'Phường Ỷ La']
      }
    ]
  },
  {
    name: 'Hà Giang',
    districts: [
      {
        name: 'TP. Hà Giang',
        wards: ['Phường Minh Khai', 'Phường Ngọc Hà', 'Phường Nguyễn Trãi', 'Phường Quang Trung', 'Phường Trần Phú']
      }
    ]
  },
  {
    name: 'Cao Bằng',
    districts: [
      {
        name: 'TP. Cao Bằng',
        wards: ['Phường Đề Thám', 'Phường Duyệt Trung', 'Phường Hòa Chung', 'Phường Hợp Giang', 'Phường Ngọc Xuân', 'Phường Sông Bằng', 'Phường Sông Hiến', 'Phường Tân Giang']
      }
    ]
  },
  {
    name: 'Bắc Kạn',
    districts: [
      {
        name: 'TP. Bắc Kạn',
        wards: ['Phường Đức Xuân', 'Phường Huyền Tụng', 'Phường Phùng Chí Kiên', 'Phường Nguyễn Thị Minh Khai', 'Phường Sông Cầu', 'Phường Xuất Hóa']
      }
    ]
  },
  {
    name: 'Lạng Sơn',
    districts: [
      {
        name: 'TP. Lạng Sơn',
        wards: ['Phường Chi Lăng', 'Phường Đông Kinh', 'Phường Hoàng Văn Thụ', 'Phường Tam Thanh', 'Phường Vĩnh Trại']
      }
    ]
  }
];

export const popularProvinces = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Bắc Ninh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Lâm Đồng',
  'Khánh Hòa'
];

export function normalizeVietnamese(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');
}

