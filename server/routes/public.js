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
const Namecard = require('../models/Namecard');

// URL hệ thống chính – dùng làm fallback khi batch không có customDomain
const ADMIN_URL = process.env.USER_PAGE_URL || 'https://www.giaiphapqrcode.vn';

// Helper: escape ký tự đặc biệt trước khi đưa input vào RegExp
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper: che bớt số điện thoại khi trả ra API công khai (VD: 0987***336)
const maskPhone = (phone) => {
  const s = String(phone || '').trim();
  if (!s) return s;
  if (s.length < 7) return s.replace(/.(?=.{2})/g, '*');
  return `${s.slice(0, 4)}***${s.slice(-3)}`;
};

// Helper: chuẩn hóa serial để đối chiếu (bỏ khoảng trắng, ký tự phân cách, in hoa)
const normalizeSerial = (s) => String(s || '').replace(/[\s\-_.]/g, '').toUpperCase();

// Helper: serial NPP nhập có khớp với serial của tem không
// Chấp nhận nhập đầy đủ hoặc phần đuôi (VD tem 100000004 ↔ nhập 00000004), tối thiểu 6 ký tự
const isSerialMatch = (input, labelSerial) => {
  const a = normalizeSerial(input);
  const b = normalizeSerial(labelSerial);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.length >= Math.min(6, b.length) && b.endsWith(a);
};

// Helper: Resolve & normalize manufacturer for Product (từ Enterprise hoặc User NSX)
async function resolveProductManufacturer(product) {
  if (!product) return product;
  const prod = product.toObject ? product.toObject() : { ...product };
  if (!prod.manufacturerId) return prod;

  // Nếu đã được Mongoose populate thành Object
  if (typeof prod.manufacturerId === 'object' && prod.manufacturerId._id) {
    const m = prod.manufacturerId;
    prod.manufacturerId = {
      _id: m._id,
      name: m.fullName || m.name || '',
      address: m.address || '',
      phone: m.phone || '',
      email: m.email || '',
      partnerDetails: m.details || m.partnerDetails || '',
      logo: m.logo || null
    };
    return prod;
  }

  // Nếu là ObjectId/String (chưa được populate do ref mismatch)
  try {
    const User = require('../models/User');
    const Enterprise = require('../models/Enterprise');

    const mfgUser = await User.findById(prod.manufacturerId).select('fullName address phone email details logo role').lean();
    if (mfgUser) {
      prod.manufacturerId = {
        _id: mfgUser._id,
        name: mfgUser.fullName || '',
        address: mfgUser.address || '',
        phone: mfgUser.phone || '',
        email: mfgUser.email || '',
        partnerDetails: mfgUser.details || '',
        logo: mfgUser.logo || null
      };
      return prod;
    }

    const mfgEnt = await Enterprise.findById(prod.manufacturerId).select('name address phone email logo partnerDetails').lean();
    if (mfgEnt) {
      prod.manufacturerId = mfgEnt;
      return prod;
    }
  } catch (e) {
    console.error('Error resolving manufacturer:', e);
  }
  return prod;
}

