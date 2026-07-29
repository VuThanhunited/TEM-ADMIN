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
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI);
    }

    const [users, enterprises, products, labelBatches, labels, labelDesigns, templates, scanLogs, contacts] = await Promise.all([
      User.find().select('-password'),
      Enterprise.find(),
      Product.find(),
      LabelBatch.find(),
      Label.find(),
      LabelDesign.find(),
      Template.find(),
      ScanLog.find(),
      Contact.find()
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

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`[AUTO-BACKUP] ✅ Đã lưu bản sao lưu thành công tại: ${backupFilePath}`);

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
    if (require.main === module && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runAutoBackup();
}

module.exports = runAutoBackup;
