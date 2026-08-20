/**
 * MERGE: Hợp nhất tem-admin vào tem_db (cùng cluster mới)
 * - Đọc từ tem-admin, upsert vào tem_db (giữ dữ liệu mới nhất)
 * - Sau đó: cập nhật Render MONGO_URI → tem_db và drop tem-admin
 */

const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

const CLUSTER_URI_BASE = 'mongodb+srv://temadmin:uz9CImJo07orsDUV@cluster0.hfem89g.mongodb.net';
const SRC_DB  = 'tem-admin'; // nguồn (Render đang dùng)
const DEST_DB = 'tem_db';    // đích (chuẩn hóa)

// GET /api/merge/status — xem số lượng docs trong cả 2 DB
router.get('/status', async (req, res) => {
  const client = new MongoClient(CLUSTER_URI_BASE, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const src  = client.db(SRC_DB);
    const dest = client.db(DEST_DB);

    const srcCols  = (await src.listCollections().toArray()).map(c => c.name);
    const destCols = (await dest.listCollections().toArray()).map(c => c.name);
    const allCols  = [...new Set([...srcCols, ...destCols])].sort();

    const result = {};
    for (const col of allCols) {
      const srcCount  = srcCols.includes(col)  ? await src.collection(col).countDocuments()  : 0;
      const destCount = destCols.includes(col) ? await dest.collection(col).countDocuments() : 0;
      result[col] = { [SRC_DB]: srcCount, [DEST_DB]: destCount };
    }

    // Dung lượng
    const srcStats  = await src.stats().catch(() => ({}));
    const destStats = await dest.stats().catch(() => ({}));

    res.json({
      collections: result,
      storage: {
        [SRC_DB]:  { dataMB: ((srcStats.dataSize  || 0) / 1024 / 1024).toFixed(1) },
        [DEST_DB]: { dataMB: ((destStats.dataSize || 0) / 1024 / 1024).toFixed(1) },
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    await client.close().catch(() => {});
  }
});

// POST /api/merge/run — thực hiện merge tem-admin → tem_db
router.post('/run', async (req, res) => {
  const log = [];
  const add = (m) => { log.push(m); console.log('[MERGE]', m); };
  const client = new MongoClient(CLUSTER_URI_BASE, { serverSelectionTimeoutMS: 30000 });

  try {
    await client.connect();
    const src  = client.db(SRC_DB);
    const dest = client.db(DEST_DB);

    const srcCols = (await src.listCollections().toArray()).map(c => c.name);
    add(`Collections trong ${SRC_DB}: ${srcCols.join(', ')}`);

    const results = [];
    for (const col of srcCols) {
      const srcCol  = src.collection(col);
      const destCol = dest.collection(col);
      const total   = await srcCol.countDocuments();

      if (total === 0) {
        add(`  [${col}] Trống, bỏ qua.`);
        results.push({ col, status: 'skipped', total: 0 });
        continue;
      }

      add(`  [${col}] Đang upsert ${total} docs...`);
      let upserted = 0, skipped = 0;
      const BATCH = 500;
      let skip = 0;

      while (skip < total) {
        const batch = await srcCol.find({}).skip(skip).limit(BATCH).toArray();
        if (!batch.length) break;

        // Upsert từng doc theo _id
        const ops = batch.map(doc => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true,
          }
        }));

        const bulkResult = await destCol.bulkWrite(ops, { ordered: false });
        upserted += (bulkResult.upsertedCount || 0) + (bulkResult.modifiedCount || 0);
        skipped  += batch.length - (bulkResult.upsertedCount || 0) - (bulkResult.modifiedCount || 0);
        skip += BATCH;
      }

      add(`  [${col}] ✅ upserted=${upserted}, unchanged=${skipped}`);
      results.push({ col, status: 'ok', total, upserted, skipped });
    }

    // Thống kê cuối
    const destStats = await dest.stats().catch(() => ({}));
    add('✅ Merge hoàn tất!');

    res.json({
      success: true,
      results,
      destStorage: { dataMB: ((destStats.dataSize || 0) / 1024 / 1024).toFixed(1) },
      log,
      nextSteps: [
        `1. Cập nhật Render MONGO_URI → thêm /tem_db thay vì /tem-admin`,
        `2. Kiểm tra app chạy bình thường`,
        `3. Drop database tem-admin khi xác nhận OK`,
      ]
    });
  } catch (e) {
    add('❌ LỖI: ' + e.message);
    res.status(500).json({ success: false, error: e.message, log });
  } finally {
    await client.close().catch(() => {});
  }
});

module.exports = router;
