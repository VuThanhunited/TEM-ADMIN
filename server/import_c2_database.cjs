const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Enterprise = require('./models/Enterprise');
const Product = require('./models/Product');
const LabelBatch = require('./models/LabelBatch');
const Label = require('./models/Label');
const ScanLog = require('./models/ScanLog');
const Template = require('./models/Template');

async function importDatabaseToC2() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_admin';
  console.log(`Connecting to C2 Database at: ${mongoUri}`);

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
  console.log('✅ Connected to C2 MongoDB!');

  const jsonPath = path.join(__dirname, '../database_backup_full.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Backup file database_backup_full.json not found!');
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log('📦 Backup File Summary:', backupData.counts);

  // Helper for batch insert
  const insertBatch = async (Model, dataArray, name) => {
    if (!dataArray || dataArray.length === 0) return;
    console.log(`🚀 Importing ${dataArray.length} items into ${name}...`);
    const CHUNK_SIZE = 2000;
    for (let i = 0; i < dataArray.length; i += CHUNK_SIZE) {
      const chunk = dataArray.slice(i, i + CHUNK_SIZE);
      await Model.insertMany(chunk, { ordered: false }).catch(() => {});
    }
  };

  await insertBatch(Enterprise, backupData.enterprises, 'Enterprise');
  await insertBatch(User, backupData.users, 'User');
  await insertBatch(Product, backupData.products, 'Product');
  await insertBatch(LabelBatch, backupData.labelbatches, 'LabelBatch');
  await insertBatch(Label, backupData.labels, 'Label');
  await insertBatch(ScanLog, backupData.scanlogs, 'ScanLog');
  await insertBatch(Template, backupData.templates, 'Template');

  console.log('🎉 C2 DATABASE IMPORT COMPLETED SUCCESSFULLY!');
  await mongoose.disconnect();
}

importDatabaseToC2().catch(err => {
  console.error('❌ Import failed:', err);
});
