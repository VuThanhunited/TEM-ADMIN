const express = require('express');
const router = express.Router();
const Label = require('../models/Label');
const LabelBatch = require('../models/LabelBatch');
const Product = require('../models/Product');
const Enterprise = require('../models/Enterprise');
const Template = require('../models/Template');
const ScanLog = require('../models/ScanLog');

// GET /api/public/scan/:serial
router.get('/scan/:serial', async (req, res) => {
  try {
    const { serial } = req.params;

    // Find the label by serialNumber, legacy QR, legacy TEMQR suffix, activeCode, or smsCode
    const label = await Label.findOne({
      $or: [
        { serialNumber: serial },
        { legacyQrCode: { $regex: new RegExp(serial + '$', 'i') } },
        { legacyTemQr: { $regex: new RegExp(serial + '$', 'i') } },
        { activeCode: serial },
        { smsCode: serial }
      ]
    })
      .populate('productId')
      .populate('enterpriseId');

    if (!label) {
      return res.status(404).json({ error: 'Không tìm thấy tem nhãn này trên hệ thống!' });
    }

    // Find the batch
    const batch = await LabelBatch.findById(label.batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Không tìm thấy lô tem tương ứng!' });
    }

    // Check if the batch/label is active
    if (batch.status === 'INACTIVE' || !label.isActive) {
      return res.status(400).json({ error: 'Tem này chưa được kích hoạt hoặc đã bị khóa!' });
    }

    // Check expiry of the batch
    if (batch.expiryDate && new Date() > new Date(batch.expiryDate)) {
      return res.status(400).json({ error: 'Lô tem này đã hết hạn sử dụng!' });
    }

    // Check enterprise status & subscription
    const enterprise = label.enterpriseId;
    if (!enterprise || !enterprise.isActive) {
      return res.status(400).json({ error: 'Doanh nghiệp sở hữu tem hiện đang tạm khóa hoặc không tồn tại!' });
    }

    if (enterprise.subscriptionExpiry && new Date() > new Date(enterprise.subscriptionExpiry)) {
      return res.status(400).json({ error: 'Dịch vụ của doanh nghiệp sở hữu tem đã hết hạn!' });
    }

    // Find the template (use batch custom template, fallback to default enterprise template)
    let template = null;
    if (batch.templateId) {
      template = await Template.findById(batch.templateId);
    }
    if (!template) {
      template = await Template.findOne({ enterpriseId: enterprise._id, isDefault: true });
    }
    if (!template) {
      template = await Template.findOne({ enterpriseId: enterprise._id });
    }
    
    // Fallback template if none exists
    if (!template) {
      template = {
        primaryColor: '#6366f1',
        secondaryColor: '#4f46e5',
        backgroundColor: '#0f172a',
        textColor: '#f8fafc',
        layout: 'default',
        showVerificationBadge: true,
        showProductInfo: true,
        showDistributorInfo: true,
        showScanCount: true
      };
    }

    // Determine device type from User-Agent
    const userAgent = req.headers['user-agent'] || '';
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    // Geolocation mock inside Vietnam
    const cities = [
      'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
      'Biên Hòa', 'Nha Trang', 'Huế', 'Vũng Tàu', 'Đà Lạt'
    ];
    const selectedCity = cities[Math.floor(Math.random() * cities.length)];
    const coords = {
      'TP. Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
      'Hà Nội': { lat: 21.0285, lng: 105.8542 },
      'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
      'Cần Thơ': { lat: 10.0452, lng: 105.7469 },
      'Hải Phòng': { lat: 20.8449, lng: 106.6881 },
      'Biên Hòa': { lat: 10.9574, lng: 106.8429 },
      'Nha Trang': { lat: 12.2388, lng: 109.1967 },
      'Huế': { lat: 16.4637, lng: 107.5909 },
      'Vũng Tàu': { lat: 10.3460, lng: 107.0843 },
      'Đà Lạt': { lat: 11.9404, lng: 108.4583 }
    };
    const cityCoord = coords[selectedCity];

    // Increment scan counts
    const isFirstScan = !label.lastScannedAt;
    const firstScanTime = label.lastScannedAt || new Date();

    label.scanCount = (label.scanCount || 0) + 1;
    label.status = 'SCANNED';
    label.lastScannedAt = new Date();
    await label.save();

    batch.scannedCount = (batch.scannedCount || 0) + 1;
    if (batch.status === 'ACTIVE' && batch.activatedCount === 0) {
      batch.activatedCount = 1;
    }
    await batch.save();

    // Create ScanLog entry
    await ScanLog.create({
      labelId: label._id,
      enterpriseId: enterprise._id,
      productId: label.productId?._id,
      serialNumber: label.serialNumber,
      location: {
        lat: cityCoord.lat + (Math.random() - 0.5) * 0.1,
        lng: cityCoord.lng + (Math.random() - 0.5) * 0.1,
        city: selectedCity,
        country: 'Vietnam'
      },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      deviceType,
      scannedAt: new Date()
    });

    res.json({
      label,
      product: label.productId,
      enterprise,
      template,
      isFirstScan,
      firstScanTime
    });

  } catch (error) {
    console.error('Scan API error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xử lý thông tin quét tem' });
  }
});

// POST /api/public/scan/:serial/location - Update scan log with precise GPS coordinates
router.post('/scan/:serial/location', async (req, res) => {
  try {
    const { serial } = req.params;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Thiếu vĩ độ hoặc kinh độ' });
    }

    // Find the latest ScanLog for this serial number created in the last 15 seconds (to cover slow GPS responses)
    const fifteenSecondsAgo = new Date(Date.now() - 15000);
    const scanLog = await ScanLog.findOne({
      serialNumber: serial,
      scannedAt: { $gte: fifteenSecondsAgo }
    }).sort({ scannedAt: -1 });

    if (scanLog) {
      scanLog.location.lat = parseFloat(lat);
      scanLog.location.lng = parseFloat(lng);
      await scanLog.save();
      return res.json({ success: true, message: 'Đã cập nhật tọa độ chính xác GPS' });
    }

    res.status(404).json({ error: 'Không tìm thấy lượt quét gần đây tương ứng' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật vị trí' });
  }
});

module.exports = router;