// GET /api/public/namecard/:slug
router.get('/namecard/:slug', async (req, res) => {
  try {
    const card = await Namecard.findOne({ slug: req.params.slug.toLowerCase(), isActive: true })
      .populate('enterpriseId', 'name brandConfig');
    if (!card) return res.status(404).json({ error: 'Không tìm thấy danh thiếp' });
    res.json(card);
  } catch (err) {
    console.error('GET /public/namecard/:slug error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/public/scan/:serial
router.get('/scan/:serial', async (req, res) => {
  try {
    // Chống cache triệt để để khi sửa sản phẩm / ảnh ở admin thì khách quét nhận dữ liệu mới ngay
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    const { serial } = req.params;
    const cleanSerial = String(serial).trim();
    // noCount=1: chỉ lấy dữ liệu (form NPP / sau khi lưu), không tính thêm lượt quét
    const skipCount = req.query.noCount === '1';

    // Find the label by qrCode, serialNumber, legacy QR, legacy TEMQR suffix, activeCode, or smsCode
    // Bước 1: khớp chính xác (dùng index – rất nhanh). Bước 2: chỉ khi không thấy mới dùng regex hậu tố
    // (regex không neo đầu buộc MongoDB quét toàn bộ collection → chậm khi số tem lớn)
    const populateLabel = (query) => query
      .populate({
        path: 'productId',
        populate: { path: 'manufacturerId', select: 'name address phone email logo partnerDetails' }
      })
      .populate('enterpriseId');

    let label = await populateLabel(Label.findOne({
      $or: [
        { qrCode: cleanSerial },
        { serialNumber: cleanSerial },
        { activeCode: cleanSerial },
        { smsCode: cleanSerial }
      ]
    }));

    if (!label) {
      const suffixRegex = new RegExp(escapeRegex(cleanSerial) + '$', 'i');
      label = await populateLabel(Label.findOne({
        $or: [
          { serialNumber: { $regex: suffixRegex } },
          { legacyQrCode: { $regex: suffixRegex } },
          { legacyTemQr: { $regex: suffixRegex } }
        ]
      }));
    }

    // Auto-repair on the fly if label doesn't exist yet but matching batch exists
    if (!label) {
      const matchingBatch = await LabelBatch.findOne({
        $or: [
          { serialStart: cleanSerial },
          { serialEnd: cleanSerial },
          { batchCode: cleanSerial },
          { serialStart: { $lte: cleanSerial }, serialEnd: { $gte: cleanSerial } }
        ]
      });

      if (matchingBatch) {
        const numPrefix = matchingBatch.prefix || '100';
        let serialsToRepair = [];
        if (matchingBatch.serialStart && matchingBatch.serialEnd && matchingBatch.serialStart === matchingBatch.serialEnd) {
          serialsToRepair.push(matchingBatch.serialStart);
        } else if (matchingBatch.serialStart && matchingBatch.serialEnd) {
          const sMatch = matchingBatch.serialStart.match(/^(\D*?)(\d+)$/);
          const eMatch = matchingBatch.serialEnd.match(/^(\D*?)(\d+)$/);
          if (sMatch && eMatch && sMatch[1] === eMatch[1]) {
            const pStr = sMatch[1];
            const sN = parseInt(sMatch[2], 10);
            const eN = parseInt(eMatch[2], 10);
            const padL = sMatch[2].length;
            // Giới hạn tối đa 100 labels per auto-repair để tránh timeout
            const repairLimit = Math.min(eN - sN + 1, 100);
            for (let i = sN; i < sN + repairLimit; i++) {
              serialsToRepair.push(`${pStr}${String(i).padStart(padL, '0')}`);
            }
          }
        }
        if (serialsToRepair.length === 0) {
          const repairLimit = Math.min(matchingBatch.totalLabels || 100, 100);
          for (let i = 1; i <= repairLimit; i++) {
            serialsToRepair.push(`${numPrefix}${String(i).padStart(6, '0')}`);
          }
        }

        const rawDomain = matchingBatch.customDomain ? matchingBatch.customDomain.trim().replace(/\/+$/, '') : '';
        const domainUrl = rawDomain 
          ? (rawDomain.startsWith('http') ? rawDomain : `https://${rawDomain}`)
          : ADMIN_URL;

        const crypto = require('crypto');
        const generateRandomCode = (len = 8) => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let resStr = '';
          const rnd = crypto.randomBytes(len);
          for (let i = 0; i < len; i++) resStr += chars[rnd[i] % chars.length];
          return resStr.toLowerCase();
        };

        const newLabels = serialsToRepair.map(s => {
          const secretCode = generateRandomCode(8);
          return {
            batchId: matchingBatch._id,
            enterpriseId: matchingBatch.enterpriseId,
            productId: matchingBatch.productId || null,
            serialNumber: s,
            qrCode: secretCode,
            qrUrl: `${domainUrl}/scan/${secretCode}`,
            status: matchingBatch.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            isActive: matchingBatch.status === 'ACTIVE'
          };
        });

        try {
          await Label.insertMany(newLabels, { ordered: false });
        } catch (e) { /* ignore duplicate errors */ }

        label = await Label.findOne({
          $or: [
            { serialNumber: cleanSerial },
            { serialNumber: { $regex: new RegExp(cleanSerial + '$', 'i') } }
          ]
        }).populate({
          path: 'productId',
          populate: { path: 'manufacturerId', select: 'name address phone email logo partnerDetails' }
        }).populate('enterpriseId');
      }
    }

    if (!label) {
      return res.status(404).json({ error: 'Không tìm thấy tem nhãn này trên hệ thống!' });
    }

    // Resolve & normalize manufacturerId on product (hỗ trợ cả NSX từ Quản lý NSX/NPP và Doanh nghiệp)
    if (label.productId) {
      label.productId = await resolveProductManufacturer(label.productId);
    }

    // Find the batch
    const batch = await LabelBatch.findById(label.batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Không tìm thấy lô tem tương ứng!' });
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

    if (!skipCount) {
      label.scanCount = (label.scanCount || 0) + 1;
      label.status = 'SCANNED';
      label.lastScannedAt = new Date();
      await label.save();

      batch.scannedCount = (batch.scannedCount || 0) + 1;
      if (batch.status === 'ACTIVE' && batch.activatedCount === 0) {
        batch.activatedCount = 1;
      }
      await batch.save();

      // Create ScanLog entry – bọc try/catch để không crash toàn bộ request nếu log lỗi
      try {
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
      } catch (logErr) {
        // Log lỗi nhưng KHÔNG abort response – scan data vẫn phải trả về
        console.error('ScanLog create error (non-fatal):', logErr.message);
      }
    }

    // Lấy TẤT CẢ sản phẩm của cùng NSX (không giới hạn số lượng)
    let relatedProducts = [];
    if (enterprise && enterprise._id) {
      relatedProducts = await Product.find({
        enterpriseId: enterprise._id,
        _id: { $ne: label.productId?._id }
      }).select('name category images description').lean();
    }

    let responseTheme = batch.theme || (template && template.layout ? template.layout : 'default');

    // Nếu enterprise đã cấu hình theme mặc định, dùng ngay (override auto-detect)
    const enterpriseDefaultTheme = enterprise.displayConfig?.defaultTheme;
    if (enterpriseDefaultTheme && enterpriseDefaultTheme !== 'default') {
      responseTheme = enterpriseDefaultTheme;
    } else if (responseTheme === 'default' && (enterprise.name || '').toLowerCase().includes('staycool')) {
      responseTheme = 'staycool';
    } else if (responseTheme === 'default' && label.productId) {
      const cat = (label.productId.category || '').toLowerCase().trim();
      const pName = (label.productId.name || '').toLowerCase().trim();
      
      const warrantyKeywords = [
        'bảo hành', 'tem bảo hành', 'warranty', 'homeplus', 'bảo hành điện tử'
      ];

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

      // Điện gia dụng / thiết bị điện
      const applianceKeywords = [
        'bếp ga', 'bếp từ', 'bếp hồng ngoại', 'bếp điện', 'điện máy',
        'gia dụng', 'thiết bị điện', 'máy lạnh', 'điều hòa', 'tủ lạnh',
        'máy giặt', 'lò vi sóng', 'lò nướng', 'máy hút bụi', 'quạt điện',
        'máy lọc', 'nồi cơm', 'nồi áp suất', 'máy xay', 'máy ép',
        'bình nóng lạnh', 'máy sưởi', 'đèn led', 'điện tử', 'electronics',
        'appliance', 'home appliance', 'thiết bị nhà bếp', 'nhà bếp'
      ];

      // Y tế / Dược phẩm
      const medicalKeywords = [
        'dược', 'dược phẩm', 'thuốc', 'y tế', 'vắc xin', 'vaccine',
        'đông y', 'thuốc nam', 'thuốc bắc', 'bệnh viện', 'pharma',
        'pharmaceutical', 'medical', 'kháng sinh', 'sức khỏe'
      ];

      const isWarranty = warrantyKeywords.some(kw => cat.includes(kw) || pName.includes(kw));
      const isAgri = agriKeywords.some(keyword => cat.includes(keyword));
      const isFood = foodKeywords.some(keyword => cat.includes(keyword));
      const isAppliance = applianceKeywords.some(keyword => cat.includes(keyword));
      const isMedical = medicalKeywords.some(keyword => cat.includes(keyword));

      if (isAppliance || isWarranty) {
        responseTheme = 'appliance';
      } else if (isAgri) {
        responseTheme = 'agriculture';
      } else if (isFood) {
        responseTheme = 'functional_food';
      } else if (isMedical) {
        responseTheme = 'medical';
      }
    }

    const showRelated = (template?.showRelatedProducts !== undefined)
      ? template.showRelatedProducts
      : (enterprise?.displayConfig?.showRelatedProducts !== false);

    // Che bớt SĐT khách hàng sở hữu – trang thông tin SP là công khai
    const labelOut = label.toJSON();
    if (labelOut.ownerInfo?.phone) {
      labelOut.ownerInfo.phone = maskPhone(labelOut.ownerInfo.phone);
    }

    const isActivated = Boolean(label.ownerCode || label.ownerInfo?.activatedAt);

    res.json({
      label: labelOut,
      product: label.productId,
      enterprise,
      template,
      relatedProducts,
      showRelated,
      isFirstScan,
      firstScanTime,
      theme: responseTheme,
      isActivated
    });

  } catch (error) {
    console.error('Scan API error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xử lý thông tin quét tem' });
  }
});

// POST /api/public/activate-label - Kích hoạt tem bảo hành cho người dùng / khách mua
router.post('/activate-label', async (req, res) => {
  try {
    const { serial, activationCode, customerName, customerPhone } = req.body;
    const cleanSerial = String(serial || '').trim();
    const cleanCode = String(activationCode || '').trim();

    if (!cleanSerial) {
      return res.status(400).json({ error: 'Thiếu thông tin số serial tem cần kích hoạt.' });
    }
    if (!cleanCode) {
      return res.status(400).json({ error: 'Vui lòng nhập mã kích hoạt.' });
    }

    const label = await Label.findOne({
      $or: [
        { serialNumber: cleanSerial },
        { qrCode: cleanSerial },
        { activeCode: cleanSerial }
      ]
    });

    if (!label) {
      return res.status(404).json({ error: 'Không tìm thấy tem nhãn trên hệ thống.' });
    }

    // Nếu tem có activeCode quy định sẵn thì mã nhập phải khớp
    if (label.activeCode) {
      const match = isSerialMatch(cleanCode, label.activeCode) || cleanCode.toUpperCase() === label.activeCode.toUpperCase();
      if (!match) {
        return res.status(400).json({ error: 'Mã kích hoạt không chính xác. Vui lòng kiểm tra lại mã cào trên tem.' });
      }
    }

    const activatedAt = new Date();

    // Cập nhật trạng thái kích hoạt tem
    label.ownerCode = cleanCode;
    label.ownerInfo = {
      name: (customerName || '').trim() || label.ownerInfo?.name || 'Khách hàng cá nhân',
      phone: (customerPhone || '').trim() || label.ownerInfo?.phone || null,
      address: label.ownerInfo?.address || null,
      activatedSerial: label.serialNumber,
      activatedAt
    };
    if (label.status === 'INACTIVE') {
      label.status = 'ACTIVE';
    }
    await label.save();

    res.json({
      success: true,
      message: 'Kích hoạt bảo hành thành công!',
      ownerCode: label.ownerCode,
      activatedAt,
      ownerInfo: {
        name: label.ownerInfo.name,
        phone: label.ownerInfo.phone ? maskPhone(label.ownerInfo.phone) : null,
        activatedAt
      }
    });
  } catch (err) {
    console.error('activate-label error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi xử lý kích hoạt tem.' });
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

// POST /api/public/npp-login - NSX/NPP/Admin login from user-facing scan page
router.post('/npp-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    // Tìm tài khoản NSX, NPP hoặc ADMIN
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      role: { $in: ['NPP', 'NSX', 'ADMIN'] }
    }).populate('enterpriseId');

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản NSX/NPP không tồn tại hoặc không hợp lệ' });
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

    const tokenRole = user.role;
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: tokenRole
      },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: '7d' }
    );

    // Save currentToken to lock single device session
    user.lastLogin = new Date();
    user.currentToken = token;
    await user.save();

    const userData = user.toObject();
    delete userData.password;
    userData.role = tokenRole;

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

    // Cho phép NPP, NSX hoặc Admin đang impersonate
    if (!['NPP', 'NSX'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Chỉ tài khoản NSX/NPP mới được nhập dữ liệu phân phối' });
    }

    // Verify user exists in DB
    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const { batchId, serialStart, serialEnd, distributorName, distributorAddress, ownerCode } = req.body;

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
    if (ownerCode !== undefined) {
      updateData.ownerCode = (ownerCode && typeof ownerCode === 'string') ? ownerCode.trim() : null;
    }

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

    // Cho phép NPP, NSX hoặc Admin đang impersonate
    if (!['NPP', 'NSX'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Chỉ tài khoản NSX/NPP mới được truy cập' });
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

    // Cho phép NPP, NSX hoặc Admin đang impersonate
    if (!['NPP', 'NSX'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Chỉ tài khoản NSX/NPP mới được nhập dữ liệu phân phối' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const {
      serialNumber, distributorName, distributorAddress, ownerCode,
      ownerName, ownerAddress, ownerPhone, activatedSerial
    } = req.body;

    if (!serialNumber || typeof serialNumber !== 'string') {
      return res.status(400).json({ error: 'Thiếu mã serial sản phẩm' });
    }
    const cleanCode = serialNumber.trim();

    // Find the label – QR in trên tem chứa qrCode (mã bí mật), nên phải tra cả qrCode
    const label = await Label.findOne({
      $or: [
        { serialNumber: cleanCode },
        { qrCode: cleanCode },
        { legacyQrCode: { $regex: new RegExp(escapeRegex(cleanCode) + '$', 'i') } },
        { activeCode: cleanCode }
      ]
    });

    if (!label) {
      return res.status(404).json({ error: 'Không tìm thấy tem nhãn với serial này' });
    }

    // Bổ sung thông tin khách hàng sở hữu (chỉ khi form gửi các trường này)
    const isOwnerUpdate = ownerName !== undefined || ownerPhone !== undefined || activatedSerial !== undefined || ownerCode !== undefined;
    if (isOwnerUpdate) {
      const name = typeof ownerName === 'string' ? ownerName.trim() : '';
      const address = typeof ownerAddress === 'string' ? ownerAddress.trim() : '';
      const phone = typeof ownerPhone === 'string' ? ownerPhone.replace(/[\s.\-]/g, '') : '';
      const inputSerial = typeof activatedSerial === 'string' ? activatedSerial.trim() : '';

      // Các trường 1, 2, 3 không bắt buộc theo yêu cầu khách hàng
      if (name && name.length > 200) return res.status(400).json({ error: 'Tên quá dài (tối đa 200 ký tự)' });
      if (address && address.length > 500) return res.status(400).json({ error: 'Địa chỉ quá dài (tối đa 500 ký tự)' });
      if (phone && !/^(\+84|84|0)\d{9,10}$/.test(phone)) {
        return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
      }
      if (inputSerial && !isSerialMatch(inputSerial, label.serialNumber)) {
        return res.status(400).json({ error: 'Số serial không khớp với tem vừa quét. Vui lòng kiểm tra lại số in trên tem.' });
      }

      // Tem đã kích hoạt: NPP không được ghi đè (chỉ NSX được sửa)
      if (label.ownerInfo?.activatedAt && decoded.role === 'NPP') {
        return res.status(409).json({ error: 'Tem này đã được kích hoạt thông tin khách hàng sở hữu trước đó. Liên hệ Nhà sản xuất nếu cần chỉnh sửa.' });
      }

      const finalOwnerCode = (ownerCode && typeof ownerCode === 'string') ? ownerCode.trim() : null;
      label.ownerInfo = {
        name: name || null,
        address: address || null,
        phone: phone || null,
        activatedSerial: finalOwnerCode || inputSerial || label.serialNumber,
        activatedAt: new Date(),
        activatedBy: user._id
      };
      if (finalOwnerCode) {
        label.ownerCode = finalOwnerCode;
      }
    }

    // Update the label
    label.distributorName = distributorName || user.fullName || user.username;
    label.distributorAddress = distributorAddress || user.enterpriseId?.address || '';
    if (ownerCode !== undefined) {
      label.ownerCode = (ownerCode && typeof ownerCode === 'string') ? ownerCode.trim() : null;
    }
    await label.save();

    // Get total count for this store
    const totalForStore = await Label.countDocuments({
      enterpriseId: label.enterpriseId,
      distributorName: label.distributorName
    });

    res.json({
      success: true,
      message: isOwnerUpdate ? 'Đã kích hoạt thông tin khách hàng sở hữu.' : 'Đã nhập hàng thành công.',
      serialNumber: label.serialNumber,
      qrCode: label.qrCode,
      distributorName: label.distributorName,
      distributorAddress: label.distributorAddress,
      ownerCode: label.ownerCode,
      totalForStore
    });
  } catch (error) {
    console.error('Distributor entry single error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi nhập dữ liệu phân phối' });
  }
});

// Helper: Tạo filter xác định tem thuộc sở hữu của tài khoản NPP
function buildNppLabelFilter(user) {
  const nppNames = [user.fullName, user.username, user.enterpriseId?.name].filter(Boolean);
  const conditions = [
    { distributorName: { $in: nppNames } },
    { ownerCode: user.username }
  ];
  if (user.enterpriseId) {
    const entId = user.enterpriseId._id || user.enterpriseId;
    conditions.push({ enterpriseId: entId, distributorName: { $ne: null } });
    if (user.enterpriseId?.type === 'NPP') {
      conditions.push({ enterpriseId: entId });
    }
  }
  return { $or: conditions };
}

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

    if (decoded.role !== 'NPP' && !decoded.isAdminImpersonating) {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được truy cập' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const nppFilter = buildNppLabelFilter(user);

    // Find labels distributed to this NPP
    const labels = await Label.find(nppFilter)
      .populate('productId')
      .sort({ updatedAt: -1 })
      .limit(50);

    const historyList = labels.map(l => ({
      productName: l.productId?.name || 'Sản phẩm',
      serial: l.serialNumber,
      storeName: l.distributorName,
      storeAddress: l.distributorAddress,
      ownerCode: l.ownerCode || null,
      time: l.updatedAt
    }));

    const totalImported = await Label.countDocuments(nppFilter);

    const enterpriseId = user.enterpriseId?._id || user.enterpriseId;
    let totalPrinted = 0;
    if (enterpriseId) {
      const printedBatches = await LabelBatch.find({
        enterpriseId,
        isPrinted: true
      }).select('printedCount totalLabels').lean();
      totalPrinted = printedBatches.reduce((sum, b) => sum + (b.printedCount || b.totalLabels || 0), 0);
    }

    res.json({
      history: historyList,
      totalImported,
      totalPrinted,
      enterpriseName: user.enterpriseId?.name || ''
    });
  } catch (error) {
    console.error('Get NPP scan history error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy lịch sử quét' });
  }
});

