const express = require('express');
const LabelBatch = require('../models/LabelBatch');
const Label = require('../models/Label');
const auth = require('../middleware/auth');
const { requireRole, requireOwnership } = require('../middleware/rbac');

const router = express.Router();
const ADMIN_URL = process.env.ADMIN_URL || 'https://tem-admin-eight.vercel.app';

// ======= BATCH ROUTES =======

// GET /api/labels/batches
// Allow reading batches, but only ADMIN creates them
router.get('/batches', auth, requireOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', search = '' } = req.query;
    const query = req.enterpriseFilter || {};
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

    res.json({
      data: batches,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/labels/batches - Create batch and individual labels (ADMIN ONLY)
router.post('/batches', auth, requireRole('ADMIN'), async (req, res) => {
  let createdBatch = null;
  try {
    const { batchCode, totalLabels, prefix = '100', productId, templateId, theme, expiryDate, notes, customDomain } = req.body;
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;

    if (!enterpriseId) {
      return res.status(400).json({ error: 'Thiếu thông tin doanh nghiệp sở hữu' });
    }

    if (!batchCode || !String(batchCode).trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập Mã lô tem' });
    }

    const cleanBatchCode = String(batchCode).trim();

    // Check if batchCode already exists
    const existingBatch = await LabelBatch.findOne({ batchCode: cleanBatchCode });
    if (existingBatch) {
      return res.status(400).json({ error: `Mã lô tem "${cleanBatchCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã lô tem khác!` });
    }

    // Enforce digit-only prefix
    const numPrefix = String(prefix || '100').trim();
    if (!/^\d+$/.test(numPrefix)) {
      return res.status(400).json({ error: 'Mã Prefix Serial chỉ được phép chứa chữ số (0-9) để hỗ trợ mã hoá số!' });
    }

    const startNum = 1;
    const endNum = parseInt(totalLabels) || 100;
    const serialStart = `${numPrefix}${String(startNum).padStart(6, '0')}`;
    const serialEnd = `${numPrefix}${String(endNum).padStart(6, '0')}`;

    // Check if first serial already exists
    const existingLabel = await Label.findOne({ serialNumber: serialStart });
    if (existingLabel) {
      return res.status(400).json({ error: `Dải mã Serial với Prefix "${numPrefix}" (${serialStart}...) đã tồn tại trên hệ thống. Vui lòng thay đổi mã Prefix khác!` });
    }

    createdBatch = new LabelBatch({
      enterpriseId,
      productId: productId || null,
      templateId: templateId || null,
      theme: theme || 'default',
      customDomain: customDomain || null,
      batchCode: cleanBatchCode,
      totalLabels: endNum,
      serialStart,
      serialEnd,
      prefix: numPrefix,
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      notes,
      createdDate: new Date(),
      status: productId ? 'ACTIVE' : 'INACTIVE'
    });
    await createdBatch.save();

    // Create individual labels
    const labels = [];
    const domainUrl = customDomain 
      ? (customDomain.trim().startsWith('http') ? customDomain.trim() : `http://${customDomain.trim()}`)
      : ADMIN_URL;

    for (let i = startNum; i <= endNum; i++) {
      const serial = `${numPrefix}${String(i).padStart(6, '0')}`;
      labels.push({
        batchId: createdBatch._id,
        enterpriseId,
        productId: productId || null,
        serialNumber: serial,
        qrUrl: `${domainUrl}/scan/${serial}`,
        status: productId ? 'ACTIVE' : 'INACTIVE',
        isActive: !!productId
      });
    }
    
    // Batch insert (in chunks of 1000)
    for (let i = 0; i < labels.length; i += 1000) {
      await Label.insertMany(labels.slice(i, i + 1000));
    }

    const populated = await LabelBatch.findById(createdBatch._id)
      .populate('enterpriseId', 'name')
      .populate('productId', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create batch error:', error);

    // Rollback batch if labels creation failed
    if (createdBatch && createdBatch._id) {
      try {
        await LabelBatch.findByIdAndDelete(createdBatch._id);
        await Label.deleteMany({ batchId: createdBatch._id });
      } catch (cleanupErr) {
        console.error('Rollback batch error:', cleanupErr);
      }
    }

    if (error.code === 11000 || error.name === 'MongoServerError') {
      const keyPattern = error.keyPattern || {};
      if (keyPattern.batchCode) {
        return res.status(400).json({ error: `Mã lô tem "${req.body.batchCode}" đã tồn tại. Vui lòng nhập mã lô tem khác!` });
      }
      if (keyPattern.serialNumber) {
        return res.status(400).json({ error: `Mã Serial bị trùng lặp với dữ liệu tem nhãn đã có. Vui lòng đổi mã Prefix khác!` });
      }
      return res.status(400).json({ error: `Dữ liệu bị trùng lặp trên hệ thống (mã lô hoặc serial). Vui lòng thử lại với thông tin khác!` });
    }

    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
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
    if (productId !== undefined) updateData.productId = productId || null;
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
      await Label.updateMany({ batchId: batch._id }, { productId });
    }

    // Update all labels qrUrl in batch if customDomain is updated/changed
    if (customDomain !== undefined) {
      const cleanDomain = customDomain ? customDomain.trim() : '';
      const labels = await Label.find({ batchId: batch._id });
      
      // Update each label's qrUrl
      const bulkOps = labels.map(label => {
        const domainUrl = cleanDomain 
          ? (cleanDomain.startsWith('http') ? cleanDomain : `http://${cleanDomain}`)
          : ADMIN_URL;
        const newQrUrl = `${domainUrl}/scan/${label.serialNumber}`;
        return {
          updateOne: {
            filter: { _id: label._id },
            update: { qrUrl: newQrUrl }
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
          const domainUrl = batch.customDomain 
            ? (batch.customDomain.trim().startsWith('http') ? batch.customDomain.trim() : `http://${batch.customDomain.trim()}`)
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

          const newLabels = serialsToRepair.map(serial => ({
            batchId: batch._id,
            enterpriseId: batch.enterpriseId,
            productId: batch.productId || null,
            serialNumber: serial,
            qrUrl: `${domainUrl}/scan/${serial}`,
            status: batch.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            isActive: batch.status === 'ACTIVE'
          }));
          
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

module.exports = router;
