const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config();

// Load models
const Enterprise = require('./models/Enterprise');
const Product = require('./models/Product');
const LabelBatch = require('./models/LabelBatch');
const Label = require('./models/Label');

const MONGO_URI = process.env.MONGO_URI;

// CLI arguments: node import-legacy.js [filename] [productName]
const args = process.argv.slice(2);
const excelFileName = args[0] || 'cagai.mdq.xls';
const targetProductName = args[1] || 'Trà Cà Gai Leo';

const excelPath = path.join(__dirname, '../', excelFileName);

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected successfully!');

    // 1. Get or create Enterprise for In Thuong Gia
    let enterprise = await Enterprise.findOne({ name: 'Công ty TNHH In Thương Gia' });
    if (!enterprise) {
      console.log('Creating legacy Enterprise...');
      enterprise = await Enterprise.create({
        name: 'Công ty TNHH In Thương Gia',
        type: 'NSX',
        address: 'Hà Nội, Việt Nam',
        phone: '024-3999-9999',
        email: 'contact@inthuonggia.vn',
        website: 'https://inthuonggia.vn',
        taxCode: '0102030405',
        isActive: true,
        subscriptionPlan: 'PRO',
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      console.log('✅ Legacy Enterprise created with ID:', enterprise._id);
    } else {
      console.log('✅ Using existing Enterprise ID:', enterprise._id);
    }

    // 2. Get or create Product for legacy labels
    let product = await Product.findOne({ name: targetProductName, enterpriseId: enterprise._id });
    if (!product) {
      console.log(`Creating legacy Product "${targetProductName}"...`);
      product = await Product.create({
        name: targetProductName,
        enterpriseId: enterprise._id,
        description: `Sản phẩm ${targetProductName} được in và quản lý bởi In Thương Gia.`,
        category: targetProductName.includes('Trà') ? 'Trà' : 'Sản phẩm',
        sku: `LEGACY-${targetProductName.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`,
        isActive: true
      });
      console.log('✅ Legacy Product created with ID:', product._id);
    } else {
      console.log('✅ Using existing Product ID:', product._id);
    }

    // 3. Read Excel File
    console.log('Reading Excel file from:', excelPath);
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    console.log('Parsing worksheet to JSON objects...');
    const rawData = xlsx.utils.sheet_to_json(worksheet);
    console.log(`Total rows read from Excel: ${rawData.length}`);

    // Filter valid rows
    const validRows = rawData.filter(row => row.ID && row.QRCODE);
    console.log(`Valid rows to import: ${validRows.length}`);

    if (validRows.length === 0) {
      console.log('⚠️ No valid rows found in Excel sheet. Aborting.');
      return;
    }

    // 4. Get or create LabelBatch for legacy labels
    const batchCode = `LEGACY_IMPORT_${excelFileName.split('.')[0].toUpperCase()}`;
    let batch = await LabelBatch.findOne({ batchCode, enterpriseId: enterprise._id });
    if (!batch) {
      console.log(`Creating legacy LabelBatch for batchCode "${batchCode}"...`);
      
      // Calculate serial boundaries
      const sortedIds = validRows.map(r => Number(r.ID)).sort((a, b) => a - b);
      const minId = sortedIds[0] || 0;
      const maxId = sortedIds[sortedIds.length - 1] || 0;
      console.log(`Computed Serial boundaries: Start=${minId}, End=${maxId}`);

      batch = await LabelBatch.create({
        name: `Lô tem cũ - ${targetProductName} (Imported)`,
        batchCode,
        enterpriseId: enterprise._id,
        productId: product._id,
        totalLabels: validRows.length,
        serialStart: String(minId),
        serialEnd: String(maxId),
        expiryDate: new Date('2036-12-31'),
        status: 'ACTIVE',
        isActive: true,
        isMigrated: true,
        migrationSource: excelFileName
      });
      console.log('✅ Legacy LabelBatch created with ID:', batch._id);
    } else {
      console.log('✅ Using existing LabelBatch ID:', batch._id);
    }

    // 5. Bulk insert in chunks of 5000
    const chunkSize = 5000;
    let successCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < validRows.length; i += chunkSize) {
      const chunk = validRows.slice(i, i + chunkSize);
      
      const bulkOps = chunk.map(row => {
        const qrcode = String(row.QRCODE).trim();
        // Extract suffix code after /qrcode/
        const match = qrcode.match(/\/qrcode\/([^/?#]+)/);
        const suffix = match ? match[1] : '';

        const labelData = {
          batchId: batch._id,
          enterpriseId: enterprise._id,
          productId: product._id,
          serialNumber: String(row.ID).trim(),
          legacyQrCode: suffix || null,
          legacyTemQr: qrcode || null,
          status: 'ACTIVE',
          isActive: true,
          scanCount: 0
        };

        return {
          updateOne: {
            filter: { serialNumber: labelData.serialNumber },
            update: { $setOnInsert: labelData },
            upsert: true
          }
        };
      });

      console.log(`Executing chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} items)...`);
      const result = await Label.bulkWrite(bulkOps, { ordered: false });
      
      successCount += result.upsertedCount;
      duplicateCount += (chunk.length - result.upsertedCount);
      console.log(`   Chunk progress: inserted ${result.upsertedCount} new records, skipped/updated ${chunk.length - result.upsertedCount}.`);
    }

    console.log('\n--- IMPORT SUMMARY ---');
    console.log(`Total processed: ${validRows.length}`);
    console.log(`Successfully imported (new): ${successCount}`);
    console.log(`Skipped (already exists): ${duplicateCount}`);
    console.log('✅ Import process completed successfully!');

  } catch (err) {
    console.error('❌ Error during import:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

run();