// GET /api/public/npp-products - Get products received/distributed by the logged-in NPP
router.get('/npp-products', async (req, res) => {
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

    if (decoded.role !== 'NPP' && !decoded.isAdminImpersonating) {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được truy cập' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const nppFilter = buildNppLabelFilter(user);

    // 1. Lấy tất cả productId từ các tem NPP đã nhận
    const labelProductIds = await Label.find({ ...nppFilter, productId: { $ne: null } }).distinct('productId');

    // 2. Tìm các sản phẩm thuộc tem NPP đã nhận HOẶC thuộc Doanh nghiệp của NPP HOẶC có NPP trong mảng distributors
    const productQuery = {
      $or: [
        { _id: { $in: labelProductIds } },
        ...(user.enterpriseId ? [{ enterpriseId: user.enterpriseId._id || user.enterpriseId }] : []),
        { 'distributors.name': { $regex: user.fullName || user.username, $options: 'i' } }
      ]
    };

    const products = await Product.find(productQuery)
      .populate('enterpriseId', 'name logo address phone email')
      .populate('manufacturerId', 'name address phone email logo')
      .sort({ createdAt: -1 })
      .lean();

    // 3. Đếm số lượng tem của từng sản phẩm mà NPP đang sở hữu
    const productsWithStats = await Promise.all(products.map(async (prod) => {
      const labelCount = await Label.countDocuments({
        ...nppFilter,
        productId: prod._id
      });
      return {
        ...prod,
        totalLabelsReceived: labelCount
      };
    }));

    res.json({
      success: true,
      data: productsWithStats,
      total: productsWithStats.length
    });
  } catch (error) {
    console.error('Get NPP products error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách sản phẩm' });
  }
});

