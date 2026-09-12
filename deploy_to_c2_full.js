/**
 * DEPLOY TO C2 HOSTING - FULL SCRIPT
 * =====================================================
 * 1. Upload user/dist    → public_html/           (trang quét QR)
 * 2. Upload admin/dist   → public_html/admin-panel/ (trang quản trị)
 * 3. Tạo server ZIP      → server-c2-deploy.zip   (upload thủ công qua cPanel Node.js)
 *
 * Cách dùng:
 *   $env:C2_FTP_PASS="matkhau_cpanel"
 *   node deploy_to_c2_full.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── CẤU HÌNH FTP ─────────────────────────────────────────────────────────────
const FTP_CONFIG = {
  host:     process.env.C2_FTP_HOST || 'giaiphapqrcode.com',
  user:     process.env.C2_FTP_USER || 'giaiphapqrcode',
  password: process.env.C2_FTP_PASS || '',
  port:     21,
  secure:   false,
};

const ROOT       = __dirname;
const USER_DIST  = path.join(ROOT, 'user',  'dist');
const ADMIN_DIST = path.join(ROOT, 'admin', 'dist');
const SERVER_DIR = path.join(ROOT, 'server');
const SERVER_ZIP = path.join(ROOT, 'server-c2-deploy.zip');

const REMOTE_USER_ROOT  = '/public_html/';
const REMOTE_ADMIN_ROOT = '/public_html/admin-panel/';

function countFiles(dir) {
  let count = 0;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) count += countFiles(full);
    else count++;
  }
  return count;
}

function log(msg, color = 'reset') {
  const colors = { cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', gray: '\x1b[90m', reset: '\x1b[0m' };
  console.log((colors[color] || '') + msg + colors.reset);
}

async function buildServerZip() {
  log('\n📦 Tạo server ZIP...', 'yellow');
  const { execSync } = require('child_process');
  try {
    execSync('powershell -File build-deploy.ps1', { cwd: ROOT, stdio: 'inherit' });
    log('   ✅ Server ZIP: ' + SERVER_ZIP, 'green');
  } catch (e) {
    log('   ⚠️  Build ZIP lỗi (bỏ qua): ' + e.message, 'yellow');
  }
}

async function ftpUpload(ftp, localDir, remoteDir, label) {
  log('\n🚀 Upload ' + label + '...', 'cyan');
  log('   Local:  ' + localDir, 'gray');
  log('   Remote: ftp://' + FTP_CONFIG.host + remoteDir, 'gray');
  const total = countFiles(localDir);
  log('   Files:  ' + total, 'gray');
  const start = Date.now();
  await ftp.ensureDir(remoteDir);
  await ftp.uploadFromDir(localDir, remoteDir);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log('   ✅ Xong! (' + elapsed + 's, ' + total + ' files)', 'green');
}

async function main() {
  log('\n╔══════════════════════════════════════════════╗', 'cyan');
  log('║   TEM QR – Deploy to C2 Hosting via FTP     ║', 'cyan');
  log('╚══════════════════════════════════════════════╝', 'cyan');

  if (!FTP_CONFIG.password) {
    log('\n❌ Thiếu FTP password!', 'red');
    log('   Chạy: $env:C2_FTP_PASS="matkhau"; node deploy_to_c2_full.js', 'yellow');
    process.exit(1);
  }

  for (const [label, dir] of [['user/dist', USER_DIST], ['admin/dist', ADMIN_DIST]]) {
    if (!fs.existsSync(dir)) {
      log('\n❌ Không tìm thấy ' + label + '! Chạy npm run build trước.', 'red');
      process.exit(1);
    }
  }

  await buildServerZip();

  const { Client } = require('basic-ftp');
  const ftp = new Client();
  ftp.ftp.verbose = false;

  try {
    log('\n🔌 Kết nối FTP: ' + FTP_CONFIG.host + '...', 'yellow');
    await ftp.access(FTP_CONFIG);
    log('   ✅ Kết nối thành công!', 'green');

    await ftpUpload(ftp, USER_DIST,  REMOTE_USER_ROOT,  'User App (trang quét QR)');
    await ftpUpload(ftp, ADMIN_DIST, REMOTE_ADMIN_ROOT, 'Admin App (trang quản trị)');

    log('\n╔══════════════════════════════════════════════════════╗', 'green');
    log('║   DEPLOY HOÀN THÀNH!                                ║', 'green');
    log('╚══════════════════════════════════════════════════════╝', 'green');
    log('\n📋 Kết quả:', 'cyan');
    log('   🌐 User (QR):  https://www.giaiphapqrcode.com', 'green');
    log('   🔧 Admin:      https://www.giaiphapqrcode.com/admin-panel', 'green');
    log('\n⚠️  Server Node.js (upload thủ công):', 'yellow');
    log('   1. cPanel → File Manager → /home/giaiphapqrcode/nodeapp/', 'gray');
    log('   2. Upload: ' + SERVER_ZIP, 'gray');
    log('   3. Extract → npm install → Restart Node.js App', 'gray');

  } catch (err) {
    log('\n❌ Deploy thất bại: ' + err.message, 'red');
    process.exit(1);
  } finally {
    ftp.close();
  }
}

try { require('dotenv').config({ path: path.join(SERVER_DIR, '.env') }); } catch (_) {}

main();
