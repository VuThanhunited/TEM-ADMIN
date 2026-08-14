/**
 * BACKUP TO C2 HOSTING - Phương án A
 * ====================================
 * Xuất dữ liệu từ MongoDB Atlas → JSON → Upload lên C2 Hosting qua FTP
 * Chạy tự động mỗi ngày lúc 2:00 AM (cấu hình trong app.js)
 * 
 * Cài đặt: npm install basic-ftp
 */

'use strict';
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Models
const User = require('../models/User');
const Enterprise = require('../models/Enterprise');
const Product = require('../models/Product');
const LabelBatch = require('../models/LabelBatch');
const Label = require('../models/Label');
const LabelDesign = require('../models/LabelDesign');
const Template = require('../models/Template');
const ScanLog = require('../models/ScanLog');
const Contact = require('../models/Contact');

// ─── C2 Hosting FTP Config ────────────────────────────────────────────────────
const FTP_CONFIG = {
  host: process.env.C2_FTP_HOST || 'giaiphapqrcode.vn',
  user: process.env.C2_FTP_USER || 'giaiphapqrcode',
  password: process.env.C2_FTP_PASS || '',
  port: 21,
  secure: false, // C2 Hosting dùng plain FTP (không có FTPS)
};

const REMOTE_BACKUP_DIR = '/home/giaiphapqrcode/backups/mongodb/';
const LOCAL_TEMP_DIR = path.join(__dirname, '..', 'backups', 'temp');
const MAX_BACKUPS_KEEP = 30; // Giữ tối đa 30 ngày

// ─── Export dữ liệu từ MongoDB Atlas ─────────────────────────────────────────
async function exportData() {
  console.log('[BACKUP-C2] 📤 Đang export dữ liệu từ MongoDB Atlas...');

  const [users, enterprises, products, labelBatches, labels, labelDesigns, templates, scanLogs, contacts] = await Promise.all([
    User.find().select('-password').lean(),
    Enterprise.find().lean(),
    Product.find().lean(),
    LabelBatch.find().lean(),
    Label.find().lean(),
    LabelDesign.find().lean(),
    Template.find().lean(),
    ScanLog.find().lean(),
    Contact.find().lean(),
  ]);

  const backupData = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    system: 'TEM QR CODE - Atlas → C2 Backup',
    source: 'MongoDB Atlas (cluster0.7t35nab.mongodb.net)',
    destination: 'C2 Hosting FTP',
    counts: {
      users: users.length,
      enterprises: enterprises.length,
      products: products.length,
      labelBatches: labelBatches.length,
      labels: labels.length,
      labelDesigns: labelDesigns.length,
      templates: templates.length,
      scanLogs: scanLogs.length,
      contacts: contacts.length,
    },
    data: { users, enterprises, products, labelBatches, labels, labelDesigns, templates, scanLogs, contacts },
  };

  const totalRecords = Object.values(backupData.counts).reduce((a, b) => a + b, 0);
  console.log(`[BACKUP-C2] 📊 Tổng: ${totalRecords} records`);
  console.log('[BACKUP-C2]   ', JSON.stringify(backupData.counts));

  return backupData;
}

// ─── Upload lên C2 Hosting qua FTP ───────────────────────────────────────────
async function uploadToC2(localFilePath, fileName) {
  let ftp;
  try {
    // Dynamic import basic-ftp
    const { Client } = require('basic-ftp');
    ftp = new Client();
    ftp.ftp.verbose = false;

    console.log(`[BACKUP-C2] 🔌 Kết nối FTP tới ${FTP_CONFIG.host}...`);
    await ftp.access(FTP_CONFIG);
    console.log('[BACKUP-C2] ✅ Kết nối FTP thành công');

    // Tạo thư mục nếu chưa có
    try {
      await ftp.ensureDir(REMOTE_BACKUP_DIR);
    } catch (e) {
      console.warn('[BACKUP-C2] ⚠️ Không thể tạo thư mục remote:', e.message);
    }

    // Upload file
    console.log(`[BACKUP-C2] 📁 Uploading ${fileName}...`);
    await ftp.uploadFrom(localFilePath, REMOTE_BACKUP_DIR + fileName);
    console.log(`[BACKUP-C2] ✅ Upload thành công: ${REMOTE_BACKUP_DIR}${fileName}`);

    // Dọn backup cũ trên C2 (giữ MAX_BACKUPS_KEEP ngày)
    try {
      const remoteFiles = await ftp.list(REMOTE_BACKUP_DIR);
      const backupFiles = remoteFiles
        .filter(f => f.name.startsWith('backup_') && f.name.endsWith('.json'))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (backupFiles.length > MAX_BACKUPS_KEEP) {
        const toDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUPS_KEEP);
        for (const file of toDelete) {
          await ftp.remove(REMOTE_BACKUP_DIR + file.name);
          console.log(`[BACKUP-C2] 🧹 Xóa backup cũ: ${file.name}`);
        }
      }
    } catch (e) {
      console.warn('[BACKUP-C2] ⚠️ Không dọn được backup cũ:', e.message);
    }

    return true;
  } catch (err) {
    console.error('[BACKUP-C2] ❌ FTP upload thất bại:', err.message);
    return false;
  } finally {
    if (ftp) ftp.close();
  }
}