// GET /api/public/npp-labels - Get paginated labels received by the logged-in NPP
router.get('/npp-labels', async (req, res) => {
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

    if (decoded.role !== 'NPP' && !decoded.isAdminImpersonating) {
      return res.status(403).json({ error: 'Chỉ tài khoản NPP mới được truy cập' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const { page = 1, limit = 20, search = '', productId = '', status = '' } = req.query;
    const baseNppFilter = buildNppLabelFilter(user);

    const query = { ...baseNppFilter };

    if (productId) {
      query.productId = productId;
    }
    if (status) {
      query.status = status;
    }

    if (search) {
      const cleanSearch = String(search).trim();
      // Tìm sản phẩm khớp tên
      const matchProds = await Product.find({ name: { $regex: cleanSearch, $options: 'i' } }).select('_id').lean();
      const prodIds = matchProds.map(p => p._id);

      const searchOr = [
        { serialNumber: { $regex: cleanSearch, $options: 'i' } },
        { activeCode: { $regex: cleanSearch, $options: 'i' } },
        { smsCode: { $regex: cleanSearch, $options: 'i' } }
      ];
      if (prodIds.length > 0) searchOr.push({ productId: { $in: prodIds } });

      query.$and = [{ $or: searchOr }];
    }

    const [total, labels, totalActive, totalScanned, allNppCount] = await Promise.all([
      Label.countDocuments(query),
      Label.find(query)
        .populate('productId', 'name sku images category')
        .populate('batchId', 'batchCode expiryDate isPrinted')
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Label.countDocuments({ ...baseNppFilter, status: 'ACTIVE' }),
      Label.countDocuments({ ...baseNppFilter, status: 'SCANNED' }),
      Label.countDocuments(baseNppFilter)
    ]);

    res.json({
      success: true,
      data: labels,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        totalLabels: allNppCount,
        activeLabels: totalActive,
        scannedLabels: totalScanned
      }
    });
  } catch (error) {
    console.error('Get NPP labels error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tem nhãn' });
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

// POST /api/public/nsx-register - Register a new NSX (Manufacturer) account
router.post('/nsx-register', async (req, res) => {
  try {
    const { username, email, password, fullName, enterpriseName, phone, address, taxCode } = req.body;

    if (!username || !email || !password || !fullName || !enterpriseName) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Địa chỉ email không hợp lệ' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Check existing user case-insensitively
    const existing = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }
      ]
    });
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại trong hệ thống' });
    }

    // Default trial period: 1 year (12 months)
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    // 1. Create Enterprise for NSX
    const enterprise = new Enterprise({
      name: enterpriseName.trim(),
      type: 'NSX',
      phone: phone ? phone.trim() : '',
      email: email.trim().toLowerCase(),
      address: address ? address.trim() : '',
      taxCode: taxCode ? taxCode.trim() : '',
      subscriptionPlan: 'BASIC',
      subscriptionExpiry: expiry,
      isActive: true
    });
    await enterprise.save();

    // 2. Create User account with role 'NSX'
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      role: 'NSX',
      enterpriseId: enterprise._id,
      subscriptionExpiry: expiry,
      isActive: true
    });
    await user.save();

    // 3. Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, role: user.role, enterpriseId: enterprise._id },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: '7d' }
    );

    const userData = user.toObject();
    delete userData.password;
    userData.enterpriseId = enterprise;

    res.status(201).json({
      message: 'Đăng ký tài khoản Nhà sản xuất thành công',
      token,
      user: userData,
      enterprise
    });
  } catch (error) {
    console.error('NSX register error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký tài khoản Nhà sản xuất' });
  }
});

