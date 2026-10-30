/**
 * AUTO BACKUP SCRIPT FOR TEM QR CODE SYSTEM (C4 CLOUD OPTIMIZED)
 * Ưu tiên dùng mongodump --gzip trên C4 Cloud (chỉ ~2 giây cho hàng trăm nghìn tem, không tốn RAM Node.js)
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tem_db';

async function runAutoBackup() {
  console.log('[AUTO-BACKUP] Bắt đầu tiến trình sao lưu CSDL...');

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const gzBackupPath = path.join(backupDir, `tem_db_${todayStr}.gz`);

  return new Promise((resolve) => {
    execFile('mongodump', [
      `--uri=${MONGODB_URI}`,
      `--archive=${gzBackupPath}`,
      '--gzip'
    ], { timeout: 300000 }, (err) => {
      if (!err && fs.existsSync(gzBackupPath)) {
        const sizeMB = (fs.statSync(gzBackupPath).size / 1024 / 1024).toFixed(2);
        console.log(`[AUTO-BACKUP] ✅ Đã lưu bản sao lưu nén thành công: ${gzBackupPath} (${sizeMB} MB)`);
        cleanupOldBackups(backupDir);
        return resolve(true);
      }

      console.warn('[AUTO-BACKUP] ⚠️ mongodump không khả dụng hoặc lỗi:', err?.message || 'unknown');
      resolve(false);
    });
  });
}

function cleanupOldBackups(backupDir) {
  try {
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 ngày

    for (const file of files) {
      if ((file.startsWith('tem_db_') && file.endsWith('.gz')) ||
          (file.startsWith('database_backup_') && file.endsWith('.json'))) {
        const filePath = path.join(backupDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > MAX_AGE) {
          fs.unlinkSync(filePath);
          console.log(`[AUTO-BACKUP] 🧹 Đã dọn dẹp bản backup cũ (>30 ngày): ${file}`);
        }
      }
    }
  } catch (e) {
    console.warn('[AUTO-BACKUP] Lỗi khi dọn backup cũ:', e.message);
  }
}

if (require.main === module) {
  runAutoBackup();
}

module.exports = runAutoBackup;
