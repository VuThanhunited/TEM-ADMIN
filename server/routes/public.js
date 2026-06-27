const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Label = require('../models/Label');
const LabelBatch = require('../models/LabelBatch');
const Product = require('../models/Product');
const Enterprise = require('../models/Enterprise');
const Template = require('../models/Template');
const ScanLog = require('../models/ScanLog');
const User = require('../models/User');

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

    let responseTheme = batch.theme || 'default';
    if (responseTheme === 'default' && label.productId) {
      const cat = (label.productId.category || '').toLowerCase().trim();
      
      const agriKeywords = [
        'nông nghiệp', 'nông sản', 'trồng trọt', 'chăn nuôi', 'thủy sản', 
        'hải sản', 'lâm sản', 'trái cây', 'rau củ', 'hoa quả', 'gạo', 
        'sâm', 'chè', 'agri'
      ];
      
      const foodKeywords = [
        'thực phẩm', 'gia vị', 'dầu ăn', 'nước uống', 'nước ngọt', 
        'nước đóng chai', 'nước ép', 'nước khoáng', 'bia', 'rượu', 
        'bánh kẹo', 'bánh', 'kẹo', 'sữa', 'ăn uống', 'dinh dưỡng', 
        'trà', 'cà phê', 'mật ong', 'yến sào', 'mật', 'mứt', 'food', 
        'beverage', 'snack', 'candy', 'milk'
      ];

      const isAgri = agriKeywords.some(keyword => cat.includes(keyword));
      const isFood = foodKeywords.some(keyword => cat.includes(keyword));

      if (isAgri) {
        responseTheme = 'agriculture';
      } else if (isFood) {
        responseTheme = 'functional_food';
      }
    }

    res.json({
      label,
      product: label.productId,
      enterprise,
      template,
      isFirstScan,
      firstScanTime,
      theme: responseTheme
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

// GET /api/public/distributors/:enterpriseId - Get list of NPP accounts for an enterprise
router.get('/distributors/:enterpriseId', async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const distributors = await User.find({
      enterpriseId,
      role: 'NPP',
      isActive: true
    }).select('fullName username _id');

    // Also include enterprise name as option
    const enterprise = await Enterprise.findById(enterpriseId).select('name');

    res.json({
      distributors,
      enterpriseName: enterprise?.name || ''
    });
  } catch (error) {
    console.error('Get distributors error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách nhà phân phối' });
  }
});

// POST /api/public/npp-login - NPP login from user-facing scan page
router.post('/npp-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      role: 'NPP'
    }).populate('enterpriseId');

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản NPP không tồn tại hoặc không hợp lệ' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    if (user.subscriptionExpiry && new Date() > new Date(user.subscriptionExpiry)) {
      return res.status(403).json({ error: 'Tài khoản đã hết hạn. Vui lòng liên hệ Admin để gia hạn.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: '7d' }
    );

    const userData = user.toObject();
    delete userData.password;

    res.json({ token, user: userData });
  } catch (error) {
    console.error('NPP login error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập' });
  }
});

// POST /api/public/distributor-entry - NPP submits serial range distribution data
router.post('/distributor-entry', async (req, res) => {
  try {
    // Verify JWT token from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập để thực hiện chức năng này' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure');
    } catch {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' });
    }

    // Verify user is NPP
    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user || user.role !== 'NPP') {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được nhập dữ liệu phân phối' });
    }

    const { batchId, serialStart, serialEnd, distributorName, distributorAddress } = req.body;

    if (!batchId || !serialStart || !serialEnd) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: Lô tem, Serial bắt đầu, Serial kết thúc' });
    }

    // Check batch belongs to same enterprise
    const batch = await LabelBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Không tìm thấy lô tem' });
    }

    // Find labels in range
    const query = {
      batchId,
      serialNumber: { $gte: serialStart, $lte: serialEnd }
    };

    const totalInRange = await Label.countDocuments(query);
    if (totalInRange === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tem nào trong khoảng serial này' });
    }

    const updateData = {
      distributorName: distributorName || user.fullName || user.username,
      distributorAddress: distributorAddress || user.enterpriseId?.address || ''
    };

    const result = await Label.updateMany(query, updateData);

    res.json({
      success: true,
      message: `Đã cập nhật thành công ${result.modifiedCount} tem nhãn cho nhà phân phối.`,
      modifiedCount: result.modifiedCount,
      serialStart,
      serialEnd,
      distributorName: updateData.distributorName
    });
  } catch (error) {
    console.error('Distributor entry error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi nhập dữ liệu phân phối' });
  }
});

// GET /api/public/npp-stores - Get list of distributor stores for the logged-in NPP
router.get('/npp-stores', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure');
    } catch {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user || user.role !== 'NPP') {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được truy cập' });
    }

    // Get all NPP accounts in the same enterprise as distribution points
    const enterpriseId = user.enterpriseId?._id || user.enterpriseId;
    const stores = await User.find({
      enterpriseId,
      role: 'NPP',
      isActive: true
    }).select('fullName username address _id');

    res.json({
      stores: stores.map(s => ({
        id: s._id,
        name: s.fullName || s.username,
        address: s.address || ''
      })),
      enterpriseName: user.enterpriseId?.name || ''
    });
  } catch (error) {
    console.error('Get NPP stores error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách điểm bán' });
  }
});

// POST /api/public/distributor-entry-single - NPP records single item at a store
router.post('/distributor-entry-single', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập để thực hiện chức năng này' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure');
    } catch {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user || user.role !== 'NPP') {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được nhập dữ liệu phân phối' });
    }

    const { serialNumber, distributorName, distributorAddress } = req.body;

    if (!serialNumber) {
      return res.status(400).json({ error: 'Thiếu mã serial sản phẩm' });
    }

    // Find the label
    const label = await Label.findOne({
      $or: [
        { serialNumber },
        { legacyQrCode: { $regex: new RegExp(serialNumber + '$', 'i') } },
        { activeCode: serialNumber }
      ]
    });

    if (!label) {
      return res.status(404).json({ error: 'Không tìm thấy tem nhãn với serial này' });
    }

    // Update the label
    label.distributorName = distributorName || user.fullName || user.username;
    label.distributorAddress = distributorAddress || user.enterpriseId?.address || '';
    await label.save();

    // Get total count for this store
    const totalForStore = await Label.countDocuments({
      enterpriseId: label.enterpriseId,
      distributorName: label.distributorName
    });

    res.json({
      success: true,
      message: 'Đã nhập hàng thành công.',
      serialNumber: label.serialNumber,
      distributorName: label.distributorName,
      totalForStore
    });
  } catch (error) {
    console.error('Distributor entry single error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi nhập dữ liệu phân phối' });
  }
});

module.exports = router;