// POST /api/public/npp-register - Register a new NPP account
router.post('/npp-register', async (req, res) => {
  try {
    const { username, email, password, fullName, phone, address, enterpriseId, contactPerson } = req.body;

    if (!username || !email || !password || !fullName || !enterpriseId) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Địa chỉ email không hợp lệ' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Check existing user case-insensitively
    const existing = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }
      ]
    });
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại trong hệ thống' });
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
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      details: contactPerson ? `Người liên hệ: ${contactPerson.trim()}` : '',
      role: 'NPP',
      enterpriseId,
      subscriptionExpiry: enterprise.subscriptionExpiry,
      isActive: true
    });
    await user.save();

    // Auto-login after registration: generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role, enterpriseId: enterprise._id },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: '7d' }
    );

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      message: 'Đăng ký tài khoản Nhà phân phối thành công',
      token,
      user: userData
    });
  } catch (error) {
    console.error('NPP register error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký tài khoản Nhà phân phối' });
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

    const tokenRole = user.role;
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: tokenRole
      },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: '7d' }
    );

    // Save currentToken to lock single device session
    user.lastLogin = new Date();
    user.currentToken = token;
    await user.save();

    const userData = user.toObject();
    delete userData.password;
    userData.role = tokenRole;

    res.json({ token, user: userData });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập' });
  }
});

