# =============================================================================
# DEPLOY TO C4 CLOUD (45.119.214.68) - FULL SCRIPT
# =============================================================================
# 1. Build user/dist & admin/dist
# 2. Đóng gói server, user-assets, admin-assets
# 3. Upload qua SCP & khởi động lại PM2 trên C4 Cloud (45.119.214.68)
# =============================================================================

$ErrorActionPreference = "Stop"
$C4_HOST = if ($env:C4_SSH_HOST) { $env:C4_SSH_HOST } else { "45.119.214.68" }
$C4_USER = if ($env:C4_SSH_USER) { $env:C4_SSH_USER } else { "root" }
$C4_PASS = $env:C4_SSH_PASS
if (-not $C4_PASS) {
    Write-Error "Thiếu biến môi trường C4_SSH_PASS! Chạy: `$env:C4_SSH_PASS='...'; .\deploy_to_c4.ps1"
    exit 1
}

$RootDir = $PSScriptRoot
$TempDir = Join-Path $env:TEMP "tem-c4-deploy"

if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Tạo askpass helper cho OpenSSH Windows
$AskPassBat = Join-Path $TempDir "askpass.bat"
Set-Content -Path $AskPassBat -Value "@echo off`r`necho $C4_PASS" -Encoding ASCII
$env:SSH_ASKPASS = $AskPassBat
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "1"

Write-Host "=== 1. Building User & Admin Frontend ===" -ForegroundColor Cyan
Push-Location (Join-Path $RootDir "user")
npm run build
Pop-Location

Push-Location (Join-Path $RootDir "admin")
npm run build
Pop-Location

Write-Host "=== 2. Packaging Artifacts ===" -ForegroundColor Cyan
$SrvTmp = Join-Path $TempDir "srv_tmp"
New-Item -ItemType Directory -Path $SrvTmp | Out-Null
foreach ($item in @("app.js","server.js","seed.js","package.json",".env",".htaccess","ecosystem.config.json","middleware","models","routes","services","scripts")) {
    $src = Join-Path "$RootDir\server" $item
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $SrvTmp $item) -Recurse -Force
    }
}
Compress-Archive -Path "$SrvTmp\*" -DestinationPath "$TempDir\server-code.zip" -CompressionLevel Optimal
Compress-Archive -Path "$RootDir\user\dist\index.html", "$RootDir\user\dist\user-assets" -DestinationPath "$TempDir\user-assets.zip" -CompressionLevel Optimal
Compress-Archive -Path "$RootDir\admin\dist\index.html", "$RootDir\admin\dist\assets" -DestinationPath "$TempDir\admin-assets.zip" -CompressionLevel Optimal

Write-Host "=== 3. Uploading to C4 Cloud ($C4_HOST) ===" -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "$C4_USER@$C4_HOST" "mkdir -p /root/deploy_tmp /var/www/tem/server /var/www/tem/user/dist /var/www/tem/admin/dist"
scp -o StrictHostKeyChecking=no "$TempDir\server-code.zip" "$TempDir\user-assets.zip" "$TempDir\admin-assets.zip" "${C4_USER}@${C4_HOST}:/root/deploy_tmp/"

Write-Host "=== 4. Extracting & Reloading PM2 on C4 Cloud ===" -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no "$C4_USER@$C4_HOST" "unzip -o /root/deploy_tmp/server-code.zip -d /var/www/tem/server/ || [ `$? -le 2 ]; rm -rf /var/www/tem/user/dist/user-assets /var/www/tem/admin/dist/assets; unzip -o /root/deploy_tmp/user-assets.zip -d /var/www/tem/user/dist/ || [ `$? -le 2 ]; unzip -o /root/deploy_tmp/admin-assets.zip -d /var/www/tem/admin/dist/ || [ `$? -le 2 ]; cd /var/www/tem/server && npm install --production && pm2 reload tem-qr-server && pm2 save"

Write-Host "=== 5. Verifying Health Check ===" -ForegroundColor Green
$health = Invoke-RestMethod -Uri "http://$C4_HOST/api/health" -TimeoutSec 10
$health | ConvertTo-Json
Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "DEPLOY TO C4 CLOUD COMPLETED SUCCESSFULLY!" -ForegroundColor Green

