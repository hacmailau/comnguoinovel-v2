# Cơm Nguội Novel cho VBook

Extension cá nhân dành cho VBook mới/beta. Tìm truyện, duyệt Chung/BL, xem chi tiết, tải toàn bộ mục lục, xem truyện mới cập nhật, đọc nhiều và hoàn thành.

**Trạng thái:** đã kiểm tra metadata, khám phá Chung/BL và đọc toàn văn trên engine iPhone. Sau khi người dùng đăng nhập trong trình duyệt VBook, chương 1 và 2 Kiếm Lai đọc thành công; hash toàn bộ HTML khớp với Playwright, gồm các đoạn canvas. Phiên đăng nhập trong Playwright hoặc Safari không tự chuyển sang browser của extension.

## Cài đặt cho người mới

1. Dùng VBook mới/beta có hỗ trợ hợp đồng extension trong repository này.
2. Khi đã có `plugin.zip`, chuyển file sang điện thoại. Trong màn hình quản lý tiện ích của VBook, dùng tùy chọn nhập/cài từ file nếu phiên bản của bạn hỗ trợ, rồi chọn ZIP. Tên menu có thể khác theo bản ứng dụng.
3. Hoặc bật server phát triển của VBook và cài trực tiếp bằng CLI ở phần dưới. Máy tính và điện thoại cần truy cập được nhau.
4. Trong cấu hình extension, chọn `CATEGORY`: `general` là Chung, `boylove` là BL. Mặc định là Chung.
5. Tìm “Kiếm Lai”, mở chi tiết và mục lục để kiểm tra cài đặt. Truyện đã lưu vẫn mở được khi đổi nhóm.
6. Để đọc chương, đăng nhập thủ công bằng trình duyệt trong ứng dụng VBook **nếu trình duyệt đó dùng chung phiên với `Engine.newBrowser()`**. Nếu ứng dụng không có trình duyệt hoặc không chia sẻ phiên, hiện chỉ đọc trực tiếp trên website được. Không có bước nhập token/mật khẩu trong extension.

## Kiểm thử, build và cài bằng máy tính

Chạy các lệnh từ thư mục gốc repository. Thay `http://IP:PORT` bằng URL server hiển thị trên điện thoại; không dùng URL website ở đây.

```sh
node .agents/skills/vbook-extensions/scripts/vbook.js connect --server http://IP:PORT
node comnguoinovel/tests/unit.cjs
node comnguoinovel/tests/cli-request.cjs
node comnguoinovel/tests/device.cjs http://IP:PORT
node comnguoinovel/tests/toc-device.cjs http://IP:PORT
node comnguoinovel/tests/toc-device.cjs http://IP:PORT dao-quy-di-tien 1083
node comnguoinovel/tests/chapter-device.cjs http://IP:PORT 2 76
node .agents/skills/vbook-extensions/scripts/vbook.js build comnguoinovel --server http://IP:PORT
node .agents/skills/vbook-extensions/scripts/vbook.js install comnguoinovel --server http://IP:PORT
```

Mỗi lệnh CLI xác nhận thiết bị bằng `/connect`. `code: 0` trong kết quả script mới là thành công; `code=200` của server không có nghĩa script đã thành công. Bộ kiểm tra `device.cjs` kiểm tra metadata/khám phá, không thay thế bước đọc chương và thao tác UI thực tế. `toc-device.cjs` so sánh cấu hình 100 và 1.000 chương/trang trong bản sao tạm, đo thời gian ngay trong engine (không gồm kết nối CLI), kiểm tra số request và đối chiếu toàn bộ mục lục; không thay cấu hình bản cài. Nếu website cập nhật số chương, truyền slug và số lượng hiện tại làm tham số. `chapter-device.cjs` chỉ xuất số đoạn và hash, không in toàn văn. Số đoạn chương có thể thay đổi khi website sửa nội dung.

## Cách xử lý dữ liệu

- Website: `https://comnguoinovel.com`; API: `https://api.comnguoinovel.com/api`; ảnh: `https://assets.comnguoinovel.com`.
- `DOMAIN` đổi host các đường dẫn website; không tự đổi host API hoặc ảnh. Chỉ thay khi biết mirror tương thích.
- Tìm kiếm chuẩn hóa dấu tiếng Việt và trả tối đa 100 kết quả, không có phân trang giả. Các danh sách có 20 truyện/trang; thể loại dùng slug.
- Bản 2 lấy mục lục mới từ website mỗi lần tải, tối đa 1.000 chương/trang và tải tiếp theo `totalPages`. Kiếm Lai có 557 chương nên chỉ cần một request. Nếu trang lỗi, dữ liệu trùng hoặc số lượng thay đổi trong lúc tải, báo lỗi thay vì trả mục lục thiếu; kết quả sắp theo `chapter_number` tăng dần.
- Tên mục lục dùng `Chương N: Tiêu đề`, với `N` từ `chapter_number`, cùng số dùng trong URL. Tiêu đề đã có tiền tố cùng số được giữ nguyên. Nếu số khác API, giữ tiêu đề gốc sau tiền tố: `Kinh Trập` → `Chương 2: Kinh Trập`; `Chương 557: …` giữ nguyên; `Chương 0 : Tự chương` → `Chương 1: Chương 0 : Tự chương` tại URL `/chuong/1`.
- Đọc chương cho website chạy luồng xác thực và xử lý nội dung bình thường, rồi đọc chuỗi nội dung trong React. Không gọi lại POST đọc chương bằng token sao chép, không giả lập quảng cáo hoặc giải challenge tự động.
- Có giới hạn chờ 30 giây và đóng browser sau mỗi lần đọc. Văn bản được escape thành HTML. Nếu không xác nhận được nguồn nội dung đầy đủ, trả lỗi kèm URL website; không dùng DOM thiếu đoạn, ảnh canvas hoặc OCR.
- Website có thể tự ghi lịch sử đọc và gửi sự kiện quảng cáo khi browser mở chương. Extension không triển khai API đồng bộ riêng.

## Khi gặp lỗi

| Thông báo | Cách xử lý |
|---|---|
| Cần đăng nhập | Đăng nhập thủ công trong browser VBook có dùng chung phiên; nếu không hỗ trợ, mở URL website để đọc. |
| Yêu cầu xác minh/giới hạn đọc | Hoàn tất thao tác trên website hoặc chờ; không thử liên tục. |
| Không lấy được toàn văn trong 30 giây | Kiểm tra mạng và phiên; cấu trúc React có thể đã đổi. |
| Mục lục thiếu/trùng/vừa thay đổi | Tải lại mục lục sau khi website cập nhật ổn định. |
| HTTP 429 | Chờ rồi thử lại. |
| Cấu trúc API đã thay đổi | Cần cập nhật mã extension, không thay dữ liệu thiếu bằng thành công. |

## Giới hạn và dữ liệu riêng tư

Không lưu mật khẩu, cookie hoặc token vào mã nguồn/ZIP. Icon 200×200 lấy từ website. API và cấu trúc React là phụ thuộc không chính thức, có thể thay đổi. Đã kiểm tra bộ lấy nội dung trên Playwright với chương 2 Kiếm Lai: 76 đoạn, 16 đoạn canvas; điều này không bảo đảm hoạt động trên mọi bản VBook hoặc mọi chương.

Xem [CHANGELOG.md](CHANGELOG.md) để biết thay đổi từng phiên bản và [VALIDATION.md](VALIDATION.md) để biết các kiểm tra thực tế và phần còn chờ xác nhận.