// GET /api/public/barcode/:barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    const { barcode } = req.params;
    let product = await Product.findOne({ barcode }).populate('enterpriseId');
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm nào có mã vạch này trên hệ thống!' });
    }
    product = await resolveProductManufacturer(product);

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

    const applianceKeywords = [
      'bếp ga', 'bếp từ', 'bếp hồng ngoại', 'bếp điện', 'điện máy',
      'gia dụng', 'thiết bị điện', 'máy lạnh', 'điều hòa', 'tủ lạnh',
      'máy giặt', 'lò vi sóng', 'lò nướng', 'máy hút bụi', 'quạt điện',
      'máy lọc', 'nồi cơm', 'nồi áp suất', 'máy xay', 'máy ép',
      'bình nóng lạnh', 'máy sưởi', 'đèn led', 'điện tử', 'electronics',
      'appliance', 'home appliance', 'thiết bị nhà bếp', 'nhà bếp'
    ];

    const medicalKeywords = [
      'dược', 'dược phẩm', 'thuốc', 'y tế', 'vắc xin', 'vaccine',
      'đông y', 'thuốc nam', 'thuốc bắc', 'bệnh viện', 'pharma',
      'pharmaceutical', 'medical', 'kháng sinh', 'sức khỏe'
    ];

    const isAgri = agriKeywords.some(keyword => cat.includes(keyword));
    const isFood = foodKeywords.some(keyword => cat.includes(keyword));
    const isAppliance = applianceKeywords.some(keyword => cat.includes(keyword));
    const isMedical = medicalKeywords.some(keyword => cat.includes(keyword));

    if (isAgri) {
      responseTheme = 'agriculture';
    } else if (isFood) {
      responseTheme = 'functional_food';
    } else if (isAppliance) {
      responseTheme = 'appliance';
    } else if (isMedical) {
      responseTheme = 'medical';
    }

    const showRelated = (template?.showRelatedProducts !== undefined)
      ? template.showRelatedProducts
      : (enterprise?.displayConfig?.showRelatedProducts !== false);

    res.json({
      product,
      enterprise,
      template,
      showRelated,
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

// POST /api/public/contact - Submit contact form
router.post('/contact', async (req, res) => {
  try {
    const Contact = require('../models/Contact');
    const { fullName, email, phone, subject, message } = req.body;

    if (!fullName || !email || !message) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc: Họ tên, Email, Nội dung.' });
    }

    const newContact = new Contact({
      fullName,
      email,
      phone,
      subject,
      message
    });

    await newContact.save();

    res.json({
      success: true,
      message: 'Cảm ơn bạn! Thông tin liên hệ của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.'
    });
  } catch (error) {
    console.error('Contact submit error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi gửi thông tin liên hệ.' });
  }
});

