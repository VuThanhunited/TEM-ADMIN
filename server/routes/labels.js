const express = require('express');
const crypto = require('crypto');
const LabelBatch = require('../models/LabelBatch');
const Label = require('../models/Label');
const auth = require('../middleware/auth');
const { requireRole, requireOwnership } = require('../middleware/rbac');

const router = express.Router();
const ADMIN_URL = process.env.ADMIN_URL || 'https://giaiphapqrcode.vn';

// Helper to generate a random secure alphanumeric string (8 chars, readable uppercase + digits)
function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

// ======= BATCH ROUTES =======

// GET /api/labels/next-serial - Get next starting serial number for global continuous sequence
// Tính từ cả LabelBatch.serialEnd và Label collection để tránh orphan conflict
router.get('/next-serial', auth, async (req, res) => {
  try {
    let nextStartNum = 1;

    // Lấy số lớn nhất từ LabelBatch
    const lastBatch = await LabelBatch.findOne({}).sort({ createdAt: -1 });
    if (lastBatch && lastBatch.serialEnd) {
      const match = lastBatch.serialEnd.match(/(\d+)$/);
      if (match) nextStartNum = Math.max(nextStartNum, parseInt(match[1], 10) + 1);
    }

    // Lấy số lớn nhất từ Label (phòng trường hợp có orphan labels)
    const lastLabel = await Label.findOne({}).sort({ serialNumber: -1 }).lean();
    if (lastLabel && lastLabel.serialNumber) {
      const match = lastLabel.serialNumber.match(/(\d+)$/);
      if (match) nextStartNum = Math.max(nextStartNum, parseInt(match[1], 10) + 1);
    }

    const formattedNext = String(nextStartNum).padStart(8, '0');
    res.json({ nextStartNum, nextSerial: formattedNext });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/labels/export - Stream export all labels for a batch (optimized for large datasets)
router.get('/export', auth, requireOwnership, async (req, res) => {
  try {
    const { batchId } = req.query;
    if (!batchId) {
      return res.status(400).json({ error: 'Thiếu tham số batchId' });
    }

    // Extend timeout for large exports (5 minutes)
    req.setTimeout(300000);
    res.setTimeout(300000);

    const query = { batchId, ...(req.enterpriseFilter || {}) };

    // Use lean cursor for memory-efficient streaming
    const cursor = Label.find(query)
      .select('serialNumber qrUrl smsCode activeCode legacyQrCode legacyTemQr status scanCount')
      .sort({ serialNumber: 1 })
      .lean()
      .cursor({ batchSize: 2000 });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write('[');

    let first = true;
    let count = 0;

    cursor.on('data', (doc) => {
      const chunk = (first ? '' : ',') + JSON.stringify(doc);
      first = false;
      count++;
      res.write(chunk);
    });

    cursor.on('end', () => {
      res.write(']');
      res.end();
    });

    cursor.on('error', (err) => {
      console.error('Export cursor error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Lỗi xuất dữ liệu: ' + err.message });
      } else {
        res.end();
      }
    });

  } catch (error) {
    console.error('Export labels error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// GET /api/labels/export-all - Stream export labels with optional search filter (for "Kích hoạt" tab)
router.get('/export-all', auth, requireOwnership, async (req, res) => {
  try {
    const { search = '' } = req.query;

    // Extend timeout for large exports (5 minutes)
    req.setTimeout(300000);
    res.setTimeout(300000);

    const query = req.enterpriseFilter || {};
    if (search) {
      query.serialNumber = { $regex: search, $options: 'i' };
    }

    // Use lean cursor for memory-efficient streaming
    const cursor = Label.find(query)
      .select('serialNumber qrUrl smsCode activeCode distributorName distributorAddress status scanCount batchId productId')
      .populate('batchId', 'batchCode')
      .populate('productId', 'name')
      .sort({ serialNumber: 1 })
      .lean()
      .cursor({ batchSize: 2000 });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write('[');

    let first = true;

    cursor.on('data', (doc) => {
      const chunk = (first ? '' : ',') + JSON.stringify(doc);
      first = false;
      res.write(chunk);
    });

    cursor.on('end', () => {
      res.write(']');
      res.end();
    });

    cursor.on('error', (err) => {
      console.error('Export-all cursor error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Lỗi xuất dữ liệu: ' + err.message });
      } else {
        res.end();
      }
    });

  } catch (error) {
    console.error('Export-all labels error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// DELETE /api/labels/clear-all - Clear all label batches, labels, and scan logs (ADMIN ONLY)
router.delete('/clear-all', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const ScanLog = require('../models/ScanLog');
    await LabelBatch.deleteMany({});
    await Label.deleteMany({});
    await ScanLog.deleteMany({});
    res.json({ message: 'Đã xóa toàn bộ dữ liệu lô tem, tem nhãn và lịch sử quét thành công. Hệ thống đã reset về 0!' });
  } catch (error) {
    console.error('Clear all labels error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa dữ liệu: ' + error.message });
  }
});

// DELETE /api/labels/cleanup-orphans - Dọn sạch labels bị orphan (không còn batchId hợp lệ) (ADMIN ONLY)
// Dùng khi có sự cố orphan labels tích lũy do rollback thất bại
router.delete('/cleanup-orphans', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    // Lấy tất cả batchId hợp lệ
    const validBatches = await LabelBatch.find({}, { _id: 1 }).lean();
    const validBatchIds = validBatches.map(b => b._id);

    // Xóa mọi label có batchId không nằm trong danh sách hợp lệ
    const result = await Label.deleteMany({
      batchId: { $nin: validBatchIds }
    });

    console.info(`[cleanup-orphans] Deleted ${result.deletedCount} orphan labels`);
    res.json({
      message: `Đã dọn sạch ${result.deletedCount} tem nhãn orphan (không thuộc lô tem nào).`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Cleanup orphans error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});


// GET /api/labels/batches
// Allow reading batches, but only ADMIN creates them
router.get('/batches', auth, requireOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', search = '' } = req.query;

    // Bắt đầu từ một object mới để tránh mutate req.enterpriseFilter
    const query = Object.assign({}, req.enterpriseFilter || {});
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { batchCode: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await LabelBatch.countDocuments(query);
    const batches = await LabelBatch.find(query)
      .populate('enterpriseId', 'name')
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Cảnh báo nếu search không tìm thấy trong enterprise nhưng tồn tại globally
    // Giúp phát hiện lô tem bị gán sai enterpriseId
    if (search && total === 0) {
      const globalCount = await LabelBatch.countDocuments({
        $or: [
          { batchCode: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      });
      if (globalCount > 0) {
        console.warn(`[getBatches] Lô "${search}" tồn tại globally (${globalCount}) nhưng không thuộc enterpriseFilter:`, req.enterpriseFilter);
      }
    }

    res.json({
      data: batches,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('[getBatches] error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/labels/batches - Create batch and individual labels (ADMIN ONLY)
// ── Helper: tìm startNum an toàn từ cả LabelBatch lẫn Label (tránh orphan serial conflict) ──
async function getNextStartNum(cleanPrefix) {
  let startNum = 1;

  // 1. Lấy số lớn nhất từ serialEnd của batch gần nhất
  const lastBatch = await LabelBatch.findOne({}).sort({ createdAt: -1 }).lean();
  if (lastBatch && lastBatch.serialEnd) {
    const m = lastBatch.serialEnd.match(/(\d+)$/);
    if (m) startNum = Math.max(startNum, parseInt(m[1], 10) + 1);
  }

  // 2. Lấy số lớn nhất từ Label (bắt được orphan labels còn sót sau rollback)
  const labelQuery = cleanPrefix
    ? { serialNumber: { $regex: `^${cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` } }
    : {};
  const lastLabel = await Label.findOne(labelQuery).sort({ serialNumber: -1 }).lean();
  if (lastLabel && lastLabel.serialNumber) {
    const m = lastLabel.serialNumber.match(/(\d+)$/);
    if (m) startNum = Math.max(startNum, parseInt(m[1], 10) + 1);
  }

  return startNum;
}

router.post('/batches', auth, requireRole('ADMIN'), async (req, res) => {
  let createdBatch = null;
  try {
    const {
      batchCode, totalLabels, prefix = '', serialType = 'GLOBAL_SEQUENTIAL',
      productId, templateId, theme, expiryDate, notes, customDomain
    } = req.body;

    const enterpriseId = req.user.role === 'ADMIN'
      ? (req.body.enterpriseId || req.user.enterpriseId)
      : req.user.enterpriseId;

    // ── Validate đầu vào ──────────────────────────────────────────────────────
    if (!enterpriseId) {
      return res.status(400).json({ error: 'Thiếu thông tin doanh nghiệp sở hữu' });
    }
    if (!batchCode || !String(batchCode).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập Mã lô tem' });
    }

    const cleanBatchCode = String(batchCode).trim();
    const cleanPrefix    = String(prefix || '').trim();
    const count = Math.min(Math.max(parseInt(totalLabels) || 100, 1), 500000);

    // ── Kiểm tra trùng mã lô tem ──────────────────────────────────────────────
    const existingBatch = await LabelBatch.findOne({ batchCode: cleanBatchCode }).lean();
    if (existingBatch) {
      console.warn(`[createBatch] Duplicate batchCode "${cleanBatchCode}" (enterprise: ${existingBatch.enterpriseId}, status: ${existingBatch.status})`);
      return res.status(400).json({
        error: `Mã lô tem "${cleanBatchCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã lô tem khác!`
      });
    }

    // ── Sinh dãy serial ──────────────────────────────────────────────────────
    const generatedSerials = [];

    if (serialType === 'RANDOM_ALPHANUMERIC') {
      // Mã ngẫu nhiên chữ + số — kiểm tra trùng realtime với DB
      const generatedSet = new Set();
      while (generatedSerials.length < count) {
        const rCode = generateRandomCode(8);
        const candidate = cleanPrefix ? `${cleanPrefix}-${rCode}` : rCode;
        if (!generatedSet.has(candidate)) {
          generatedSet.add(candidate);
          generatedSerials.push(candidate);
        }
      }
    } else {
      // GLOBAL_SEQUENTIAL — nối tiếp toàn hệ thống
      // Lấy startNum an toàn (tính cả orphan labels còn sót sau rollback)
      const startNum = await getNextStartNum(cleanPrefix);
      const endNum   = startNum + count - 1;
      const padLen   = Math.max(8, String(endNum).length);

      for (let i = startNum; i <= endNum; i++) {
        const num = String(i).padStart(padLen, '0');
        generatedSerials.push(cleanPrefix ? `${cleanPrefix}${num}` : num);
      }
    }

    const serialStart = generatedSerials[0];
    const serialEnd   = generatedSerials[generatedSerials.length - 1];

    // ── Kiểm tra xung đột serial trước khi insert ─────────────────────────────
    // Kiểm tra serialStart và serialEnd; nếu có orphan ở giữa sẽ bị ordered:true bắt
    const conflictLabel = await Label.findOne({
      serialNumber: { $in: [serialStart, serialEnd] }
    }).lean();
    if (conflictLabel) {
      console.warn(`[createBatch] Serial conflict detected: "${conflictLabel.serialNumber}" already exists`);
      return res.status(409).json({
        error: `Dải serial bắt đầu từ "${serialStart}" bị xung đột. Hệ thống tự điều chỉnh lần sau — vui lòng thử lại ngay!`
      });
    }

    // ── Tạo LabelBatch ────────────────────────────────────────────────────────
    createdBatch = new LabelBatch({
      enterpriseId,
      productId:   productId   || null,
      templateId:  templateId  || null,
      theme:       theme       || 'default',
      customDomain: customDomain || null,
      batchCode:   cleanBatchCode,
      totalLabels: count,
      serialStart,
      serialEnd,
      prefix:     cleanPrefix,
      serialType: serialType   || 'GLOBAL_SEQUENTIAL',
      expiryDate: expiryDate   || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      notes,
      createdDate: new Date(),
      status: productId ? 'ACTIVE' : 'INACTIVE'
    });
    await createdBatch.save();

    // ── Sinh và insert Labels ─────────────────────────────────────────────────
    const cleanCustomDomain = customDomain ? customDomain.trim().replace(/\/+$/, '') : '';
    const domainUrl = cleanCustomDomain
      ? (cleanCustomDomain.startsWith('http') ? cleanCustomDomain : `https://${cleanCustomDomain}`)
      : ADMIN_URL;

    const labels = generatedSerials.map(serial => {
      const secretCode = generateRandomCode(8).toLowerCase();
      return {
        batchId:      createdBatch._id,
        enterpriseId,
        productId:    productId || null,
        serialNumber: serial,
        qrCode:       secretCode,
        qrUrl:        `${domainUrl}/scan/${secretCode}`,
        status:       productId ? 'ACTIVE' : 'INACTIVE',
        isActive:     !!productId
      };
    });

    // ordered:true → dừng ngay khi gặp lỗi, không tạo orphan labels
    const CHUNK_SIZE = 5000;
    for (let i = 0; i < labels.length; i += CHUNK_SIZE) {
      await Label.insertMany(labels.slice(i, i + CHUNK_SIZE), { ordered: true });
    }

    const populated = await LabelBatch.findById(createdBatch._id)
      .populate('enterpriseId', 'name')
      .populate('productId', 'name');

    res.status(201).json(populated);

  } catch (error) {
    console.error('[createBatch] error:', error.code, error.message);

    // ── Rollback: xóa batch và mọi label đã insert ──────────────────────────
    if (createdBatch && createdBatch._id) {
      try {
        await LabelBatch.findByIdAndDelete(createdBatch._id);
        await Label.deleteMany({ batchId: createdBatch._id });
        console.info(`[createBatch] Rolled back batch ${createdBatch._id}`);
      } catch (cleanupErr) {
        console.error('[createBatch] Rollback error:', cleanupErr.message);
      }
    }

    // ── Phân biệt loại lỗi MongoDB duplicate key ───────────────────────────
    if (error.code === 11000 || error.name === 'MongoServerError') {
      const keyPattern = error.keyPattern || {};
      if (keyPattern.batchCode) {
        // Race condition giữa nhiều worker: batch đã được tạo bởi request song song
        // Batch đã được rollback → user CÓ THỂ thử lại với cùng mã
        return res.status(409).json({
          error: `Mã lô tem "${req.body.batchCode}" bị xung đột do yêu cầu đồng thời. Vui lòng nhấn tạo lại!`
        });
      }
      if (keyPattern.serialNumber) {
        return res.status(409).json({
          error: `Dải serial bị trùng lặp. Hệ thống tự điều chỉnh lần sau — vui lòng thử lại ngay!`
        });
      }
      return res.status(409).json({
        error: `Dữ liệu bị trùng lặp. Vui lòng thử lại!`
      });
    }

    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// POST /api/labels/import-excel - Import/Restore label batch from Excel file data (ADMIN ONLY)
router.post('/import-excel', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { batchCode, enterpriseId, productId, labelsData, notes } = req.body;
    if (!enterpriseId) {
      return res.status(400).json({ error: 'Thiếu thông tin doanh nghiệp sở hữu' });
    }
    if (!batchCode || !String(batchCode).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập Mã lô tem' });
    }
    if (!Array.isArray(labelsData) || labelsData.length === 0) {
      return res.status(400).json({ error: 'Dữ liệu tem trong file Excel không hợp lệ hoặc rỗng' });
    }

    const cleanBatchCode = String(batchCode).trim();
    const existingBatch = await LabelBatch.findOne({ batchCode: cleanBatchCode });
    if (existingBatch) {
      return res.status(400).json({ error: `Mã lô tem "${cleanBatchCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã lô tem khác!` });
    }

    const serialStart = String(labelsData[0].serialNumber || labelsData[0]['Mã Serial'] || '').trim();
    const serialEnd = String(labelsData[labelsData.length - 1].serialNumber || labelsData[labelsData.length - 1]['Mã Serial'] || '').trim();

    const createdBatch = new LabelBatch({
      enterpriseId,
      productId: productId || null,
      batchCode: cleanBatchCode,
      totalLabels: labelsData.length,
      serialStart,
      serialEnd,
      serialType: 'RANDOM_ALPHANUMERIC',
      status: 'ACTIVE',
      notes: notes || `Lô tem nhập từ file Excel (${labelsData.length} tem)`,
      expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
      createdDate: new Date()
    });
    await createdBatch.save();

    const labels = labelsData.map(item => {
      const serialNumber = String(item.serialNumber || item['Mã Serial'] || '').trim();
      const qrUrl = String(item.qrUrl || item['Link quét'] || item['Link Quét'] || '').trim();
      const match = qrUrl.match(/\/scan\/([a-zA-Z0-9]+)/);
      const qrCode = match ? match[1] : (item.qrCode || generateRandomCode(8).toLowerCase());

      return {
        batchId: createdBatch._id,
        enterpriseId,
        productId: productId || null,
        serialNumber,
        qrCode,
        qrUrl: qrUrl || `${ADMIN_URL}/scan/${qrCode}`,
        status: 'ACTIVE',
        isActive: true
      };
    });

    const CHUNK_SIZE = 5000;
    for (let i = 0; i < labels.length; i += CHUNK_SIZE) {
      await Label.insertMany(labels.slice(i, i + CHUNK_SIZE), { ordered: false });
    }

    const populated = await LabelBatch.findById(createdBatch._id)
      .populate('enterpriseId', 'name')
      .populate('productId', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Import excel labels error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi nhập file Excel: ' + error.message });
  }
});

// PUT /api/labels/batches/:id/status - Toggle status
router.put('/batches/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const batch = await LabelBatch.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('enterpriseId', 'name').populate('productId', 'name');

    if (!batch) return res.status(404).json({ error: 'Không tìm thấy lô tem' });

    // Update all labels in batch
    const labelStatus = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    await Label.updateMany({ batchId: batch._id }, { status: labelStatus, isActive: status === 'ACTIVE' });

    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/labels/batches/:id/map-product - Map batch to product, theme & customDomain
router.post('/batches/:id/map-product', auth, async (req, res) => {
  try {
    const { productId, theme, customDomain } = req.body;
    const updateData = {};
    if (productId !== undefined) {
      const targetProductId = productId || null;
      updateData.productId = targetProductId;
      if (targetProductId) {
        updateData.status = 'ACTIVE';
      }
    }
    if (theme !== undefined) updateData.theme = theme;
    if (customDomain !== undefined) updateData.customDomain = customDomain ? customDomain.trim() : null;

    const batch = await LabelBatch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('enterpriseId', 'name').populate('productId', 'name');

    if (!batch) return res.status(404).json({ error: 'Không tìm thấy lô tem' });

    // Update all labels in batch if productId changed
    if (productId !== undefined) {
      const targetProductId = productId || null;
      const labelUpdate = { productId: targetProductId };
      if (targetProductId) {
        labelUpdate.status = 'ACTIVE';
        labelUpdate.isActive = true;
      }
      await Label.updateMany({ batchId: batch._id }, labelUpdate);
    }

    // Update all labels qrUrl in batch if customDomain is updated/changed
    if (customDomain !== undefined) {
      const cleanDomain = customDomain ? customDomain.trim() : '';
      const labels = await Label.find({ batchId: batch._id });
      
      // Update each label's qrUrl (preserving or generating secret qrCode)
      const bulkOps = labels.map(label => {
        const cleanDomain = customDomain ? customDomain.trim().replace(/\/+$/, '') : '';
        const domainUrl = cleanDomain 
          ? (cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`)
          : ADMIN_URL;
        let secretCode = label.qrCode;
        if (!secretCode) {
          secretCode = generateRandomCode(8).toLowerCase();
        }
        const newQrUrl = `${domainUrl}/scan/${secretCode}`;
        return {
          updateOne: {
            filter: { _id: label._id },
            update: { qrCode: secretCode, qrUrl: newQrUrl }
          }
        };
      });

      if (bulkOps.length > 0) {
        await Label.bulkWrite(bulkOps);
      }
    }

    res.json(batch);
  } catch (error) {
    console.error('Map product/domain error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// PUT /api/labels/batches/:id/renew - Renew batch
router.put('/batches/:id/renew', auth, async (req, res) => {
  try {
    const { months = 12 } = req.body;
    const batch = await LabelBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Không tìm thấy lô tem' });

    const currentExpiry = batch.expiryDate && new Date(batch.expiryDate) > new Date()
      ? new Date(batch.expiryDate) : new Date();
    currentExpiry.setMonth(currentExpiry.getMonth() + parseInt(months));
    
    batch.expiryDate = currentExpiry;
    batch.status = 'ACTIVE';
    await batch.save();

    const populated = await LabelBatch.findById(batch._id)
      .populate('enterpriseId', 'name').populate('productId', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// DELETE /api/labels/batches/:id - Delete batch and all its labels (ADMIN ONLY)
router.delete('/batches/:id', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const batch = await LabelBatch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Không tìm thấy lô tem' });
    await Label.deleteMany({ batchId: req.params.id });
    res.json({ message: 'Đã xóa lô tem và tất cả tem nhãn liên quan thành công' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// POST /api/labels/migrate - Import old labels (ADMIN ONLY)
router.post('/migrate', auth, requireRole('ADMIN'), async (req, res) => {
  let createdBatch = null;
  try {
    const { batchCode, labels: labelData, migrationSource, migrationOldLink, productId, templateId, theme } = req.body;
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;

    if (!batchCode || !String(batchCode).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập Mã lô tem' });
    }

    if (!labelData || !Array.isArray(labelData) || labelData.length === 0) {
      return res.status(400).json({ error: 'Không có dữ liệu tem nhãn nào để di trú' });
    }

    const cleanBatchCode = String(batchCode).trim();
    const existingBatch = await LabelBatch.findOne({ batchCode: cleanBatchCode });
    if (existingBatch) {
      return res.status(400).json({ error: `Mã lô tem "${cleanBatchCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã lô tem khác!` });
    }

    createdBatch = new LabelBatch({
      enterpriseId,
      productId: productId || null,
      templateId: templateId || null,
      theme: theme || 'default',
      batchCode: cleanBatchCode,
      totalLabels: labelData.length,
      serialStart: String(labelData[0]?.serial || labelData[0]?.id || 'MIGRATED-000001'),
      serialEnd: String(labelData[labelData.length - 1]?.serial || labelData[labelData.length - 1]?.id || `MIGRATED-${String(labelData.length).padStart(6, '0')}`),
      status: 'ACTIVE',
      isMigrated: true,
      migrationSource,
      migrationOldLink,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    await createdBatch.save();

    const labels = labelData.map(item => {
      const serial = String(item.serial || item.id);
      return {
        batchId: createdBatch._id,
        enterpriseId,
        productId: productId || null,
        serialNumber: serial,
        qrUrl: item.oldLink || item.qrcode || `${ADMIN_URL}/scan/${serial}`,
        legacyQrCode: item.qrcode || null,
        legacyTemQr: item.temqr || null,
        activeCode: item.activeCode || null,
        smsCode: item.smsCode || null,
        status: 'ACTIVE',
        isActive: true
      };
    });

    await Label.insertMany(labels);

    res.status(201).json({ message: `Di trú thành công ${labels.length} tem`, batch: createdBatch });
  } catch (error) {
    console.error('Migration error:', error);

    // Rollback batch if labels creation failed
    if (createdBatch && createdBatch._id) {
      try {
        await LabelBatch.findByIdAndDelete(createdBatch._id);
        await Label.deleteMany({ batchId: createdBatch._id });
      } catch (cleanupErr) {
        console.error('Rollback migration error:', cleanupErr);
      }
    }

    if (error.code === 11000 || error.name === 'MongoServerError') {
      const keyPattern = error.keyPattern || {};
      if (keyPattern.batchCode) {
        return res.status(400).json({ error: `Mã lô tem "${req.body.batchCode}" đã tồn tại. Vui lòng chọn mã lô tem khác!` });
      }
      if (keyPattern.serialNumber) {
        return res.status(400).json({ error: `Một số mã Serial/ID trong file đã tồn tại trên hệ thống. Vui lòng kiểm tra lại dữ liệu di trú!` });
      }
      return res.status(400).json({ error: `Dữ liệu di trú bị trùng lặp mã lô hoặc mã serial. Vui lòng kiểm tra lại!` });
    }

    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// ======= INDIVIDUAL LABEL ROUTES =======

// GET /api/labels
router.get('/', auth, requireOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 50, batchId = '', status = '', search = '' } = req.query;
    const query = req.enterpriseFilter || {};
    if (batchId) query.batchId = batchId;
    if (status) query.status = status;
    if (search) {
      query.serialNumber = { $regex: search, $options: 'i' };
    }

    let total = await Label.countDocuments(query);

    // Auto-repair orphan non-migrated batch if no labels were found in DB
    if (total === 0 && batchId) {
      try {
        const batch = await LabelBatch.findById(batchId);
        if (batch && !batch.isMigrated && batch.totalLabels > 0) {
          const numPrefix = batch.prefix || '100';
          const rawDomain = batch.customDomain ? batch.customDomain.trim().replace(/\/+$/, '') : '';
          const domainUrl = rawDomain 
            ? (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`)
            : ADMIN_URL;

          let serialsToRepair = [];
          if (batch.serialStart && batch.serialEnd && batch.serialStart === batch.serialEnd) {
            serialsToRepair.push(batch.serialStart);
          } else if (batch.serialStart && batch.serialEnd) {
            const sMatch = batch.serialStart.match(/^(\D*?)(\d+)$/);
            const eMatch = batch.serialEnd.match(/^(\D*?)(\d+)$/);
            if (sMatch && eMatch && sMatch[1] === eMatch[1]) {
              const pStr = sMatch[1];
              const sN = parseInt(sMatch[2], 10);
              const eN = parseInt(eMatch[2], 10);
              const padL = sMatch[2].length;
              for (let i = sN; i <= eN; i++) {
                serialsToRepair.push(`${pStr}${String(i).padStart(padL, '0')}`);
              }
            }
          }
          if (serialsToRepair.length === 0) {
            for (let i = 1; i <= batch.totalLabels; i++) {
              serialsToRepair.push(`${numPrefix}${String(i).padStart(6, '0')}`);
            }
          }

          const newLabels = serialsToRepair.map(serial => {
            const secretCode = generateRandomCode(8).toLowerCase();
            return {
              batchId: batch._id,
              enterpriseId: batch.enterpriseId,
              productId: batch.productId || null,
              serialNumber: serial,
              qrCode: secretCode,
              qrUrl: `${domainUrl}/scan/${secretCode}`,
              status: batch.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
              isActive: batch.status === 'ACTIVE'
            };
          });
          
          for (let i = 0; i < newLabels.length; i += 1000) {
            await Label.insertMany(newLabels.slice(i, i + 1000), { ordered: false });
          }
          total = await Label.countDocuments(query);
        }
      } catch (repairErr) {
        console.error('Auto-repair batch labels error:', repairErr);
      }
    }

    const labels = await Label.find(query)
      .populate('productId', 'name')
      .populate('batchId', 'batchCode')
      .sort({ serialNumber: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      data: labels,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/labels/:id/map - Map individual label to product/distributor
router.put('/:id/map', auth, async (req, res) => {
  try {
    const { productId, distributorName, distributorAddress } = req.body;
    const label = await Label.findByIdAndUpdate(
      req.params.id,
      { productId, distributorName, distributorAddress },
      { new: true }
    ).populate('productId', 'name').populate('batchId', 'batchCode');

    if (!label) return res.status(404).json({ error: 'Không tìm thấy tem' });
    res.json(label);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/labels/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const label = await Label.findByIdAndUpdate(
      req.params.id,
      { status, isActive: status === 'ACTIVE' },
      { new: true }
    );
    if (!label) return res.status(404).json({ error: 'Không tìm thấy tem' });
    res.json(label);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/labels/bulk-map - Bulk map a range of serials in a batch to a product/distributor
router.post('/bulk-map', auth, async (req, res) => {
  try {
    const { batchId, serialStart, serialEnd, productId, distributorName, distributorAddress } = req.body;
    
    if (!batchId || !serialStart || !serialEnd) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (Lô tem, Serial bắt đầu, Serial kết thúc)' });
    }

    // Check if batch exists
    const batch = await LabelBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Không tìm thấy lô tem' });
    }

    // Range query using lexicographical range comparison
    const query = {
      batchId,
      serialNumber: { $gte: serialStart, $lte: serialEnd }
    };

    const updateData = {};
    if (productId !== undefined) updateData.productId = productId || null;
    if (distributorName !== undefined) updateData.distributorName = distributorName || null;
    if (distributorAddress !== undefined) updateData.distributorAddress = distributorAddress || null;

    // We can also activate them automatically if a product is mapped
    if (productId) {
      updateData.status = 'ACTIVE';
      updateData.isActive = true;
    }

    const result = await Label.updateMany(query, updateData);

    // If productId was changed, set it as default if not set, and auto-activate the batch status to ACTIVE
    if (productId) {
      if (!batch.productId) {
        batch.productId = productId;
      }
      if (batch.status === 'INACTIVE') {
        batch.status = 'ACTIVE';
      }
      await batch.save();
    }

    res.json({
      message: `Đã cập nhật thành công ${result.modifiedCount} tem nhãn.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk map error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// POST /api/labels/fix-encryption - Backfill secret qrCode and encrypted qrUrl for labels
router.post('/fix-encryption', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { batchId } = req.body || {};
    const query = {};
    if (batchId) query.batchId = batchId;

    const labels = await Label.find(query);
    let updatedCount = 0;
    const bulkOps = [];

    const batchesCache = {};

    for (const label of labels) {
      let needUpdate = false;
      let secretCode = label.qrCode;

      if (!secretCode) {
        secretCode = generateRandomCode(8).toLowerCase();
        needUpdate = true;
      }

      let currentUrl = label.qrUrl || '';
      if (!currentUrl || currentUrl.includes(`/scan/${label.serialNumber}`) || currentUrl.includes('tem-admin-eight.vercel.app') || currentUrl.startsWith('http://')) {
        if (!batchesCache[label.batchId]) {
          batchesCache[label.batchId] = await LabelBatch.findById(label.batchId);
        }
        const batch = batchesCache[label.batchId];
        const rawDomain = (batch && batch.customDomain) ? batch.customDomain.trim().replace(/\/+$/, '') : '';
        const domainUrl = rawDomain 
          ? (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`)
          : ADMIN_URL;
        currentUrl = `${domainUrl}/scan/${secretCode}`;
        needUpdate = true;
      }

      if (needUpdate) {
        bulkOps.push({
          updateOne: {
            filter: { _id: label._id },
            update: { qrCode: secretCode, qrUrl: currentUrl }
          }
        });
        updatedCount++;
      }
    }

    if (bulkOps.length > 0) {
      const CHUNK = 5000;
      for (let i = 0; i < bulkOps.length; i += CHUNK) {
        await Label.bulkWrite(bulkOps.slice(i, i + CHUNK));
      }
    }

    res.json({
      message: `Đã mã hóa bảo mật thành công cho ${updatedCount}/${labels.length} tem!`,
      updatedCount,
      totalChecked: labels.length
    });
  } catch (error) {
    console.error('Fix encryption error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi mã hóa tem: ' + error.message });
  }
});

module.exports = router;
