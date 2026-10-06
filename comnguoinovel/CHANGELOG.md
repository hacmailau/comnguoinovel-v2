# Lịch sử thay đổi

## Bản 2 — 06/10/2026

- Tăng kích thước trang mục lục từ 100 lên 1.000 chương. Truyện dài hơn tiếp tục tải theo `totalPages`; mỗi lần tải vẫn lấy dữ liệu mới từ website.
- Hiển thị `Chương N: Tiêu đề`, với số lấy từ `chapter_number` và khớp URL. Giữ tiền tố đã có cùng số; giữ tiêu đề gốc phía sau nếu số khác API. Ví dụ: `Kinh Trập` → `Chương 2: Kinh Trập`; `Chương 0 : Tự chương` → `Chương 1: Chương 0 : Tự chương`.
- Báo lỗi khi mục lục thiếu, trùng, thay đổi trong lúc tải hoặc một trang tải thất bại. Kết quả thành công luôn được sắp theo số chương tăng dần.
- Bổ sung kiểm thử phân trang 1.000 chương, các trường hợp tên chương và bộ đo số request/thời gian trên thiết bị.

Đo tuần tự trên cùng iPhone: Kiếm Lai đủ 557 chương, từ 4,63 giây / 6 request xuống 1,85 giây / 1 request. Đạo Quỷ Dị Tiên đủ 1.083 chương bằng 2 request. Thời gian phụ thuộc mạng; đây là kết quả của lần đo, không phải cam kết tốc độ.

Hash toàn văn chương 1–2 Kiếm Lai giữ nguyên. Bản 2 đã cài thành công lên iPhone. ZIP được đóng gói cục bộ sau khi phản hồi build từ server bị ngắt; CRC và toàn bộ manifest, icon, script đã được đối chiếu với source.

Xem [VALIDATION.md](VALIDATION.md) để biết số đo, hash và các kiểm tra còn chờ xác nhận; xem [README.md](README.md) để cài đặt và chạy kiểm thử.

## Bản 1 — bản thử nghiệm ban đầu

- Hỗ trợ tìm kiếm, khám phá và danh sách truyện Chung/BL, chi tiết truyện và mục lục đầy đủ với 100 chương/trang.
- Đọc toàn văn qua browser VBook dùng phiên đăng nhập thủ công; kiểm tra nguồn nội dung React để giữ các đoạn được hiển thị bằng canvas.
