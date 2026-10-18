# 🎬 Chill Automation Studio 3.0 — Hệ Thống Dựng Video AI Đa Năng (2D & 3D)

Hệ thống tự động dựng video đa thể loại (Hướng dẫn cài đặt, Chia sẻ kiến thức, Kể chuyện, Quảng cáo 2D & Hoạt hình nhân vật 3D) từ A đến Z bằng Tiếng Việt với **30 Repo công nghệ** và **21 Agent Skills** tích hợp sẵn.

---

## 🚀 Cách kéo về & chạy trên máy tính mới (1-Click)

### Bước 1: Tải dự án về máy mới
```bash
git clone https://github.com/PrimiasArt/Chill-automation.git
cd Chill-automation
```

### Bước 2: Cài đặt & Mở Bàn Làm Việc
- **Trên Windows:** Nháy đúp vào file **`Cai-Dat-Tren-May-Moi.bat`** (tự động cài đặt toàn bộ thư viện và mở giao diện Web).
- **Hoặc chạy bằng dòng lệnh (Windows / macOS / Linux):**
  ```bash
  npm install --legacy-peer-deps
  npm run chill
  ```
- Mở trình duyệt tại: **`http://localhost:4000`**

---

## ✨ Tính năng nổi bật
1. **Khung nhập Prompt AI Tiếng Việt trực tiếp trên giao diện (`http://localhost:4000`):**
   - Nhập ý tưởng bất kỳ (VD: *"làm 1 clip hướng dẫn cài đặt agent từ github, dễ, trực quan, hình ảnh hoạt hình 2d động, nhạc nền nhẹ, vui tai, ~60s"*).
   - Tự động chia kịch bản thành **các phân cảnh 2D động** (`Flowchart`, `Terminal`, `Thanh tiến trình %`, `Checklist`, `Thẻ ghi nhớ 2D`).
2. **Thời lượng linh hoạt (`5 giây` $\rightarrow$ `600 giây` / `10 phút`):**
   - Tự động đo độ dài giọng đọc AI (`msedge-tts` — Nữ `Hoài My` / Nam `Nam Minh`) bằng `ffprobe` để video luôn khớp trọn vẹn lời thuyết minh.
3. **Nhạc nền & Hiệu ứng âm thanh tự động:**
   - Nhạc nền `Lo-Fi Chill` nhẹ nhàng vui tai (`public/chill-bgm.mp3`) và nhạc điện tử sôi động (`public/mecha-cat-beat.mp3`), tự động giảm âm lượng khi có giọng nói.
4. **Hỗ trợ truy cập qua mạng LAN:**
   - Mở trực tiếp đường dẫn `http://<IP-Máy-Chủ>:4000` trên điện thoại hoặc máy tính khác cùng Wi-Fi mà không cần cài đặt lại.
