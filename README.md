# 🀄 TOCFL X 漢字記憶 — Chinese Learning Hub

Ứng dụng web học và tra cứu từ vựng tiếng Trung chuẩn **TOCFL Band A (A1 & A2)** và **Giáo trình Đương đại (當代中文課程 Book 2 & Book 3)**, tập trung vào phương pháp **chiết tự chữ Hán (Etymology)**, câu chuyện tượng hình, âm Hán Việt và các chế độ luyện tập tương tác.

Hỗ trợ chạy hoàn toàn tĩnh (**Static Web / GitHub Pages**) không cần backend phức tạp.

---

## 🌟 Tính năng nổi bật

- **🀄 Kho từ vựng phong phú (1.620+ từ vựng)**:
  - **Giáo trình Đương đại 3 (當代 3)**: Toàn bộ 12 bài học với 776 từ vựng được biên soạn chi tiết.
  - **Giáo trình Đương đại 2 (當代 2)**: Các bài học trọng tâm.
  - **TOCFL A1**: 12 chủ đề từ vựng cốt lõi.
  - **Đề thi mẫu (Mock Tests)**: Band A Mock Test 1 & 2.
- **📐 Chiết tự & Phân tích chữ Hán chuyên sâu**:
  - Tách bộ thủ và cấu tạo từng chữ (Structure).
  - Câu chuyện nguồn gốc tượng hình/hội ý sinh động (Story).
  - Câu khẩu quyết ghi nhớ nhanh (Mnemonic).
  - Âm Hán-Việt chuẩn xác và câu ví dụ ngữ cảnh thực tế kèm Pinyin.
- **🔊 Phát âm chuẩn (Audio TTS)**:
  - Tích hợp công nghệ Web Speech API phát âm tiếng Trung phồn thể (`zh-TW`) tốc độ chuẩn cho người học.
- **🃏 Các chế độ học tập đa dạng**:
  - 📖 **Học tập (Study Grid)**: Lướt và tra cứu thẻ từ vựng với bộ lọc theo trạng thái (Tất cả / Đã thuộc / Chưa thuộc).
  - 🎴 **Flashcard**: Thẻ lật từ vựng 3D, đánh dấu tiến độ ghi nhớ.
  - 🧩 **Luyện tập ghép cặp (Memory Match)**: Trò chơi tìm cặp từ Hán - Nghĩa tiếng Việt giúp tăng phản xạ.
  - 📝 **Trắc nghiệm (Quiz)**: Kiểm tra nhận diện mặt chữ và nghĩa với điểm số chi tiết.
- **🤖 Nhập liệu thông minh bằng Gemini AI**:
  - Nhập danh sách từ thô -> Gemini AI tự động phân tích chiết tự, tạo câu chuyện và câu ví dụ theo đúng format chuẩn.
  - Hỗ trợ lưu trực tiếp vào file dữ liệu (Local Server) hoặc sao chép/tải file JSON (GitHub Pages).
- **🎨 Giao diện Zen hiện đại (Hỗ trợ 2 chế độ màu sắc)**:
  - 🍵 **Sáng (Bích Trà & Vân Khói)**: Tone xanh ngọc bích, nền giấy trà thanh tao, bảo vệ mắt.
  - 🌙 **Tối (Huyền Mặc & Lam Tử)**: Tone than chì & chàm công nghệ cao, dịu mắt khi học đêm.

---

## 🚀 Hướng dẫn cài đặt & Chạy ứng dụng

### Cách 1: Chạy trực tiếp (Static Web — Không cần cài đặt)
Do toàn bộ giao diện và dữ liệu được đóng gói tối ưu, bạn chỉ cần:
1. Tải hoặc clone mã nguồn về máy.
2. Nhấp đúp vào file `index.html` để mở trên bất kỳ trình duyệt hiện đại nào (Chrome, Edge, Safari, Firefox).
*(Hoặc dùng tiện ích **Live Server** trong VS Code).*

---

### Cách 2: Chạy với Local Dev Server (Node.js)
Dùng khi bạn muốn sử dụng tính năng **AI Thêm bài** để tự động lưu từ vựng mới thẳng vào `data.js`:

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy server
npm start
```
Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 🌐 Hướng dẫn Host trên GitHub Pages (Miễn phí 100%)

Trang web được thiết kế chuẩn static web, cực kỳ tương thích với **GitHub Pages**:

1. Đưa mã nguồn lên repository GitHub của bạn:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial release TOCFL X Chinese Learning Hub"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```
2. Trên trang repository tại GitHub:
   - Vào tab **Settings** -> Mục **Pages** (ở thanh bên trái).
   - Tại phần **Build and deployment** -> **Source**: Chọn **Deploy from a branch**.
   - Tại **Branch**: Chọn `main` và thư mục `/ (root)`, sau đó nhấn **Save**.
3. Sau khoảng 1-2 phút, trang web của bạn sẽ hoạt động tại địa chỉ:
   `https://<username>.github.io/<repo-name>/`

---

## 📂 Cấu trúc thư mục chuẩn hóa

```
├── index.html              # Giao diện chính SPA của ứng dụng (GitHub Pages root)
├── manifest.json           # Web App Manifest & cài đặt PWA mobile
├── favicon.svg             # Biểu tượng vector mặc định tại root
├── server.js               # Node.js server phục vụ ghi dữ liệu cục bộ
├── package.json            # Cấu hình dự án và scripts (npm start, npm run validate)
│
├── assets/                 # Tài nguyên hình ảnh, biểu tượng
│   └── icons/              # Toàn bộ icon, favicon, touch-icon, PWA icons
│
├── css/
│   └── style.css           # Hệ thống thiết kế (Design System) Modern Zen & Dark Mode
│
├── js/
│   ├── app.js              # Logic điều khiển, flashcard, quiz, game ghép cặp, swipe mobile
│   ├── data.js             # Cơ sở dữ liệu 1.620+ từ vựng chiết tự & ví dụ
│   └── ai-import.js        # Module tích hợp Gemini AI phân tích từ vựng mới
│
├── data/                   # Tài liệu học tập và cơ sở dữ liệu có cấu trúc
│   ├── lessons/            # Toàn bộ bài học Markdown theo giáo trình
│   │   ├── book2/          # Giáo trình Đương đại 2 (Bài 1 - 15)
│   │   └── book3/          # Giáo trình Đương đại 3 (Bài 1 - 12)
│   ├── a1-vocab/           # Từ vựng TOCFL A1 phân loại theo chủ đề
│   ├── mock-tests/         # Đề thi thử & tài liệu giải thích Band A
│   └── crawled/            # Dữ liệu từ vựng thô tham khảo (JSON)
│
├── docs/                   # Tài liệu hướng dẫn & Prompt engineering
│   └── prompts/            # Prompt mẫu phân tích chiết tự và từ nguyên học
│
└── scripts/                # Các script tiện ích bảo trì & đồng bộ dữ liệu
    ├── cleanup_a1.js
    ├── cleanup_a1_fix.js
    ├── fix_mt2.js
    ├── sync_l15_new.js
    └── sync_mt2.js
```


---

## 📄 Bản quyền (License)

Phát hành dưới giấy phép [MIT License](LICENSE).
