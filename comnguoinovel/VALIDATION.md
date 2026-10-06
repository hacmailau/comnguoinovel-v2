# Kết quả kiểm tra — 06/10/2026

## Bản 2 — mục lục và số chương

- Mục lục lấy tối đa 1.000 chương/trang, luôn gọi API khi tải lại; giữ kiểm tra tổng số, phân trang ổn định, dữ liệu không trùng và thứ tự tăng dần.
- Tên chương lấy số từ `chapter_number`, cùng số dùng trong URL. Không thêm lại tiền tố cùng số; giữ tiêu đề gốc khi số khác API. Kiếm Lai: `Chương 1: Chương 0 : Tự chương`, `Chương 2: Kinh Trập`.
- Unit tests đã qua: 557 chương/một request; 1.002 chương/hai request, trang cuối hai chương, dữ liệu đảo thứ tự; biên 0/1.000 chương; lỗi HTTP giữa các trang, thiếu/trùng, thay đổi tổng số/trang, sai trang, số chương không hợp lệ; tên có/không có tiền tố và số khác API; URL, lock/pay giữ đúng; mỗi lần tải gọi API mới.
- `device.cjs` đã qua trên iPhone: chi tiết, đủ 557 chương, tên/số/URL đúng, tìm kiếm, danh sách, khám phá và cấu hình Chung/BL.
- `toc-device.cjs` đo trong engine bằng bản sao tạm với cấu hình 100 và 1.000 chương/trang. Chỉ đếm các request API mục lục, không gồm `/connect` hay gửi script. Hai cấu hình phải trả cùng toàn bộ danh sách.
- Đo tuần tự trên cùng iPhone: Kiếm Lai đủ 557 chương; cấu hình 100: **4.630 ms / 6 request**; cấu hình 1.000: **1.852 ms / 1 request**, giảm khoảng 60% thời gian trong lần đo này. Khảo sát trước đó khoảng 6 giây; tốc độ phụ thuộc mạng. Một lần chạy cùng bộ kiểm tra khác đo 21.076/4.145 ms, nên không coi số đo là cam kết tốc độ.
- Đọc lại chương 1 và 2 trên iPhone thành công: lần lượt 8/76 đoạn, 1.012/11.671 ký tự HTML. SHA-256 khớp hai hash toàn văn bản 1 ghi bên dưới; đổi tên mục lục không ảnh hưởng nội dung chương.
- Khi thử trả cả mục lục 1.083 chương, server ngắt phản hồi HTTP trước `Content-Length`; CLI báo lỗi đúng. Bộ đo hiện kiểm tra tên/thứ tự trong engine và chỉ trả tổng số, chương đầu/cuối cùng hash SHA-256 toàn bộ danh sách để đối chiếu hai cấu hình, tránh gửi danh sách dài qua server phát triển.
- Đạo Quỷ Dị Tiên trên cùng iPhone: đủ **1.083 chương**; cấu hình 100: 28.399 ms / 11 request; cấu hình 1.000: 5.493 ms / 2 request. Chương cuối `/chuong/1083`, tên đúng số, thứ tự tăng dần; SHA-256 toàn bộ danh sách khớp hai cấu hình.
- Build qua CLI iPhone bị ngắt phản hồi HTTP 200: nhận 131.693/131.754 byte; sau đó `/connect` trả `ECONNREFUSED`. Đã tạo ZIP cục bộ theo cấu trúc bản 1: **98.621 byte**, manifest phiên bản 2, icon 200×200, 10 script. CRC đã qua; cả 12 file khớp source từng byte. SHA-256 ZIP: `86d1d1e79d5b01d88e7dc6b096a0f42181655c3c44d1eb78835fe53b8387b082`.
- Sau khi người dùng mở lại server, CLI `/connect` xác nhận iPhone; cài bản 2 bằng `install comnguoinovel --server http://IP:PORT` thành công, trả `code=200`, có icon. CLI gửi manifest/source trực tiếp; ZIP cục bộ đã đối chiếu với cùng source.

## Đã xác nhận

