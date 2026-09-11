/**
 * Migration route tạm thời — chạy trên Render để migrate data
 * GỌI: POST /api/admin/migrate-cluster (cần JWT admin)
 *
 * XÓA FILE NÀY SAU KHI MIGRATE XONG!
 */

const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const OLD_URI = 'mongodb+srv://vtu21102000:Vuthanh1810%40@cluster0.7t35nab.mongodb.net/tem_db?retryWrites=true&w=majority&appName=Cluster0';
const NEW_URI = process.env.MONGO_URI; // cluster mới đang chạy

const PRIORITY_ORDER = ['users','enterprises','products','distributors','labelbatches','npphistories','labels'];

async function migrateCol(oldDb, newDb, colName) {
  const oldCol = oldDb.collection(colName);
  const newCol = newDb.collection(colName);
  const total = await oldCol.countDocuments();
  if (total === 0) return { col: colName, status: 'empty', count: 0 };

  const existing = await newCol.countDocuments();
  if (existing > 0) await newCol.deleteMany({});

  const BATCH = 500;
  let migrated = 0;
  let skip = 0;
  while (skip < total) {
    const batch = await oldCol.find({}).skip(skip).limit(BATCH).toArray();
    if (!batch.length) break;
    try {
      await newCol.insertMany(batch, { ordered: false });
    } catch (e) {
      if (e.code !== 11000) throw e;
    }
    migrated += batch.length;
    skip += BATCH;
  }
  return { col: colName, status: 'ok', migrated, total };
}

// POST /api/admin/migrate-cluster
router.post('/migrate-cluster', async (req, res) => {
  const log = [];
  const addLog = (msg) => { log.push(msg); console.log('[MIGRATE]', msg); };

  // Bắt đầu migration ngay — trả response sau khi xong
  const oldClient = new MongoClient(OLD_URI, { serverSelectionTimeoutMS: 30000 });
  const newClient = new MongoClient(NEW_URI, { serverSelectionTimeoutMS: 30000 });

  try {
    addLog('Kết nối cluster cũ...');
    await oldClient.connect();
    const oldDb = oldClient.db('tem_db');
    addLog('✅ Cluster cũ OK');

    addLog('Kết nối cluster mới...');
    await newClient.connect();
    const newDb = newClient.db('tem_db');
    addLog('✅ Cluster mới OK');

    const allCols = (await oldDb.listCollections().toArray()).map(c => c.name);
    const ordered = [
      ...PRIORITY_ORDER.filter(c => allCols.includes(c)),
      ...allCols.filter(c => !PRIORITY_ORDER.includes(c)),
    ];

    addLog(`Collections: ${ordered.join(', ')}`);

    const results = [];
    for (const col of ordered) {
      addLog(`Đang migrate: ${col}...`);
      const r = await migrateCol(oldDb, newDb, col);
      addLog(`  ${col}: ${r.status} — ${r.migrated ?? 0}/${r.total ?? 0}`);
      results.push(r);
    }

    // Thống kê dung lượng mới
    let newStats = null;
    try {
      const s = await newDb.stats();
      newStats = { dataMB: (s.dataSize/1024/1024).toFixed(1), storageMB: (s.storageSize/1024/1024).toFixed(1) };
    } catch(_) {}

    addLog('✅ Migration hoàn tất!');
    res.json({ success: true, results, newStats, log });

  } catch (err) {
    addLog('❌ LỖI: ' + err.message);
    res.status(500).json({ success: false, error: err.message, log });
  } finally {
    await oldClient.close().catch(() => {});
    await newClient.close().catch(() => {});
  }
});

// GET /api/admin/migrate-status — kiểm tra trạng thái cluster mới
router.get('/migrate-status', async (req, res) => {
  const newClient = new MongoClient(NEW_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await newClient.connect();
    const db = newClient.db('tem_db');
    const cols = await db.listCollections().toArray();
    const summary = {};
    for (const col of cols) {
      summary[col.name] = await db.collection(col.name).countDocuments();
    }
    const stats = await db.stats();
    res.json({
      status: 'connected',
      collections: summary,
      dataMB: (stats.dataSize/1024/1024).toFixed(1),
      storageMB: (stats.storageSize/1024/1024).toFixed(1),
    });
  } catch(e) {
    res.status(500).json({ status: 'error', error: e.message });
  } finally {
    await newClient.close().catch(() => {});
  }
});

module.exports = router;
