/**
 * MIGRATION SCRIPT: Chuyển dữ liệu từ cluster cũ sang cluster mới
 * Chạy trên Render (one-off job) để tránh DNS/firewall issues của local
 *
 * Old: cluster0.7t35nab.mongodb.net (tem_db) — đã đầy ~514MB
 * New: cluster0.hfem89g.mongodb.net (tem_db) — cluster mới, 512MB sạch
 */

const { MongoClient } = require('mongodb');

const OLD_URI = 'mongodb+srv://vtu21102000:Vuthanh1810%40@cluster0.7t35nab.mongodb.net/tem_db?retryWrites=true&w=majority&appName=Cluster0';
const NEW_URI = 'mongodb+srv://temadmin:uz9CImJo07orsDUV@cluster0.hfem89g.mongodb.net/tem_db?retryWrites=true&w=majority&appName=Cluster0';

// Thứ tự migrate: collections nhỏ trước, labels (lớn nhất) sau
const PRIORITY_COLLECTIONS = [
  'users',
  'enterprises', 
  'products',
  'distributors',
  'labelbatches',
  'npphistories',
  'labels',       // lớn nhất — migrate cuối
];

async function getCollectionStats(db, colName) {
  try {
    const stats = await db.collection(colName).stats();
    return {
      count: stats.count,
      sizeMB: (stats.size / 1024 / 1024).toFixed(2),
      storageMB: (stats.storageSize / 1024 / 1024).toFixed(2),
    };
  } catch (e) {
    return { count: 0, sizeMB: 0, storageMB: 0 };
  }
}

async function migrateCollection(oldDb, newDb, colName, batchSize = 500) {
  const oldCol = oldDb.collection(colName);
  const newCol = newDb.collection(colName);

  const total = await oldCol.countDocuments();
  if (total === 0) {
    console.log(`  [${colName}] Trống, bỏ qua.`);
    return 0;
  }

  // Xóa data cũ trong cluster mới (nếu có) để tránh duplicate
  const existingCount = await newCol.countDocuments();
  if (existingCount > 0) {
    console.log(`  [${colName}] Cluster mới đã có ${existingCount} docs — xóa để migrate sạch...`);
    await newCol.deleteMany({});
  }

  console.log(`  [${colName}] Đang migrate ${total} docs...`);
  let migrated = 0;
  let skip = 0;

  while (skip < total) {
    const batch = await oldCol.find({}).skip(skip).limit(batchSize).toArray();
    if (batch.length === 0) break;

    try {
      await newCol.insertMany(batch, { ordered: false });
      migrated += batch.length;
    } catch (e) {
      if (e.code === 11000) {
        // Duplicate key — bỏ qua
        migrated += batch.length;
      } else {
        console.error(`  [${colName}] LỖI insert batch: ${e.message}`);
        break;
      }
    }

    skip += batchSize;
    process.stdout.write(`\r  [${colName}] ${migrated}/${total} (${((migrated/total)*100).toFixed(1)}%)`);
  }

  console.log(`\n  [${colName}] ✅ Xong: ${migrated}/${total} docs`);
  return migrated;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MIGRATION: tem_db → cluster mới (TEM-Production)');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Thời gian: ${new Date().toISOString()}`);
  console.log('');

  const oldClient = new MongoClient(OLD_URI, { serverSelectionTimeoutMS: 30000 });
  const newClient = new MongoClient(NEW_URI, { serverSelectionTimeoutMS: 30000 });

  try {
    console.log('🔌 Kết nối cluster CŨ...');
    await oldClient.connect();
    const oldDb = oldClient.db('tem_db');
    console.log('✅ Cluster CŨ: OK');

    console.log('🔌 Kết nối cluster MỚI...');
    await newClient.connect();
    const newDb = newClient.db('tem_db');
    console.log('✅ Cluster MỚI: OK\n');

    // Liệt kê tất cả collections trong cluster cũ
    const allCollections = (await oldDb.listCollections().toArray()).map(c => c.name);
    console.log(`📦 Collections trong cluster cũ: ${allCollections.join(', ')}\n`);

    // Sắp xếp theo priority, các collection không có trong list sẽ migrate sau
    const ordered = [
      ...PRIORITY_COLLECTIONS.filter(c => allCollections.includes(c)),
      ...allCollections.filter(c => !PRIORITY_COLLECTIONS.includes(c)),
    ];

    // Thống kê trước khi migrate
    console.log('📊 Thống kê dung lượng:');
    let totalEstimatedMB = 0;
    for (const col of ordered) {
      const stats = await getCollectionStats(oldDb, col);
      console.log(`  ${col}: ${stats.count} docs, ~${stats.sizeMB}MB`);
      totalEstimatedMB += parseFloat(stats.sizeMB) || 0;
    }
    console.log(`\n  Tổng ước tính: ~${totalEstimatedMB.toFixed(1)}MB`);

    if (totalEstimatedMB > 450) {
      console.log('\n⚠️  CẢNH BÁO: Dữ liệu có thể vượt 512MB limit của cluster mới!');
      console.log('   Sẽ migrate theo thứ tự ưu tiên và dừng nếu bị lỗi write.');
    }

    console.log('\n🚀 Bắt đầu migrate...\n');

    const results = {};
    for (const col of ordered) {
      try {
        const count = await migrateCollection(oldDb, newDb, col);
        results[col] = { status: 'OK', count };
      } catch (e) {
        console.error(`  [${col}] ❌ LỖI: ${e.message}`);
        results[col] = { status: 'ERROR', error: e.message };
      }
    }

    console.log('\n═══════════════ KẾT QUẢ MIGRATION ═══════════════');
    for (const [col, result] of Object.entries(results)) {
      const icon = result.status === 'OK' ? '✅' : '❌';
      console.log(`  ${icon} ${col}: ${result.status} — ${result.count ?? result.error}`);
    }

    // Kiểm tra dung lượng cluster mới
    try {
      const newStats = await newDb.stats();
      console.log(`\n📦 Cluster mới sau migration:`);
      console.log(`   Data size: ${(newStats.dataSize/1024/1024).toFixed(1)}MB`);
      console.log(`   Storage size: ${(newStats.storageSize/1024/1024).toFixed(1)}MB`);
    } catch (e) {
      // ignore stats error
    }

    console.log('\n✅ Migration hoàn tất!');

  } catch (err) {
    console.error('❌ LỖI NGHIÊM TRỌNG:', err.message);
    process.exit(1);
  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

main();