Các kết quả dưới đây là kiểm tra ban đầu của bản 1; kiểm tra bản 2 được ghi riêng phía trên.

- CLI `/connect` xác nhận thiết bị iPhone do người dùng cung cấp.
- `detail.js`: Kiếm Lai, tác giả Phong Hỏa Hí Chư Hầu, ảnh assets, trạng thái và 557 chương.
- `toc.js`: đủ 557 chương, không trùng, tăng dần; URL chương 1 giữ đúng dù tiêu đề là “Chương 0 : Tự chương”.
- `search.js`: “Kiếm Lai” có kết quả, truy vấn không tồn tại trả mảng rỗng, next token rỗng.
- `home.js`: 3 mục. `genre.js`: 15 thể loại Chung ở thời điểm kiểm tra.
- `listing.js`: mới cập nhật trang 1/2 không trùng; đọc nhiều, hoàn thành và Tiên Hiệp đều có kết quả; next token dạng chuỗi.
- `explore.js`: 3 phần, mỗi phần có dữ liệu và liên kết xem thêm.
- Cấu hình BL thử trên engine iPhone: 69 thể loại; danh sách trang 1/2 không trùng; lọc `bl-han-quoc` và tìm một truyện BL thực tế đều thành công. Manifest mặc định vẫn là Chung.
- Unit tests: lỗi HTTP/JSON, chuẩn hóa URL/dấu, bộ lọc BL, phân trang, lỗi trang giữa mục lục, trùng chương, canvas, sai chương, thiếu phiên và đóng browser.
- Bộ lấy nội dung thực tế `reader.js` chạy trong Playwright đã đăng nhập: chương 2 Kiếm Lai trả `ready`, 11.214 ký tự, 76 đoạn, gồm phần canvas.
- iPhone trả `callJs` bọc trong HTML. Đã xử lý dạng này bằng jsoup và escape ký tự HTML trong JSON.
- `chap.js` trên iPhone chưa đăng nhập trả `code: 1`, thông báo cần đăng nhập và URL website; không trả chương thiếu.
- Sau khi người dùng đăng nhập thủ công trong trình duyệt VBook, `chap.js` trên iPhone đọc thành công chương 2 rồi chương 1 bằng hai browser mới, xác nhận phiên được dùng chung và giữ qua lần đọc trong thử nghiệm.
- HTML chương 1: 8 đoạn, 1.012 ký tự, SHA-256 `ff67b945edc087ce97653da1bcced4e30b06f245af735535ee3df92282462b6d`.
- HTML chương 2: 76 đoạn, 11.671 ký tự, SHA-256 `3ce8cced5a1aa28d045f99b23cef3ca94135d25915dc50dd0df0b206de5cca32`.
- Cả hai hash trên iPhone đều khớp với cùng bộ lấy nội dung chạy trên Playwright đã đăng nhập, gồm phần canvas.
- Build qua CLI VBook thành công: `plugin.zip` 98.688 byte, chứa manifest, icon 200×200 và 10 script. Đã kiểm tra CRC và đối chiếu từng file trong ZIP với source.
- Cài qua CLI trên iPhone thành công, server trả `code: 200`; icon được gửi kèm.
- CLI có thêm timeout 90 giây và báo lỗi khi phản hồi bị ngắt; trước đó phản hồi build bị ngắt vẫn khiến tiến trình kết thúc với mã 0. PNG đã nén không mất pixel và bỏ EXIF/kích thước vật lý để build hoàn tất qua server iPhone. Giữ các chunk màu.

## Còn cần xác nhận

- Chờ phiên hết hạn thực tế rồi xác nhận thông báo và đăng nhập lại. Trường hợp chưa đăng nhập đã được kiểm tra.
- Kiểm tra UI trên điện thoại sau khi cài: ảnh bìa, nhóm Chung/BL, khám phá, mục lục và toàn văn.
- Chưa xác nhận Android. Không có cam kết đọc được mọi truyện/chương.

Build/cài đặt không thay thế các kiểm tra còn chờ này. Không đưa token/cookie hay nội dung chương vào log kiểm thử lưu trữ.
