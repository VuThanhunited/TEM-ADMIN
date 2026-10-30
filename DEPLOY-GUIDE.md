# Hướng dẫn Deploy lên Máy Chủ C4 Cloud (`45.119.214.68`)

## 🖥️ Thông tin Máy Chủ C4 Cloud

| Thành phần | Giá trị |
|------------|---------|
| **IP Server** | `45.119.214.68` |
| **SSH User** | `root` |
| **SSH Port** | `22` |
| **Hệ điều hành** | Ubuntu 22.04.5 LTS (8GB RAM, 97GB SSD) |
| **Web Server** | Nginx (Port 80 & 443) |
| **Process Manager** | PM2 (`tem-qr-server` chạy trên port `5000`) |
| **Thư mục gốc** | `/var/www/tem` (`user/dist`, `admin/dist`, `server`) |

---

## 🔑 Cấu hình GitHub Secrets (Tự động Deploy khi `git push`)

Vào: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Giá trị | Mô tả |
|-------------|---------|-------|
| `SSH_HOST` | `45.119.214.68` | IP máy chủ C4 Cloud |
| `SSH_USER` | `root` | Tài khoản SSH |
| `SSH_PASS` | `***` | Mật khẩu SSH C4 Cloud |
| `SSH_PORT` | `22` | Cổng SSH mặc định |

---

## ⚡ Deploy trực tiếp từ máy local (Windows PowerShell)

Chạy script tự động build và đẩy code lên C4 Cloud:
```powershell
powershell -ExecutionPolicy Bypass -File .\deploy_to_c4.ps1
```

---

## 🌐 Cấu hình DNS Domain trỏ về C4 Cloud

Khi chuyển DNS tên miền `giaiphapqrcode.vn` (hoặc `giaiphapqrcode.com`) về C4 Cloud:
1. Tạo bản ghi **A** cho `@` trỏ về `45.119.214.68`
2. Tạo bản ghi **A** (hoặc **CNAME**) cho `www` trỏ về `45.119.214.68`
3. Sau khi DNS cập nhật, chạy lệnh sau trên server để cấp chứng chỉ SSL Let's Encrypt miễn phí:
   ```bash
   certbot --nginx -d giaiphapqrcode.vn -d www.giaiphapqrcode.vn --non-interactive --agree-tos -m admin@giaiphapqrcode.vn
   ```

---

## 🛠️ Các lệnh quản trị nhanh trên C4 Cloud

```bash
# Kiểm tra trạng thái Node.js server
pm2 status
pm2 logs tem-qr-server --lines 50

# Khởi động lại Node.js server
pm2 restart tem-qr-server

# Kiểm tra & tải lại Nginx
nginx -t && systemctl reload nginx

# Kiểm tra Health Check API
curl http://45.119.214.68/api/health
```
