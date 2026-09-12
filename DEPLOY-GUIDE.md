# Hướng dẫn Setup GitHub Actions Deploy

## 🔑 Cần cấu hình GitHub Secrets

Vào: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

### Secrets bắt buộc:

| Secret Name | Giá trị | Mô tả |
|-------------|---------|-------|
| `FTP_HOST` | `giaiphapqrcode.com` | FTP hostname (cPanel) |
| `FTP_USER` | `giaiphapqrcode` | FTP username |
| `FTP_PASS` | `***` | Mật khẩu cPanel |
| `SSH_HOST` | IP hoặc hostname server | SSH host (lấy từ cPanel) |
| `SSH_USER` | `giaiphapqrcode` | SSH username |
| `SSH_PASS` | `***` | Mật khẩu SSH |
| `SSH_PORT` | `22` hoặc port khác | SSH port (mặc định 22) |
| `VITE_API_URL` | `https://www.giaiphapqrcode.com/api` | API URL cho frontend |

### Optional Secrets:
| Secret Name | Giá trị |
|-------------|---------|
| `SSH_PORT` | Port SSH của C2 (thường là 22) |

---

## 🚀 Cách hoạt động

```
git push origin main
        ↓
GitHub Actions tự động chạy:
  1. Build user/dist (React)
  2. Build admin/dist (React)
  3. FTP upload user/dist  → public_html/
  4. FTP upload admin/dist → public_html/admin-panel/
  5. SCP upload server ZIP → server qua SSH
  6. SSH: unzip + npm install + restart Node.js app
  7. Health check
```

---

## 📋 Cách lấy thông tin SSH từ cPanel C2

1. Đăng nhập cPanel → **SSH Access**
2. Bật SSH access nếu chưa có
3. Hostname: thường là IP server (lấy ở **Server Information**)
4. Port: 22 (hoặc custom port)

---

## 🔧 Lần đầu setup (chỉ cần làm 1 lần)

Nếu server chưa có thư mục nodeapp:
```bash
# SSH vào server và tạo cấu trúc
mkdir -p /home/giaiphapqrcode/nodeapp/tmp
```

Sau đó upload `.env` thủ công 1 lần qua cPanel File Manager:
```
/home/giaiphapqrcode/nodeapp/.env
```

---

## ⚡ Deploy thủ công ngay (FTP)

Nếu chưa setup GitHub Actions, chạy lệnh này:
```powershell
# Windows PowerShell
$env:C2_FTP_PASS = "matkhau_cpanel"
node deploy_to_c2_full.js
```
