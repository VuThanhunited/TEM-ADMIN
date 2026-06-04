const express = require('express');
const LabelBatch = require('../models/LabelBatch');
const Label = require('../models/Label');
const ScanLog = require('../models/ScanLog');
const Product = require('../models/Product');
const Enterprise = require('../models/Enterprise');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireOwnership } = require('../middleware/rbac');

const router = express.Router();

// GET /api/analytics/overview - Dashboard overview stats
router.get('/overview', auth, requireOwnership, async (req, res) => {
  try {
    const filter = req.enterpriseFilter || {};

    const [totalLabels, activeLabels, totalScans, totalProducts, totalBatches] = await Promise.all([
      Label.countDocuments(filter),
      Label.countDocuments({ ...filter, status: 'ACTIVE' }),
      ScanLog.countDocuments(filter),
      Product.countDocuments(filter),
      LabelBatch.countDocuments(filter)
    ]);

    // Get scans in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentScans = await ScanLog.countDocuments({
      ...filter,
      scannedAt: { $gte: thirtyDaysAgo }
    });

    // Get scans in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyScans = await ScanLog.countDocuments({
      ...filter,
      scannedAt: { $gte: sevenDaysAgo }
    });

    // Admin-only stats
    let totalEnterprises = 0;
    let totalUsers = 0;
    if (req.user.role === 'ADMIN') {
      totalEnterprises = await Enterprise.countDocuments();
      totalUsers = await User.countDocuments({ role: { $in: ['NSX', 'NPP'] } });
    }

    res.json({
      totalLabels,
      activeLabels,
      inactiveLabels: totalLabels - activeLabels,
      totalScans,
      recentScans,
      weeklyScans,
      totalProducts,
      totalBatches,
      totalEnterprises,
      totalUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/analytics/scans - Scan history
router.get('/scans', auth, requireOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const query = req.enterpriseFilter || {};

    if (startDate || endDate) {
      query.scannedAt = {};
      if (startDate) query.scannedAt.$gte = new Date(startDate);
      if (endDate) query.scannedAt.$lte = new Date(endDate);
    }

    const total = await ScanLog.countDocuments(query);
    const scans = await ScanLog.find(query)
      .populate('labelId', 'serialNumber')
      .populate('productId', 'name')
      .sort({ scannedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      data: scans,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/analytics/scan-locations - Scan locations for map
router.get('/scan-locations', auth, requireOwnership, async (req, res) => {
  try {
    const filter = req.enterpriseFilter || {};
    const locations = await ScanLog.find({
      ...filter,
      'location.lat': { $ne: null },
      'location.lng': { $ne: null }
    })
    .select('location scannedAt serialNumber')
    .sort({ scannedAt: -1 })
    .limit(500);

    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/analytics/charts - Chart data
router.get('/charts', auth, requireOwnership, async (req, res) => {
  try {
    const filter = req.enterpriseFilter || {};
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Scans per day (last 30 days)
    const dailyScans = await ScanLog.aggregate([
      { $match: { ...filter, scannedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Scans by city
    const scansByCity = await ScanLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Scans by device type
    const scansByDevice = await ScanLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Labels by status
    const labelsByStatus = await Label.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      dailyScans,
      scansByCity,
      scansByDevice,
      labelsByStatus
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
