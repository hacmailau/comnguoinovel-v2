# Cơm Nguội Novel cho VBook

Extension bản 2 cho VBook mới/beta: tìm kiếm, khám phá Chung/BL, chi tiết truyện, mục lục đầy đủ và đọc chương qua browser VBook.

## Cài đặt

Trong phần quản lý tiện ích của VBook, thêm nguồn bằng URL sau (tên menu tùy phiên bản ứng dụng):

```text
https://raw.githubusercontent.com/hacmailau/comnguoinovel-v2/main/plugin.json
```

Chọn **Cơm Nguội Novel** và cài đặt. Hoặc [tải plugin.zip](https://raw.githubusercontent.com/hacmailau/comnguoinovel-v2/main/comnguoinovel/plugin.zip) rồi nhập từ file nếu ứng dụng hỗ trợ.

Mặc định nhóm truyện là Chung (`general`); chọn `boylove` trong cấu hình để duyệt BL. Để đọc chương, đăng nhập thủ công trong browser VBook dùng chung phiên với `Engine.newBrowser()`. Phiên Safari hoặc Playwright không tự chuyển sang VBook.

## Kiểm thử và phát triển

Cần Node.js; chạy từ gốc repo:

```sh
node comnguoinovel/tests/unit.cjs
node comnguoinovel/tests/cli-request.cjs
```

Để kiểm thử, build hoặc cài trực tiếp qua điện thoại, bật server phát triển VBook rồi dùng URL server hiển thị trên thiết bị:

```sh
node .agents/skills/vbook-extensions/scripts/vbook.js connect --server http://IP:PORT
node comnguoinovel/tests/device.cjs http://IP:PORT
node comnguoinovel/tests/chapter-device.cjs http://IP:PORT 2 76
node .agents/skills/vbook-extensions/scripts/vbook.js build comnguoinovel --server http://IP:PORT
node .agents/skills/vbook-extensions/scripts/vbook.js install comnguoinovel --server http://IP:PORT
```

Không commit cấu hình server cá nhân, cookie, token hoặc mật khẩu. Khi thay manifest/source/icon, build và kiểm tra lại ZIP; đồng bộ phiên bản trong danh mục gốc trước khi push.

## Trạng thái và tài liệu

Bản 2 đã kiểm tra trên engine iPhone: metadata, Chung/BL, mục lục và toàn văn chương 1–2 Kiếm Lai. Android, phiên hết hạn thực tế và cài từ nguồn GitHub chưa được xác nhận. Tốc độ và khả năng đọc phụ thuộc website, mạng và phiên ứng dụng.

- [Hướng dẫn chi tiết](comnguoinovel/README.md)
- [Lịch sử thay đổi](comnguoinovel/CHANGELOG.md)
- [Kết quả kiểm tra và giới hạn](comnguoinovel/VALIDATION.md)

CLI và định dạng nguồn cài được giữ từ workspace vBook hiện có; mã extension nằm trong `comnguoinovel/src/`. Icon lấy từ website Cơm Nguội Novel.