// ─── Main backup function ─────────────────────────────────────────────────────
async function runBackupToC2() {
  const startTime = Date.now();
  console.log('\n[BACKUP-C2] ═══════════════════════════════════');
  console.log('[BACKUP-C2] 🚀 Bắt đầu backup Atlas → C2 Hosting');
  console.log('[BACKUP-C2]    Thời gian:', new Date().toLocaleString('vi-VN'));
  console.log('[BACKUP-C2] ═══════════════════════════════════');

  const isCLI = require.main === module;
  let ownConnection = false;

  try {
    // Kết nối MongoDB nếu chưa có
    if (mongoose.connection.readyState !== 1) {
      if (isCLI || process.env.MONGO_URI) {
        console.log('[BACKUP-C2] 📡 Kết nối MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        ownConnection = true;
        console.log('[BACKUP-C2] ✅ MongoDB Atlas connected');
      } else {
        console.warn('[BACKUP-C2] ⚠️ Mongoose chưa kết nối. Bỏ qua.');
        return false;
      }
    }

    // 1. Export dữ liệu
    const backupData = await exportData();

    // 2. Lưu file JSON tạm thời
    if (!fs.existsSync(LOCAL_TEMP_DIR)) {
      fs.mkdirSync(LOCAL_TEMP_DIR, { recursive: true });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
    const fileName = `backup_${dateStr}_${timeStr}.json`;
    const localFilePath = path.join(LOCAL_TEMP_DIR, fileName);

    fs.writeFileSync(localFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
    const fileSizeKB = Math.round(fs.statSync(localFilePath).size / 1024);
    console.log(`[BACKUP-C2] 💾 File tạm: ${fileName} (${fileSizeKB} KB)`);

    // 3. Upload lên C2 (nếu có cấu hình FTP)
    let uploadSuccess = false;
    if (FTP_CONFIG.password) {
      uploadSuccess = await uploadToC2(localFilePath, fileName);
    } else {
      console.warn('[BACKUP-C2] ⚠️ Chưa cấu hình C2_FTP_PASS — bỏ qua FTP upload');
      console.warn('[BACKUP-C2]    Thêm C2_FTP_PASS vào Render Environment Variables');
      uploadSuccess = false;
    }

    // 4. Dọn file tạm local
    try {
      fs.unlinkSync(localFilePath);
    } catch (e) { /* ignore */ }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[BACKUP-C2] ═══════════════════════════════════`);
    if (uploadSuccess) {
      console.log(`[BACKUP-C2] ✅ BACKUP HOÀN THÀNH (${elapsed}s)`);
      console.log(`[BACKUP-C2]    Đã lưu tại: ${REMOTE_BACKUP_DIR}${fileName}`);
    } else {
      console.log(`[BACKUP-C2] ⚠️ Export xong nhưng FTP upload thất bại (${elapsed}s)`);
    }
    console.log(`[BACKUP-C2] ═══════════════════════════════════\n`);

    return uploadSuccess;
  } catch (err) {
    console.error('[BACKUP-C2] ❌ Lỗi nghiêm trọng:', err.message);
    return false;
  } finally {
    if (ownConnection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Chạy trực tiếp từ CLI
if (require.main === module) {
  runBackupToC2().then(ok => process.exit(ok ? 0 : 1));
}

module.exports = runBackupToC2;
