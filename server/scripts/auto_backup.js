/**
 * AUTO BACKUP SCRIPT FOR TEM QR CODE SYSTEM
 * Tự động chạy định kỳ để sao lưu CSDL MongoDB ra thư mục server/backups/
 */

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

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tem_admin';

async function runAutoBackup() {
  console.log('[AUTO-BACKUP] Bắt đầu tiến trình sao lưu CSDL...');
  const isCLI = require.main === module;
  let ownConnection = false;

  try {
    // Chỉ tạo kết nối mới nếu chưa có (chạy CLI độc lập)
    if (mongoose.connection.readyState !== 1) {
      if (isCLI) {
        await mongoose.connect(MONGODB_URI);
        ownConnection = true;
      } else {
        console.warn('[AUTO-BACKUP] ⚠️ Mongoose chưa kết nối. Bỏ qua backup lần này.');
        return;
      }
    }

    // Dùng .lean() để giảm bộ nhớ Mongoose overhead (~3-5x nhẹ hơn)
    // ScanLog giới hạn 5000 bản gần nhất để tránh OOM trên Render free tier (512MB RAM)
    const [users, enterprises, products, labelBatches, labels, labelDesigns, templates, scanLogs, contacts] = await Promise.all([
      User.find().select('-password').lean(),
      Enterprise.find().lean(),
      Product.find().lean(),
      LabelBatch.find().lean(),
      Label.find().lean(),
      LabelDesign.find().lean(),
      Template.find().lean(),
      ScanLog.find().sort({ scannedAt: -1 }).limit(5000).lean(), // chỉ 5000 bản gần nhất
      Contact.find().lean()
    ]);

    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      system: 'TEM QR CODE & BẢO HÀNH - AUTO BACKUP',
      counts: {
        users: users.length,
        enterprises: enterprises.length,
        products: products.length,
        labelBatches: labelBatches.length,
        labels: labels.length,
        labelDesigns: labelDesigns.length,
        templates: templates.length,
        scanLogs: scanLogs.length,
        contacts: contacts.length
      },
      data: {
        users,
        enterprises,
        products,
        labelBatches,
        labels,
        labelDesigns,
        templates,
        scanLogs,
        contacts
      }
    };

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const backupFilePath = path.join(backupDir, `database_backup_${todayStr}.json`);

    // Ghi file — với .lean() object đã nhỏ hơn đáng kể
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`[AUTO-BACKUP] ✅ Đã lưu bản sao lưu thành công tại: ${backupFilePath} (ScanLogs: ${scanLogs.length} bản gần nhất)`);

    // Clean up backups older than 30 days
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

    for (const file of files) {
      if (file.startsWith('database_backup_') && file.endsWith('.json')) {
        const filePath = path.join(backupDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > MAX_AGE) {
          fs.unlinkSync(filePath);
          console.log(`[AUTO-BACKUP] 🧹 Đã dọn dẹp bản backup cũ (>30 ngày): ${file}`);
        }
      }
    }

  } catch (err) {
    console.error('[AUTO-BACKUP] ❌ Lỗi khi tự động sao lưu:', err);
  } finally {
    if (ownConnection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runAutoBackup();
}

module.exports = runAutoBackup;