// GET /api/public/enterprise-by-domain?domain=congtya.com
// Tìm enterprise theo custom domain hoặc subdomain
router.get('/enterprise-by-domain', async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({ error: 'Thiếu tham số domain' });
    }

    // Chuẩn hóa domain: bỏ www. và protocol
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .toLowerCase()
      .trim();

    const parts = cleanDomain.split('.');
    const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : cleanDomain;
    const rootName = parts.length >= 2 ? parts[parts.length - 2] : cleanDomain;

    let enterprise = await Enterprise.findOne({
      isActive: true,
      $or: [
        { domain: { $regex: new RegExp(cleanDomain.replace(/\./g, '\\.'), 'i') } },
        { customDomain: { $regex: new RegExp(cleanDomain.replace(/\./g, '\\.'), 'i') } },
        { subdomain: { $regex: new RegExp(cleanDomain.replace(/\./g, '\\.'), 'i') } },
        { domain: { $regex: new RegExp(rootDomain.replace(/\./g, '\\.'), 'i') } },
        { website: { $regex: new RegExp(rootDomain.replace(/\./g, '\\.'), 'i') } }
      ]
    }).select('name logo domain subdomain brandConfig chatbotConfig address phone email website _id');

    if (!enterprise && rootName) {
      enterprise = await Enterprise.findOne({
        isActive: true,
        name: { $regex: new RegExp(rootName, 'i') }
      }).select('name logo domain subdomain brandConfig chatbotConfig address phone email website _id');
    }

    if (!enterprise) {
      const batchWithDomain = await LabelBatch.findOne({
        customDomain: { $regex: new RegExp(cleanDomain.replace(/\./g, '\\.'), 'i') }
      }).populate('enterpriseId');
      if (batchWithDomain && batchWithDomain.enterpriseId) {
        enterprise = batchWithDomain.enterpriseId;
      }
    }

    if (!enterprise) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp với domain này' });
    }

    res.json({
      enterprise: {
        _id: enterprise._id,
        name: enterprise.name,
        logo: enterprise.logo,
        domain: enterprise.domain,
        subdomain: enterprise.subdomain,
        brandConfig: enterprise.brandConfig,
        chatbotConfig: enterprise.chatbotConfig,
        address: enterprise.address,
        phone: enterprise.phone,
        email: enterprise.email,
        website: enterprise.website
      }
    });
  } catch (error) {
    console.error('Enterprise by domain error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tìm kiếm domain' });
  }
});

module.exports = router;



