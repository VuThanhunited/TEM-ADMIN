/**
 * AUTO RESTORE BACKUP SCRIPT FOR TEM QR CODE SYSTEM
 * Nạp tự động toàn bộ dữ liệu từ bản sao lưu JSON (C2 Server Primary DB)
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

async function runAutoRestore(backupFilePathOverride = null) {
  console.log('[AUTO-RESTORE] Kiểm tra và phục hồi dữ liệu từ bản sao lưu C2 Server...');
  try {
    let backupFilePath = backupFilePathOverride;
    
    if (!backupFilePath) {
      const candidates = [
        path.join(__dirname, '..', 'backups', 'database_backup_full.json'),
        path.join(__dirname, '..', '..', 'database_backup_full.json'),
        path.join(__dirname, '..', 'backups', 'database_backup_2026-07-29.json')
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          backupFilePath = cand;
          break;
        }
      }
    }

    if (!backupFilePath || !fs.existsSync(backupFilePath)) {
      console.log('[AUTO-RESTORE] ⚠️ Không tìm thấy file sao lưu JSON nào để phục hồi.');
      return false;
    }

    console.log(`[AUTO-RESTORE] Đọc file sao lưu: ${backupFilePath}`);
    const rawData = fs.readFileSync(backupFilePath, 'utf-8');
    const json = JSON.parse(rawData);

    const sourceData = json.data || json;

    const usersData = sourceData.users || sourceData.User || [];
    const enterprisesData = sourceData.enterprises || sourceData.Enterprise || [];
    const productsData = sourceData.products || sourceData.Product || [];
    const labelBatchesData = sourceData.labelbatches || sourceData.labelBatches || sourceData.LabelBatch || [];
    const labelsData = sourceData.labels || sourceData.Label || [];
    const scanLogsData = sourceData.scanlogs || sourceData.scanLogs || sourceData.ScanLog || [];
    const templatesData = sourceData.templates || sourceData.Template || [];
    const labelDesignsData = sourceData.labeldesigns || sourceData.labelDesigns || sourceData.LabelDesign || [];
    const contactsData = sourceData.contacts || sourceData.Contact || [];

    console.log(`[AUTO-RESTORE] Tìm thấy: ${usersData.length} users, ${enterprisesData.length} doanh nghiệp, ${productsData.length} sản phẩm, ${labelBatchesData.length} lô tem, ${labelsData.length} tem nhãn.`);

    // Restore helper with chunking for large collections (labels)
    const restoreCollection = async (Model, dataList, modelName) => {
      if (!dataList || dataList.length === 0) return;
      await Model.deleteMany({});
      
      const CHUNK_SIZE = 2000;
      for (let i = 0; i < dataList.length; i += CHUNK_SIZE) {
        const chunk = dataList.slice(i, i + CHUNK_SIZE);
        await Model.insertMany(chunk, { ordered: false });
      }
      console.log(`[AUTO-RESTORE] ✅ Đã nạp thành công ${dataList.length} bản ghi cho ${modelName}`);
    };

    await restoreCollection(Enterprise, enterprisesData, 'Enterprise');
    await restoreCollection(User, usersData, 'User');
    await restoreCollection(Product, productsData, 'Product');
    await restoreCollection(Template, templatesData, 'Template');
    await restoreCollection(LabelDesign, labelDesignsData, 'LabelDesign');
    await restoreCollection(LabelBatch, labelBatchesData, 'LabelBatch');
    await restoreCollection(Label, labelsData, 'Label');
    await restoreCollection(ScanLog, scanLogsData, 'ScanLog');
    await restoreCollection(Contact, contactsData, 'Contact');

    console.log('[AUTO-RESTORE] 🎉 Đã phục hồi toàn bộ CSDL trên C2 Server thành công!');
    return true;

  } catch (err) {
    console.error('[AUTO-RESTORE] ❌ Lỗi phục hồi CSDL:', err.message);
    return false;
  }
}

if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_db';
  mongoose.connect(MONGO_URI).then(async () => {
    await runAutoRestore();
    await mongoose.disconnect();
  }).catch(e => console.error('Connection error:', e));
}

module.exports = runAutoRestore;
