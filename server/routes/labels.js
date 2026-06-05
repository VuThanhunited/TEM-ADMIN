const express = require('express');
const LabelBatch = require('../models/LabelBatch');
const Label = require('../models/Label');
const auth = require('../middleware/auth');
const { requireOwnership } = require('../middleware/rbac');

const router = express.Router();
const ADMIN_URL = process.env.ADMIN_URL || 'https://tem-admin-ten.vercel.app';

// ======= BATCH ROUTES =======

// GET /api/labels/batches
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

// POST /api/labels/batches - Create batch and individual labels
router.post('/batches', auth, requireOwnership, async (req, res) => {
  try {
    const { batchCode, totalLabels, prefix = 'TEM', productId, templateId, expiryDate, notes } = req.body;
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;

    const startNum = 1;
    const endNum = totalLabels;
    const serialStart = `${prefix}-${String(startNum).padStart(6, '0')}`;
    const serialEnd = `${prefix}-${String(endNum).padStart(6, '0')}`;

    const batch = new LabelBatch({
      enterpriseId,
      productId: productId || null,
      templateId: templateId || null,
      batchCode,
      totalLabels,
      serialStart,
      serialEnd,
      prefix,
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      notes
    });
    await batch.save();

    // Create individual labels
    const labels = [];
    for (let i = startNum; i <= endNum; i++) {
      labels.push({
        batchId: batch._id,
        enterpriseId,
        productId: productId || null,
        serialNumber: `${prefix}-${String(i).padStart(6, '0')}`,
        qrUrl: `${ADMIN_URL}/scan/${prefix}-${String(i).padStart(6, '0')}`,
        status: 'INACTIVE'
      });
    }
    
    // Batch insert (in chunks of 1000)
    for (let i = 0; i < labels.length; i += 1000) {
      await Label.insertMany(labels.slice(i, i + 1000));
    }

    const populated = await LabelBatch.findById(batch._id)
      .populate('enterpriseId', 'name')
      .populate('productId', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create batch error:', error);
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

// POST /api/labels/batches/:id/map-product - Map batch to product
router.post('/batches/:id/map-product', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const batch = await LabelBatch.findByIdAndUpdate(
      req.params.id,
      { productId },
      { new: true }
    ).populate('enterpriseId', 'name').populate('productId', 'name');

    if (!batch) return res.status(404).json({ error: 'Không tìm thấy lô tem' });

    // Update all labels in batch
    await Label.updateMany({ batchId: batch._id }, { productId });

    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
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

// POST /api/labels/migrate - Import old labels
router.post('/migrate', auth, requireOwnership, async (req, res) => {
  try {
    const { batchCode, labels: labelData, migrationSource, migrationOldLink, productId, templateId } = req.body;
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;

    const batch = new LabelBatch({
      enterpriseId,
      productId: productId || null,
      templateId: templateId || null,
      batchCode,
      totalLabels: labelData.length,
      serialStart: String(labelData[0]?.serial || labelData[0]?.id || 'MIGRATED-000001'),
      serialEnd: String(labelData[labelData.length - 1]?.serial || labelData[labelData.length - 1]?.id || `MIGRATED-${String(labelData.length).padStart(6, '0')}`),
      status: 'ACTIVE',
      isMigrated: true,
      migrationSource,
      migrationOldLink,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    await batch.save();

    const labels = labelData.map(item => {
      const serial = String(item.serial || item.id);
      return {
        batchId: batch._id,
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

    res.status(201).json({ message: `Di trú thành công ${labels.length} tem`, batch });
  } catch (error) {
    console.error('Migration error:', error);
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

    const total = await Label.countDocuments(query);
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

    // If productId was changed and batch doesn't have a product yet, set it as default
    if (productId && !batch.productId) {
      batch.productId = productId;
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
