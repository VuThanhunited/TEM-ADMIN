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

    // Tìm tài khoản NPP hoặc ADMIN
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      role: { $in: ['NPP', 'ADMIN'] }
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

    // Kiểm tra hạn sử dụng (không áp dụng với ADMIN)
    if (user.role !== 'ADMIN' && user.subscriptionExpiry && new Date() > new Date(user.subscriptionExpiry)) {
      return res.status(403).json({ error: 'Tài khoản đã hết hạn. Vui lòng liên hệ Admin để gia hạn.' });
    }

    // Admin đăng nhập vào tab NPP: tạo token với role NPP để dùng tính năng scan
    const tokenRole = user.role === 'ADMIN' ? 'NPP' : user.role;
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: tokenRole,
        isAdminImpersonating: user.role === 'ADMIN'
      },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: user.role === 'ADMIN' ? '8h' : '7d' }
    );

    const userData = user.toObject();
    delete userData.password;
    // Trả về role NPP để frontend xử lý đúng
    userData.role = tokenRole;
    if (user.role === 'ADMIN') {
      userData.isAdminImpersonating = true;
    }

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

    // Cho phép NPP hoặc Admin đang impersonate NPP
    if (decoded.role !== 'NPP') {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được nhập dữ liệu phân phối' });
    }

    // Verify user exists in DB
    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
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

    // Cho phép NPP hoặc Admin đang impersonate NPP
    if (decoded.role !== 'NPP') {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được truy cập' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    // Admin impersonating: trả về thông tin admin như một NPP store
    const stores = [user];

    res.json({
      stores: stores.map(s => ({
        id: s._id,
        name: (decoded.isAdminImpersonating ? 'Admin - ' : '') + (s.fullName || s.username),
        address: s.address || ''
      })),
      enterpriseName: decoded.isAdminImpersonating ? 'Quản trị viên' : (user.enterpriseId?.name || '')
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

    // Cho phép NPP hoặc Admin đang impersonate NPP
    if (decoded.role !== 'NPP') {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được nhập dữ liệu phân phối' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
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

// GET /api/public/npp-scan-history - Get scan/distribution history for the logged-in NPP
router.get('/npp-scan-history', async (req, res) => {
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

    // Cho phép NPP hoặc Admin đang impersonate NPP
    if (decoded.role !== 'NPP') {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được truy cập' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const enterpriseId = user.enterpriseId?._id || user.enterpriseId;
    
    // Find labels distributed by this enterprise (NPP)
    const labels = await Label.find({
      enterpriseId,
      distributorName: { $ne: null }
    })
      .populate('productId')
      .sort({ updatedAt: -1 })
      .limit(50);

    const historyList = labels.map(l => ({
      productName: l.productId?.name || 'Sản phẩm',
      serial: l.serialNumber,
      storeName: l.distributorName,
      time: l.updatedAt
    }));

    res.json({ history: historyList });
  } catch (error) {
    console.error('Get NPP scan history error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy lịch sử quét' });
  }
});

// GET /api/public/enterprises - Get list of active enterprises (manufacturers)
router.get('/enterprises', async (req, res) => {
  try {
    const enterprises = await Enterprise.find({
      type: 'NSX',
      isActive: true
    }).select('name _id');
    res.json(enterprises);
  } catch (error) {
    console.error('Get enterprises error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách doanh nghiệp' });
  }
});

// POST /api/public/npp-register - Register a new NPP account
router.post('/npp-register', async (req, res) => {
  try {
    const { username, email, password, fullName, address, enterpriseId } = req.body;

    if (!username || !email || !password || !fullName || !enterpriseId) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    // Check existing user case-insensitively
    const existing = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }
      ]
    });
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });
    }

    // Get enterprise to copy subscriptionExpiry
    const enterprise = await Enterprise.findById(enterpriseId);
    if (!enterprise) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp liên kết' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      fullName: fullName.trim(),
      address: address ? address.trim() : '',
      role: 'NPP',
      enterpriseId,
      subscriptionExpiry: enterprise.subscriptionExpiry,
      isActive: true
    });
    await user.save();

    // Auto-login after registration: generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: '7d' }
    );

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('NPP register error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký tài khoản' });
  }
});

// POST /api/public/guest-register - Register a new Guest (Consumer) account
router.post('/guest-register', async (req, res) => {
  try {
    const { username, email, password, fullName, address } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    const existing = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }
      ]
    });
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      fullName: fullName.trim(),
      address: address ? address.trim() : '',
      role: 'GUEST',
      isActive: true
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: '7d' }
    );

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Guest register error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký tài khoản' });
  }
});

// POST /api/public/guest-login - Guest (Consumer) login
router.post('/guest-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    // Tìm tài khoản GUEST hoặc ADMIN
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      role: { $in: ['GUEST', 'ADMIN'] }
    });

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản người dùng không tồn tại' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Admin đăng nhập vào tab Khách hàng: tạo token với role GUEST
    const tokenRole = user.role === 'ADMIN' ? 'GUEST' : user.role;
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: tokenRole,
        isAdminImpersonating: user.role === 'ADMIN'
      },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: user.role === 'ADMIN' ? '8h' : '7d' }
    );

    const userData = user.toObject();
    delete userData.password;
    userData.role = tokenRole;
    if (user.role === 'ADMIN') {
      userData.isAdminImpersonating = true;
    }

    res.json({ token, user: userData });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập' });
  }
});

// GET /api/public/barcode/:barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ barcode }).populate('enterpriseId');
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm nào có mã vạch này trên hệ thống!' });
    }

    const enterprise = product.enterpriseId;
    if (!enterprise || !enterprise.isActive) {
      return res.status(400).json({ error: 'Doanh nghiệp sở hữu sản phẩm hiện đang tạm khóa hoặc không tồn tại!' });
    }

    let template = await Template.findOne({ enterpriseId: enterprise._id, isDefault: true });
    if (!template) {
      template = await Template.findOne({ enterpriseId: enterprise._id });
    }
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

    let responseTheme = 'default';
    const cat = (product.category || '').toLowerCase().trim();
    
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

    res.json({
      product,
      enterprise,
      template,
      theme: responseTheme,
      isBarcode: true,
      label: {
        serialNumber: barcode,
        scanCount: 1,
        status: 'ACTIVE',
        isActive: true,
        lastScannedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tra cứu mã vạch' });
  }
});

// POST /api/public/admin-login-as - Admin lấy token để truy cập trang user với quyền NPP
router.post('/admin-login-as', async (req, res) => {
  try {
    // Xác thực token Admin
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập Admin' });
    }

    const adminToken = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(adminToken, process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure');
    } catch {
      return res.status(401).json({ error: 'Token Admin không hợp lệ hoặc đã hết hạn' });
    }

    // Kiểm tra quyền ADMIN
    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ tài khoản ADMIN mới có thể sử dụng chức năng này' });
    }

    // Tạo token đặc biệt để admin truy cập trang user với quyền NPP
    // Thêm flag isAdminImpersonating để phân biệt
    const userToken = jwt.sign(
      { 
        userId: adminUser._id, 
        role: 'NPP',           // Đặt role NPP để dùng được tính năng scan
        isAdminImpersonating: true
      },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: '8h' }      // Token ngắn hạn hơn cho an toàn
    );

    const userData = adminUser.toObject();
    delete userData.password;
    // Trả về user data với role NPP để frontend biết
    userData.role = 'NPP';
    userData.isAdminImpersonating = true;
    userData.fullName = userData.fullName + ' (Admin)';

    res.json({ token: userToken, user: userData });
  } catch (error) {
    console.error('Admin login-as error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;



