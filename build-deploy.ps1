$serverDir = "d:\WorkFreelancer\TEM\server"
$outputZip = "d:\WorkFreelancer\TEM\server-c2-deploy.zip"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  TEM QR Code – Build Deploy Package for C2 Hosting" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Xóa zip cũ nếu tồn tại
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
    Write-Host "  Removed old: $outputZip" -ForegroundColor DarkGray
}

# Danh sách file/folder cần đóng gói
$include = @(
    "app.js",          # Entry point cho Phusion Passenger (cPanel)
    "server.js",       # Entry point cho PM2 / local dev
    "seed.js",         # Script seed dữ liệu ban đầu
    "package.json",    # Dependencies
    ".env",            # Environment variables (MONGO_URI, JWT_SECRET, ...)
    ".htaccess",       # Phusion Passenger config
    "ecosystem.config.json",  # PM2 config (dùng nếu server có PM2)
    "middleware",      # Auth, RBAC middleware
    "models",          # Mongoose models
    "routes",          # API routes
    "services",        # Business logic services
    "scripts",         # Auto backup & restore scripts
    "backups"          # Backup JSON files (không kèm full backup)
)

# Tạo thư mục tạm
$tempDir = "$env:TEMP\tem-server-deploy"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "  Copying files..." -ForegroundColor Yellow
Write-Host ""

foreach ($item in $include) {
    $src = Join-Path $serverDir $item
    $dst = Join-Path $tempDir $item

    if (Test-Path $src) {
        if ((Get-Item $src).PSIsContainer) {
            Copy-Item $src $dst -Recurse -Force
            Write-Host "  [DIR]  $item/" -ForegroundColor Green
        } else {
            Copy-Item $src $dst -Force
            Write-Host "  [FILE] $item" -ForegroundColor Green
        }
    } else {
        Write-Host "  [SKIP] $item (không tìm thấy)" -ForegroundColor Yellow
    }
}

# Bỏ qua database_backup_full.json (quá lớn để upload)
$bigBackup = "$tempDir\backups\database_backup_full.json"
if (Test-Path $bigBackup) {
    Remove-Item $bigBackup -Force
    Write-Host ""
    Write-Host "  [SKIP] backups/database_backup_full.json (quá lớn)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "  Compressing to ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath $outputZip -CompressionLevel Optimal

Remove-Item $tempDir -Recurse -Force

$zipSizeKB = [math]::Round((Get-Item $outputZip).Length / 1KB, 1)
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  DONE: $outputZip" -ForegroundColor Green
Write-Host "  Size: $zipSizeKB KB" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Bước tiếp theo:" -ForegroundColor Cyan
Write-Host "    1. Đăng nhập cPanel C2 Hosting" -ForegroundColor White
Write-Host "    2. File Manager → /home/giaiphapqrcode/nodeapp/ → Upload ZIP → Extract" -ForegroundColor White
Write-Host "    3. Setup Node.js App → startup file: app.js → Run NPM Install" -ForegroundColor White
Write-Host "    4. Add Environment Variables (MONGO_URI, JWT_SECRET, ...)" -ForegroundColor White
Write-Host "    5. Restart app → Kiểm tra: https://www.giaiphapqrcode.vn/api/health" -ForegroundColor White
Write-Host ""
Write-Host "  QUAN TRONG - MONGO_URI:" -ForegroundColor Red
Write-Host "    Vao MongoDB Atlas → Connect → Drivers → Node.js" -ForegroundColor White
Write-Host "    Copy SRV string: mongodb+srv://user:pass@cluster.mongodb.net/tem_db" -ForegroundColor White
Write-Host "    Cap nhat vao cPanel: Node.js App → Environment Variables → MONGO_URI" -ForegroundColor White
Write-Host ""
