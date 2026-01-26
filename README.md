# 🚀 YT & Bilibili Downloader Ultimate

Chrome Extension + Local Server tải video YouTube 4K/8K & Bilibili chất lượng cao, hoàn toàn miễn phí!

## 🌟 Tính năng chính

- **YouTube**: Tải video chất lượng cao nhất (lên đến 8K), audio MP3, playlist, channel
- **Bilibili**: Hỗ trợ tải video Bilibili 1080P/4K không cần đăng nhập
- **Giao diện SidePanel**: Tích hợp trực tiếp vào Chrome, dễ sử dụng
- **Nút tải nhanh**: Thêm nút "⬇️ HD" ngay trên player YouTube
- **Hàng loạt tính năng**: Tải hàng loạt, cắt video, lưu thumbnail, chọn chất lượng
- **Server local**: Chạy trên máy tính cá nhân, không giới hạn tốc độ

## 📦 Cài đặt

### Phần 1: Cài đặt Server (Bắt buộc)

**Tùy chọn A: Dùng bộ cài đặt có sẵn (Recommended)**
1. Tải file `CaiDat_YT_Bili_V9.8.0.exe` từ [Releases](https://github.com/your-repo/releases)
2. Chạy file cài đặt và làm theo hướng dẫn
3. Server sẽ tự động chạy khi khởi động Windows

**Tùy chọn B: Chạy từ mã nguồn Python**
```bash
# 1. Cài đặt Python 3.8+
# 2. Cài đặt thư viện
pip install flask flask-cors yt-dlp pystray pillow

# 3. Tải ffmpeg.exe và BBDown.exe đặt cùng thư mục với server.py
# 4. Chạy server
python server.py
```

### Phần 2: Cài đặt Chrome Extension

1. Tải toàn bộ mã nguồn extension (thư mục `yt-downloader-extension`)
2. Mở Chrome, vào `chrome://extensions/`
3. Bật **Chế độ nhà phát triển** (Developer mode)
4. Click **Tải tiện ích đã giải nén** (Load unpacked)
5. Chọn thư mục chứa extension

## 🔧 Cấu hình đường dẫn (Nếu cần thay đổi)

### 1. Thay đổi đường dẫn trong file setup

Mở file `setup_script.iss` và chỉnh sửa các đường dẫn:

```innosetup
[Files]
; Thay đổi đường dẫn source cho phù hợp với máy bạn
Source: "D:\TOOL\AutoImageFX\LAM_FILE_SETUP\dist\YT_Pro_Server.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\TOOL\AutoImageFX\LAM_FILE_SETUP\ffmpeg.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "D:\TOOL\AutoImageFX\LAM_FILE_SETUP\BBDown.exe"; DestDir: "{app}"; Flags: ignoreversion
```

Thay `D:\TOOL\AutoImageFX\LAM_FILE_SETUP` bằng đường dẫn thực tế trên máy bạn.

### 2. Thay đổi đường dẫn trong build script

Mở file `build.bat` và cập nhật:

```batch
cd /d "D:\TOOL\AutoImageFX\LAM_FILE_SETUP"
```

Và đường dẫn Inno Setup:

```batch
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "setup_script.iss"
```

### 3. Cấu hình Server URL trong extension

Mở file `background.js` và `sidepanel.js`:

```javascript
const SERVER_URL = 'http://127.0.0.1:5000';
```

Nếu bạn thay đổi port server, hãy cập nhật ở đây.

## 📖 Hướng dẫn sử dụng

### Bước 1: Khởi động Server
- Chạy file `YT_Pro_Server.exe` (sẽ chạy ẩn ở system tray)
- Icon màu xanh Bilibili xuất hiện là server đang hoạt động

### Bước 2: Sử dụng Extension
1. **Mở SidePanel**: Click vào icon extension trên Chrome toolbar
2. **Tab YouTube**: Tự động lấy thông tin video hiện tại
3. **Tab Queue**: Tải nhiều video cùng lúc (mỗi dòng 1 link)
4. **Tab Playlist**: Tải toàn bộ playlist/channel
5. **Tab Bilibili**: Dán link Bilibili để tải

### Bước 3: Tùy chọn tải
- **Định dạng**: Video+Audio, Chỉ Audio (MP3), Chỉ Video
- **Chất lượng**: Max (4K/8K), 1080p, 720p
- **Tùy chọn khác**: Lưu thumbnail, cắt video, chọn thư mục lưu

### Nút tải nhanh trên YouTube
Khi xem video YouTube, nút "⬇️ HD" sẽ xuất hiện bên cạnh player. Click để tải nhanh ở chất lượng cao nhất.

## 🗂️ Cấu trúc dự án

```
├── server.py              # Server chính (Python)
├── ffmpeg.exe            # Xử lý video/audio
├── BBDown.exe           # Core tải Bilibili
├── yt-downloader-extension/
│   ├── manifest.json    # Cấu hình extension
│   ├── background.js    # Background script
│   ├── content.js       # Inject nút vào YouTube
│   ├── sidepanel.html   # Giao diện chính
│   ├── sidepanel.js     # Logic sidepanel
│   └── icon.png         # Icon extension
├── build.bat            # Script build Windows
└── setup_script.iss     # Script tạo installer
```

## ⚠️ Lưu ý quan trọng

1. **Server phải luôn chạy** khi sử dụng extension
2. **Chrome Extension** cần quyền truy cập vào các trang YouTube/Bilibili
3. **Bilibili**: Một số video yêu cầu đăng nhập để tải chất lượng cao
4. **YouTube**: Tuân thủ điều khoản sử dụng, chỉ tải video cho mục đích cá nhân
5. **Windows Defender/Firewall**: Có thể chặn server, cần thêm exception

## 🔧 Xử lý sự cố

### Server không kết nối
- Kiểm tra Windows Firewall đang chặn port 5000
- Đảm bảo `YT_Pro_Server.exe` đang chạy (kiểm tra system tray)
- Thử truy cập `http://127.0.0.1:5000` trên trình duyệt

### Extension không hoạt động
- Kiểm tra extension đã bật trong `chrome://extensions/`
- Reload lại trang YouTube/Bilibili
- Thử tải lại extension (Load unpacked)

### Lỗi tải Bilibili
- Đảm bảo `BBDown.exe` tồn tại trong cùng thư mục với server
- Kiểm tra link Bilibili có đúng định dạng không
- Thử dùng link video dạng `BV...`

## 📄 Giấy phép

Dự án này chỉ dành cho mục đích giáo dục và sử dụng cá nhân. Tuân thủ điều khoản sử dụng của YouTube và Bilibili.

## 🤝 Đóng góp

Mọi đóng góp, báo lỗi, đề xuất tính năng đều được chào đón!

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📞 Hỗ trợ

- **Báo lỗi**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email**: vankhai1234.4321@gmail.com
- **Nhóm hỗ trợ**: Telegram: @VanKhai_AI

---

**⚠️ CẢNH BÁO**: Chỉ sử dụng công cụ này để tải nội dung bạn có quyền tải. Tác giả không chịu trách nhiệm cho việc sử dụng sai mục đích.

**Version**: 9.8.0 | **Cập nhật**: 2025 | **Tác giả**: Van Khai AI
