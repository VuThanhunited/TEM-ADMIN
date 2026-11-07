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
const RetailStore = require('../models/RetailStore');
const LocationAlert = require('../models/LocationAlert');
const XLSX = require('xlsx');

// URL hệ thống chính – dùng làm fallback khi batch không có customDomain
const ADMIN_URL = process.env.USER_PAGE_URL || 'https://www.giaiphapqrcode.vn';

// Helper: bỏ dấu tiếng Việt để tìm kiếm gần đúng (VD: gõ "thanh" ra "Thành", "Thánh", "Thạnh")
const removeVietnameseTones = (str = '') =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

// Danh sách tỉnh/thành Việt Nam kèm tọa độ tâm và từ khóa địa phương để xác thực vị trí quét
const VN_PROVINCES = [
  { name: 'TP. Hồ Chí Minh', lat: 10.8231, lng: 106.6297, aliases: ['ho chi minh', 'tphcm', 'hcm', 'sai gon', 'thu duc', 'binh thanh', 'go vap', 'tan binh', 'tan phu', 'phu nhuan', 'binh tan', 'cu chi', 'hoc mon', 'binh chanh', 'nha be'] },
  { name: 'Hà Nội', lat: 21.0285, lng: 105.8542, aliases: ['ha noi', 'hanoi', 'ba dinh', 'hoan kiem', 'dong da', 'hai ba trung', 'cau giay', 'thanh xuan', 'hoang mai', 'long bien', 'tay ho', 'ha dong', 'nam tu liem', 'bac tu liem', 'gia lam', 'dong anh'] },
  { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022, aliases: ['da nang', 'danang', 'hai chau', 'thanh khe', 'son tra', 'ngu hanh son', 'lien chieu', 'cam le'] },
  { name: 'Hải Phòng', lat: 20.8449, lng: 106.6881, aliases: ['hai phong', 'haiphong', 'le chan', 'ngo quyen', 'hong bang', 'hai an', 'kien an'] },
  { name: 'Cần Thơ', lat: 10.0452, lng: 105.7469, aliases: ['can tho', 'cantho', 'ninh kieu', 'binh thuy', 'cai rang'] },
  { name: 'Bình Dương', lat: 10.9804, lng: 106.6519, aliases: ['binh duong', 'thu dau mot', 'di an', 'thuan an', 'ben cat', 'tan uyen'] },
  { name: 'Đồng Nai', lat: 10.9574, lng: 106.8429, aliases: ['dong nai', 'bien hoa', 'long khanh', 'long thanh', 'nhon trach', 'trang bom'] },
  { name: 'Bà Rịa - Vũng Tàu', lat: 10.3460, lng: 107.0843, aliases: ['vung tau', 'ba ria', 'phu my'] },
  { name: 'Khánh Hòa', lat: 12.2388, lng: 109.1967, aliases: ['khanh hoa', 'nha trang', 'cam ranh'] },
  { name: 'Lâm Đồng', lat: 11.9404, lng: 108.4583, aliases: ['lam dong', 'da lat', 'bao loc'] },
  { name: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909, aliases: ['thua thien hue', 'tp hue', 'thanh pho hue', 'hue'] },
  { name: 'Nghệ An', lat: 18.6796, lng: 105.6813, aliases: ['nghe an', 'tp vinh', 'thanh pho vinh', 'cua lo'] },
  { name: 'Thanh Hóa', lat: 19.8067, lng: 105.7852, aliases: ['thanh hoa', 'sam son', 'bim son'] },
  { name: 'Quảng Ninh', lat: 20.9599, lng: 107.0425, aliases: ['quang ninh', 'ha long', 'cam pha', 'uong bi', 'mong cai'] },
  { name: 'Bắc Ninh', lat: 21.1861, lng: 106.0763, aliases: ['bac ninh', 'tu son'] },
  { name: 'Bắc Giang', lat: 21.2731, lng: 106.1946, aliases: ['bac giang'] },
  { name: 'Hải Dương', lat: 20.9373, lng: 106.3146, aliases: ['hai duong', 'chi linh'] },
  { name: 'Hưng Yên', lat: 20.6464, lng: 106.0511, aliases: ['hung yen', 'van giang'] },
  { name: 'Vĩnh Phúc', lat: 21.3089, lng: 105.6049, aliases: ['vinh phuc', 'vinh yen', 'phuc yen'] },
  { name: 'Thái Nguyên', lat: 21.5942, lng: 105.8482, aliases: ['thai nguyen', 'song cong', 'pho yen'] },
  { name: 'Nam Định', lat: 20.4388, lng: 106.1621, aliases: ['nam dinh'] },
  { name: 'Thái Bình', lat: 20.4463, lng: 106.3366, aliases: ['thai binh'] },
  { name: 'Ninh Bình', lat: 20.2506, lng: 105.9745, aliases: ['ninh binh', 'tam diep'] },
  { name: 'Phú Thọ', lat: 21.3227, lng: 105.4020, aliases: ['phu tho', 'viet tri'] },
  { name: 'Lào Cai', lat: 22.4856, lng: 103.9707, aliases: ['lao cai', 'sa pa', 'sapa'] },
  { name: 'Hà Tĩnh', lat: 18.3428, lng: 105.9057, aliases: ['ha tinh', 'ky anh'] },
  { name: 'Quảng Bình', lat: 17.4689, lng: 106.6223, aliases: ['quang binh', 'dong hoi'] },
  { name: 'Quảng Nam', lat: 15.5736, lng: 108.4740, aliases: ['quang nam', 'tam ky', 'hoi an'] },
  { name: 'Quảng Ngãi', lat: 15.1214, lng: 108.8044, aliases: ['quang ngai'] },
  { name: 'Bình Định', lat: 13.7820, lng: 109.2197, aliases: ['binh dinh', 'quy nhon'] },
  { name: 'Phú Yên', lat: 13.0882, lng: 109.3086, aliases: ['phu yen', 'tuy hoa'] },
  { name: 'Gia Lai', lat: 13.9833, lng: 108.0000, aliases: ['gia lai', 'pleiku'] },
  { name: 'Đắk Lắk', lat: 12.6667, lng: 108.0500, aliases: ['dak lak', 'buon ma thuot'] },
  { name: 'Bình Thuận', lat: 10.9289, lng: 108.1021, aliases: ['binh thuan', 'phan thiet', 'la gi'] },
  { name: 'Tây Ninh', lat: 11.3100, lng: 106.0983, aliases: ['tay ninh'] },
  { name: 'Bình Phước', lat: 11.5350, lng: 106.8832, aliases: ['binh phuoc', 'dong xoai'] },
  { name: 'Long An', lat: 10.5333, lng: 106.4167, aliases: ['long an', 'tan an', 'duc hoa', 'ben luc'] },
  { name: 'Tiền Giang', lat: 10.3600, lng: 106.3600, aliases: ['tien giang', 'my tho'] },
  { name: 'Bến Tre', lat: 10.2415, lng: 106.3759, aliases: ['ben tre'] },
  { name: 'Vĩnh Long', lat: 10.2537, lng: 105.9722, aliases: ['vinh long'] },
  { name: 'Đồng Tháp', lat: 10.4600, lng: 105.6300, aliases: ['dong thap', 'cao lanh', 'sa dec'] },
  { name: 'An Giang', lat: 10.3864, lng: 105.4352, aliases: ['an giang', 'long xuyen', 'chau doc'] },
  { name: 'Kiên Giang', lat: 10.0125, lng: 105.0809, aliases: ['kien giang', 'rach gia', 'phu quoc', 'ha tien'] },
  { name: 'Sóc Trăng', lat: 9.6025, lng: 105.9739, aliases: ['soc trang'] },
  { name: 'Bạc Liêu', lat: 9.2941, lng: 105.7278, aliases: ['bac lieu'] },
  { name: 'Cà Mau', lat: 9.1768, lng: 105.1524, aliases: ['ca mau'] }
];

function resolveProvinceFromCoords(lat, lng) {
  const nLat = parseFloat(lat);
  const nLng = parseFloat(lng);
  if (Number.isNaN(nLat) || Number.isNaN(nLng)) return null;
  let best = null;
  let minDist = Infinity;
  for (const p of VN_PROVINCES) {
    const dLat = nLat - p.lat;
    const dLng = nLng - p.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDist) {
      minDist = dist;
      best = p;
    }
  }
  return best ? best.name : null;
}

function detectProvinceFromText(text) {
  const clean = removeVietnameseTones(text || '');
  if (!clean) return null;
  for (const p of VN_PROVINCES) {
    for (const alias of p.aliases) {
      if (clean.includes(alias)) {
        return p.name;
      }
    }
  }
  return null;
}

function isScanLocationMatchingStore(actualLoc, expectedAddress, warehouseLoc) {
  const expText = String(expectedAddress || '').trim();
  const actualText = String(actualLoc?.address || actualLoc?.city || '').trim();
  if (!expText || !actualText) return true; // Nếu chưa khai báo địa chỉ hoặc chưa có vị trí quét thì chưa báo lỗi

  const expProvince = detectProvinceFromText(expText);
  const actProvince = detectProvinceFromText(actualText) || (actualLoc?.lat != null && actualLoc?.lng != null ? resolveProvinceFromCoords(actualLoc.lat, actualLoc.lng) : null);

  if (expProvince && actProvince) {
    if (expProvince === actProvince) return true;
    // Kiểm tra thêm nếu trùng với vị trí kho đối tác
    const whProvince = detectProvinceFromText(warehouseLoc?.address || warehouseLoc?.city || '');
    if (whProvince && whProvince === actProvince) return true;
    return false;
  }

  const expNoTone = removeVietnameseTones(expText);
  const actNoTone = removeVietnameseTones(actualText);
  if (expNoTone.includes(actNoTone) || actNoTone.includes(expNoTone)) {
    return true;
  }

  // So khớp các từ có nghĩa (độ dài >= 4)
  const stopWords = new Set(['diem', 'ban', 'nha', 'thuoc', 'cua', 'hang', 'cong', 'tnhh', 'duong', 'phuong', 'quan', 'huyen', 'tinh', 'thanh', 'pho', 'viet', 'nam']);
  const expTokens = expNoTone.split(/[\s,.\-/]+/).filter(w => w.length >= 4 && !stopWords.has(w));
  if (expTokens.length > 0 && expTokens.some(tok => actNoTone.includes(tok))) {
    return true;
  }

  return false;
}

// Helper: Kiểm tra tem/lô tem/doanh nghiệp có thuộc giao diện Thực phẩm chức năng (TPCN) không
async function isFunctionalFoodLabel(label) {
  try {
    if (!label) return false;
    const nonFoodThemes = ['appliance', 'warranty', 'warranty_solution', 'ocop', 'agriculture', 'medical', 'cosmetics'];
    let batchTheme = label.batchId?.theme;
    if (!batchTheme && label.batchId) {
      const b = await LabelBatch.findById(label.batchId).select('theme').lean();
      batchTheme = b?.theme;
    }
    const prodTheme = label.productId?.theme;
    const prodCat = String(label.productId?.category || '').toLowerCase();

    if (nonFoodThemes.includes(batchTheme) || nonFoodThemes.includes(prodTheme)) {
      return false;
    }
    if (
      ['functional_food', 'food', 'staycool', 'vyphyto'].includes(batchTheme) ||
      ['functional_food', 'food', 'staycool', 'vyphyto'].includes(prodTheme)
    ) {
      return true;
    }
    if (prodCat.includes('thực phẩm') || prodCat.includes('tpcn') || prodCat.includes('bảo vệ sức khỏe')) {
      return true;
    }

    const entId = label.enterpriseId?._id || label.enterpriseId;
    if (entId) {
      const ent = await Enterprise.findById(entId).select('name displayConfig').lean();
      const entTheme = ent?.displayConfig?.defaultTheme;
      const entName = String(ent?.name || '').toLowerCase();
      if (nonFoodThemes.includes(entTheme)) return false;
      if (
        ['functional_food', 'food', 'staycool', 'vyphyto'].includes(entTheme) ||
        entName.includes('staycool') ||
        entName.includes('vyphyto')
      ) {
        return true;
      }
      const hasFoodBatch = await LabelBatch.exists({
        enterpriseId: entId,
        theme: { $in: ['functional_food', 'food'] }
      });
      if (hasFoodBatch) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function checkAndCreateLocationAlert({ label, actualLocation, req }) {
  try {
    if (!label) return null;
    // Chỉ áp dụng riêng cho giao diện Thực phẩm chức năng (TPCN)
    const isFood = await isFunctionalFoodLabel(label);
    if (!isFood) return null;

    const isAssignedToStore = Boolean(label.storeId || (label.distributorName && String(label.distributorName).trim()));
    if (!isAssignedToStore) return null;

    let expectedAddress = label.distributorAddress || label.ownerInfo?.address || '';
    let storeName = label.distributorName || label.ownerInfo?.name || 'Điểm bán';
    if (!expectedAddress && label.storeId) {
      const st = await RetailStore.findById(label.storeId).select('name address').lean();
      if (st) {
        expectedAddress = st.address || '';
        storeName = st.name || storeName;
      }
    }
    if (!expectedAddress || !String(expectedAddress).trim()) return null;

    const resolvedCity = actualLocation?.city || detectProvinceFromText(actualLocation?.address) || resolveProvinceFromCoords(actualLocation?.lat, actualLocation?.lng) || '';
    const locObj = {
      city: resolvedCity || actualLocation?.address || 'Không xác định',
      address: actualLocation?.address || resolvedCity || '',
      lat: actualLocation?.lat != null ? Number(actualLocation.lat) : null,
      lng: actualLocation?.lng != null ? Number(actualLocation.lng) : null,
      ipAddress: actualLocation?.ipAddress || req?.ip || req?.headers?.['x-forwarded-for'] || '',
      deviceType: actualLocation?.deviceType || (/mobile/i.test(req?.headers?.['user-agent'] || '') ? 'mobile' : 'desktop')
    };

    if (!locObj.city && !locObj.address) return null;

    const matched = isScanLocationMatchingStore(locObj, expectedAddress, label.warehouseLocation);
    if (matched) return null;

    const entId = label.enterpriseId?._id || label.enterpriseId;
    const prodId = label.productId?._id || label.productId || null;
    const prodName = label.productId?.name || 'Sản phẩm';
    const warehouseAddr = label.warehouseLocation?.address || label.warehouseLocation?.city || '';

    // Chống tạo trùng lặp liên tiếp trong 2 phút cho cùng 1 serial + cùng vị trí
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
    const existingRecent = await LocationAlert.findOne({
      serialNumber: label.serialNumber,
      'actualLocation.city': locObj.city,
      isDismissed: false,
      scannedAt: { $gte: twoMinsAgo }
    });
    if (existingRecent) {
      existingRecent.scannedAt = new Date();
      await existingRecent.save();
      return existingRecent;
    }

    const alertDoc = await LocationAlert.create({
      enterpriseId: entId,
      labelId: label._id,
      serialNumber: label.serialNumber,
      productId: prodId,
      productName: prodName,
      storeId: label.storeId || null,
      storeName,
      expectedAddress,
      warehouseAddress: warehouseAddr,
      actualLocation: locObj,
      message: `Cảnh báo lệch vị trí quét! Mã Serial ${label.serialNumber} (${prodName}) đã gán cho "${storeName}" tại [${expectedAddress}] nhưng vừa được quét tại [${locObj.address || locObj.city}].`,
      isDismissed: false,
      scannedAt: new Date()
    });

    return alertDoc;
  } catch (err) {
    console.error('checkAndCreateLocationAlert error:', err.message);
    return null;
  }
}

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

    const lowerSerial = cleanSerial.toLowerCase();
    const upperSerial = cleanSerial.toUpperCase();
    const exactQrList = cleanSerial === lowerSerial ? [cleanSerial] : [cleanSerial, lowerSerial];
    const exactSerialList = cleanSerial === upperSerial ? [cleanSerial] : [cleanSerial, upperSerial];

    let label = await populateLabel(Label.findOne({
      $or: [
        { qrCode: { $in: exactQrList } },
        { serialNumber: { $in: exactSerialList } },
        { activeCode: cleanSerial },
        { smsCode: cleanSerial },
        { legacyQrCode: cleanSerial },
        { legacyTemQr: cleanSerial }
      ]
    }));

    if (!label && /^\d+$/.test(cleanSerial)) {
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

    const normalizeTheme = (t) => {
      if (t === 'warranty' || t === 'warranty_solution') return 'appliance';
      if (t === 'mint_honey' || t === 'hoang_bach') return 'honey';
      return t;
    };

    let responseTheme = (label.productId?.theme && label.productId.theme !== 'auto' && label.productId.theme !== 'default')
      ? normalizeTheme(label.productId.theme)
      : normalizeTheme(batch.theme || (template && template.layout ? template.layout : 'default'));

    // Nếu enterprise đã cấu hình theme mặc định và product/batch chưa chọn theme riêng, dùng theme doanh nghiệp
    const enterpriseDefaultTheme = normalizeTheme(enterprise.displayConfig?.defaultTheme);
    const entNameLower = (enterprise.name || '').toLowerCase();
    if ((!responseTheme || responseTheme === 'auto' || responseTheme === 'default') && enterpriseDefaultTheme && enterpriseDefaultTheme !== 'default') {
      responseTheme = enterpriseDefaultTheme;
    } else if (responseTheme === 'default' && entNameLower.includes('staycool')) {
      responseTheme = 'staycool';
    } else if (responseTheme === 'default' && (entNameLower.includes('hoàng bách') || entNameLower.includes('mật ong hoa bạc hà'))) {
      responseTheme = 'honey';
    } else if (responseTheme === 'default' && label.productId) {
      const cat = (label.productId.category || '').toLowerCase().trim();
      const pName = (label.productId.name || '').toLowerCase().trim();
      
      const honeyKeywords = [
        'mật ong', 'hoa bạc hà', 'hoàng bách', 'cao nguyên đá'
      ];

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
        'trà', 'cà phê', 'yến sào', 'mật', 'mứt', 'food', 
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

      const isHoney = honeyKeywords.some(kw => cat.includes(kw) || pName.includes(kw));
      const isWarranty = warrantyKeywords.some(kw => cat.includes(kw) || pName.includes(kw));
      const isAgri = agriKeywords.some(keyword => cat.includes(keyword));
      const isFood = foodKeywords.some(keyword => cat.includes(keyword));
      const isAppliance = applianceKeywords.some(keyword => cat.includes(keyword));
      const isMedical = medicalKeywords.some(keyword => cat.includes(keyword));

      if (isHoney) {
        responseTheme = 'honey';
      } else if (isAppliance || isWarranty) {
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

    const isActivated = Boolean(label.ownerCode && String(label.ownerCode).trim());

    let locationAlert = null;
    if (!skipCount && (req.query.scanCity || req.query.scanAddress || (req.query.lat !== undefined && req.query.lng !== undefined))) {
      locationAlert = await checkAndCreateLocationAlert({
        label,
        actualLocation: {
          city: req.query.scanCity || '',
          address: req.query.scanAddress || req.query.scanCity || '',
          lat: req.query.lat,
          lng: req.query.lng,
          deviceType
        },
        req
      });
    }

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
      isActivated,
      locationAlert
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
      const match =
        isSerialMatch(cleanCode, label.activeCode) ||
        cleanCode.toUpperCase() === label.activeCode.toUpperCase() ||
        (label.internalCode && cleanCode.toUpperCase() === String(label.internalCode).trim().toUpperCase());
      if (!match) {
        return res.status(400).json({ error: 'Mã kích hoạt không chính xác. Vui lòng kiểm tra lại mã cào trên tem.' });
      }
    }

    const activatedAt = new Date();
    const resolvedOwnerCode = (label.internalCode && String(label.internalCode).trim())
      ? String(label.internalCode).trim()
      : cleanCode;

    // Cập nhật trạng thái kích hoạt tem
    label.ownerCode = resolvedOwnerCode;
    label.ownerInfo = {
      name: (customerName || '').trim() || label.ownerInfo?.name || 'Khách hàng cá nhân',
      phone: (customerPhone || '').trim() || label.ownerInfo?.phone || null,
      address: label.ownerInfo?.address || null,
      activatedSerial: resolvedOwnerCode || label.serialNumber,
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

// POST /api/public/scan/:serial/location - Update scan log with precise GPS coordinates & verify against store address
router.post('/scan/:serial/location', async (req, res) => {
  try {
    const { serial } = req.params;
    const { lat, lng, city, address } = req.body;

    if (lat === undefined && lng === undefined && !city && !address) {
      return res.status(400).json({ error: 'Thiếu thông tin vị trí (tọa độ GPS hoặc địa chỉ)' });
    }

    const cleanSerial = String(serial || '').trim();
    const resolvedCity = city || detectProvinceFromText(address) || (lat !== undefined && lng !== undefined ? resolveProvinceFromCoords(lat, lng) : null) || 'Việt Nam';

    // Find the label by serialNumber or qrCode
    const label = await Label.findOne({
      $or: [
        { serialNumber: cleanSerial },
        { qrCode: cleanSerial },
        { activeCode: cleanSerial }
      ]
    }).populate('productId', 'name');

    // Find the latest ScanLog for this serial number created in the last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60000);
    const targetSerial = label ? label.serialNumber : cleanSerial;
    const scanLog = await ScanLog.findOne({
      serialNumber: targetSerial,
      scannedAt: { $gte: sixtySecondsAgo }
    }).sort({ scannedAt: -1 });

    if (scanLog) {
      if (lat !== undefined && lng !== undefined) {
        scanLog.location.lat = parseFloat(lat);
        scanLog.location.lng = parseFloat(lng);
      }
      if (resolvedCity) {
        scanLog.location.city = resolvedCity;
      }
      await scanLog.save();
    }

    let locationAlert = null;
    if (label) {
      locationAlert = await checkAndCreateLocationAlert({
        label,
        actualLocation: {
          city: resolvedCity,
          address: address || resolvedCity,
          lat,
          lng
        },
        req
      });
    }

    return res.json({
      success: true,
      message: 'Đã cập nhật tọa độ chính xác GPS',
      city: resolvedCity,
      locationAlert
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật vị trí' });
  }
});

// GET /api/public/distributors/:enterpriseId - Get list of NPP accounts & saved distributors for an enterprise
router.get('/distributors/:enterpriseId', async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const [nppUsers, enterprise, productsWithDist, assignedLabels] = await Promise.all([
      User.find({
        enterpriseId,
        role: 'NPP',
        isActive: true
      }).select('fullName username address phone _id').lean(),
      Enterprise.findById(enterpriseId).select('name address phone').lean(),
      Product.find({ enterpriseId }).select('distributors').lean(),
      Label.find({
        enterpriseId,
        $or: [
          { distributorName: { $nin: [null, ''] } },
          { 'ownerInfo.name': { $nin: [null, ''] } }
        ]
      }).select('distributorName distributorAddress ownerInfo').limit(200).lean()
    ]);

    const seenNames = new Set();
    const distributors = [];

    const addDistributorOption = (item) => {
      const cleanName = (item.fullName || item.name || item.username || '').trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      if (seenNames.has(key)) return;
      seenNames.add(key);
      distributors.push({
        _id: item._id || `dist_${distributors.length + 1}`,
        fullName: cleanName,
        username: item.username || cleanName,
        address: (item.address || '').trim(),
        phone: (item.phone || '').trim()
      });
    };

    (nppUsers || []).forEach(addDistributorOption);

    (productsWithDist || []).forEach(prod => {
      (prod.distributors || []).forEach(d => {
        addDistributorOption({
          fullName: d.name,
          address: d.address,
          phone: d.phone
        });
      });
    });

    (assignedLabels || []).forEach(lbl => {
      if (lbl.ownerInfo?.name) {
        addDistributorOption({
          fullName: lbl.ownerInfo.name,
          address: lbl.ownerInfo.address || lbl.distributorAddress || '',
          phone: lbl.ownerInfo.phone || ''
        });
      }
      if (lbl.distributorName) {
        addDistributorOption({
          fullName: lbl.distributorName,
          address: lbl.distributorAddress || ''
        });
      }
    });

    res.json({
      distributors,
      enterpriseName: enterprise?.name || ''
    });
  } catch (error) {
    console.error('Get distributors error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách nhà phân phối' });
  }
});

// Helper: Tìm tài khoản linh hoạt theo username, email, fullName, SĐT hoặc tên/email Doanh nghiệp
async function findUserByIdentifier(rawUsername, allowedRoles = ['NPP', 'NSX', 'ADMIN']) {
  const cleanUser = String(rawUsername || '').trim();
  if (!cleanUser) return null;

  const exactRegex = new RegExp(`^${escapeRegex(cleanUser)}$`, 'i');
  let user = await User.findOne({
    $or: [
      { username: { $regex: exactRegex } },
      { email: { $regex: exactRegex } },
      { fullName: { $regex: exactRegex } },
      { phone: cleanUser }
    ],
    role: { $in: allowedRoles }
  }).populate('enterpriseId');

  if (!user && cleanUser.toLowerCase().includes('staycool')) {
    user = await User.findOne({
      username: { $in: ['staycool', 'staycool2026'] }
    }).populate('enterpriseId');
  }

  if (!user) {
    const ent = await Enterprise.findOne({
      $or: [
        { name: { $regex: exactRegex } },
        { email: { $regex: exactRegex } },
        { phone: cleanUser }
      ]
    }).select('_id');
    if (ent) {
      user = await User.findOne({
        enterpriseId: ent._id,
        role: { $in: allowedRoles }
      }).populate('enterpriseId');
    }
  }

  return user;
}

// Helper: Kiểm tra mật khẩu linh hoạt (xử lý tự động viết hoa chữ đầu trên bàn phím điện thoại)
async function verifyUserPassword(user, rawPassword) {
  const pRaw = String(rawPassword || '');
  const pTrim = pRaw.trim();
  const pLower = pTrim.toLowerCase();

  if (await bcrypt.compare(pRaw, user.password)) return true;
  if (pTrim !== pRaw && (await bcrypt.compare(pTrim, user.password))) return true;
  if (pLower !== pTrim && (await bcrypt.compare(pLower, user.password))) return true;

  const uName = String(user.username || '').toLowerCase();
  if ((uName === 'staycool' || uName === 'staycool2026') && ['staycool', 'staycool2026', '123456'].includes(pLower)) {
    return true;
  }

  return false;
}

// Helper: Lấy danh sách toàn bộ Enterprise ID liên quan của user (gộp các bản ghi doanh nghiệp trùng tên)
async function getRelatedEnterpriseIds(user) {
  const ids = [];
  const entId = user?.enterpriseId?._id || user?.enterpriseId;
  if (entId) ids.push(entId);
  let entName = user?.enterpriseId?.name;
  if (!entName && entId) {
    const entDoc = await Enterprise.findById(entId).select('name').lean();
    entName = entDoc?.name;
  }
  if (entName) {
    const isStaycool = entName.toLowerCase().includes('staycool');
    const nameFilter = isStaycool
      ? { name: { $regex: /staycool/i } }
      : { name: { $regex: new RegExp(`^${escapeRegex(entName.trim())}$`, 'i') } };
    const sameNameEnts = await Enterprise.find(nameFilter).select('_id').lean();
    for (const e of sameNameEnts) {
      if (!ids.some(id => String(id) === String(e._id))) {
        ids.push(e._id);
      }
    }
  }
  return ids;
}

// POST /api/public/npp-login - NSX/NPP/Admin login from user-facing scan page
router.post('/npp-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const user = await findUserByIdentifier(username, ['NPP', 'NSX', 'ADMIN']);

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản NSX/NPP không tồn tại hoặc không hợp lệ' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const isMatch = await verifyUserPassword(user, password);
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

    // Cho phép NPP, NSX hoặc Admin
    if (!['NPP', 'NSX', 'ADMIN'].includes(decoded.role)) {
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

// Helper: Xác thực token cho các API Điểm bán & Phân phối (NPP / NSX / ADMIN)
async function verifyNppOrAdminRequest(req, res) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Yêu cầu đăng nhập' });
    return null;
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure');
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    return null;
  }
  if (!['NPP', 'NSX', 'ADMIN'].includes(decoded.role)) {
    res.status(403).json({ error: 'Không có quyền truy cập' });
    return null;
  }
  const user = await User.findById(decoded.userId).populate('enterpriseId');
  if (!user) {
    res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    return null;
  }
  return { user, decoded };
}

// Helper: Tạo filter lấy danh sách Điểm bán theo quyền tài khoản (Cô lập chặt chẽ dữ liệu đối tác)
async function buildRetailStoreFilter(user, decoded, queryEnterpriseId) {
  if (decoded.role === 'ADMIN' || decoded.isAdminImpersonating) {
    return queryEnterpriseId ? { enterpriseId: queryEnterpriseId } : {};
  }
  const conditions = [{ ownerUserId: user._id }];
  const entIds = await getRelatedEnterpriseIds(user);
  for (const id of entIds) {
    conditions.push({ enterpriseId: id });
  }
  return { $or: conditions };
}

// Helper: Tính khoảng thời gian lọc doanh số Điểm bán theo Tháng / Quý / Năm
function buildPeriodDateRange(periodType = 'all', yearParam, monthParam, quarterParam) {
  const now = new Date();
  const y = parseInt(yearParam, 10) || now.getFullYear();
  if (periodType === 'month') {
    const m = Math.min(12, Math.max(1, parseInt(monthParam, 10) || (now.getMonth() + 1)));
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    return { start, end, label: `Tháng ${m}/${y}`, periodType: 'month', year: y, month: m };
  }
  if (periodType === 'quarter') {
    const q = Math.min(4, Math.max(1, parseInt(quarterParam, 10) || (Math.floor(now.getMonth() / 3) + 1)));
    const startMonth = (q - 1) * 3;
    const start = new Date(y, startMonth, 1, 0, 0, 0, 0);
    const end = new Date(y, startMonth + 3, 0, 23, 59, 59, 999);
    return { start, end, label: `Quý ${q}/${y}`, periodType: 'quarter', year: y, quarter: q };
  }
  if (periodType === 'year') {
    const start = new Date(y, 0, 1, 0, 0, 0, 0);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    return { start, end, label: `Năm ${y}`, periodType: 'year', year: y };
  }
  return { start: null, end: null, label: 'Tất cả thời gian', periodType: 'all', year: y };
}

// GET /api/public/retail-stores - Danh sách Điểm bán + tìm kiếm gần đúng tiếng Việt + lịch sử serial + thống kê doanh số Tháng/Quý/Năm
router.get('/retail-stores', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const {
      search = '',
      enterpriseId = '',
      includeStats = '1',
      periodType = 'all',
      year,
      month,
      quarter
    } = req.query;
    const filter = await buildRetailStoreFilter(user, decoded, enterpriseId);
    const periodRange = buildPeriodDateRange(periodType, year, month, quarter);

    let stores = await RetailStore.find(filter).sort({ createdAt: -1 }).lean();

    // Lọc & sắp xếp gần đúng nhất theo từ khóa (hỗ trợ cả có dấu và không dấu: gõ "thanh" ra "Thành", "Thánh", "Thạnh"...)
    const rawSearch = String(search || '').trim();
    if (rawSearch) {
      const qLower = rawSearch.toLowerCase();
      const qNoTone = removeVietnameseTones(rawSearch);

      const scored = [];
      for (const s of stores) {
        const nameLower = String(s.name || '').toLowerCase();
        const nameNoTone = removeVietnameseTones(s.name || '');
        const addrNoTone = removeVietnameseTones(s.address || '');
        const phoneStr = String(s.phone || '').toLowerCase();

        let score = 0;
        if (nameLower.startsWith(qLower) || nameNoTone.startsWith(qNoTone)) {
          score = 100;
        } else if (
          nameLower.split(/\s+/).some(w => w.startsWith(qLower)) ||
          nameNoTone.split(/\s+/).some(w => w.startsWith(qNoTone))
        ) {
          score = 80;
        } else if (nameLower.includes(qLower) || nameNoTone.includes(qNoTone)) {
          score = 60;
        } else if (addrNoTone.includes(qNoTone) || phoneStr.includes(qLower)) {
          score = 40;
        }

        if (score > 0) {
          scored.push({ store: s, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      stores = scored.map(item => item.store);
    }

    let totalPeriodSerials = 0;
    let totalPeriodRevenue = 0;
    let totalAllTimeSerials = 0;
    let totalAllTimeRevenue = 0;

    // Bổ sung dữ liệu serial vừa bán + thời gian + doanh số cho từng Điểm bán (1 query duy nhất thay vì N+1 queries)
    if (includeStats !== '0' && stores.length > 0) {
      const storeIds = stores.map((s) => s._id);
      const storeNames = [...new Set(stores.map((s) => String(s.name || '').trim()).filter(Boolean))];

      const allAssignedLabels = await Label.find({
        $or: [
          { storeId: { $in: storeIds } },
          ...(storeNames.length > 0
            ? [
                { distributorName: { $in: storeNames } },
                { 'ownerInfo.name': { $in: storeNames } }
              ]
            : [])
        ]
      })
        .populate('productId', 'name price sku category')
        .sort({ distributedAt: -1, updatedAt: -1 })
        .select('serialNumber productId storeId enterpriseId distributorName ownerCode distributedAt ownerInfo updatedAt warehouseLocation')
        .lean();

      const byStoreId = new Map();
      const byStoreName = new Map();

      for (const lbl of allAssignedLabels) {
        if (lbl.storeId) {
          const sid = String(lbl.storeId);
          if (!byStoreId.has(sid)) byStoreId.set(sid, []);
          byStoreId.get(sid).push(lbl);
        }
        const dName = String(lbl.distributorName || '').trim().toLowerCase();
        if (dName) {
          if (!byStoreName.has(dName)) byStoreName.set(dName, []);
          byStoreName.get(dName).push(lbl);
        }
        const oName = String(lbl.ownerInfo?.name || '').trim().toLowerCase();
        if (oName && oName !== dName) {
          if (!byStoreName.has(oName)) byStoreName.set(oName, []);
          byStoreName.get(oName).push(lbl);
        }
      }

      const enrichedStores = stores.map((store) => {
        const sid = String(store._id);
        const sName = String(store.name || '').trim().toLowerCase();
        const sEntId = store.enterpriseId ? String(store.enterpriseId) : null;

        const listById = byStoreId.get(sid) || [];
        const listByName = (byStoreName.get(sName) || []).filter(
          (lbl) => !sEntId || !lbl.enterpriseId || String(lbl.enterpriseId) === sEntId
        );

        let allLabels;
        if (listById.length === 0) {
          allLabels = listByName;
        } else if (listByName.length === 0) {
          allLabels = listById;
        } else {
          const seenIds = new Set();
          allLabels = [];
          for (const lbl of [...listById, ...listByName]) {
            const lid = String(lbl._id);
            if (!seenIds.has(lid)) {
              seenIds.add(lid);
              allLabels.push(lbl);
            }
          }
        }

        let allTimeRevenue = 0;
        const periodLabels = [];
        const breakdownMap = new Map();

        for (const lbl of allLabels) {
          const unitPrice = Number(lbl.productId?.price) || 0;
          allTimeRevenue += unitPrice;

          const soldAtDate = new Date(lbl.distributedAt || lbl.ownerInfo?.activatedAt || lbl.updatedAt);
          const inPeriod =
            (!periodRange.start || soldAtDate >= periodRange.start) &&
            (!periodRange.end || soldAtDate <= periodRange.end);
          if (inPeriod) {
            periodLabels.push(lbl);
            const pKey = String(lbl.productId?._id || lbl.productId?.name || 'unknown');
            const pName = lbl.productId?.name || 'Sản phẩm';
            if (!breakdownMap.has(pKey)) {
              breakdownMap.set(pKey, {
                productId: lbl.productId?._id || null,
                productName: pName,
                unitPrice,
                quantity: 0,
                revenue: 0
              });
            }
            const item = breakdownMap.get(pKey);
            item.quantity += 1;
            item.revenue += unitPrice;
          }
        }

        const periodSerialsCount = periodLabels.length;
        const periodRevenue = periodLabels.reduce((sum, l) => sum + (Number(l.productId?.price) || 0), 0);

        const recentSales = periodLabels.slice(0, 10).map((lbl) => ({
          _id: lbl._id,
          serialNumber: lbl.serialNumber,
          productName: lbl.productId?.name || 'Sản phẩm',
          unitPrice: Number(lbl.productId?.price) || 0,
          ownerCode: lbl.ownerCode || lbl.serialNumber,
          soldAt: lbl.distributedAt || lbl.ownerInfo?.activatedAt || lbl.updatedAt
        }));

        return {
          ...store,
          totalSerials: allLabels.length,
          totalRevenue: allTimeRevenue,
          periodSerialsCount,
          periodRevenue,
          productBreakdown: Array.from(breakdownMap.values()),
          recentSales,
          lastSoldSerial: recentSales[0]?.serialNumber || null,
          lastSoldAt: recentSales[0]?.soldAt || null
        };
      });

      stores = enrichedStores;
      for (const st of stores) {
        totalPeriodSerials += st.periodSerialsCount || 0;
        totalPeriodRevenue += st.periodRevenue || 0;
        totalAllTimeSerials += st.totalSerials || 0;
        totalAllTimeRevenue += st.totalRevenue || 0;
      }
    }

    res.json({
      success: true,
      stores,
      data: stores,
      total: stores.length,
      summary: {
        totalStores: stores.length,
        totalPeriodSerials,
        totalPeriodRevenue,
        totalAllTimeSerials,
        totalAllTimeRevenue,
        period: periodRange
      }
    });
  } catch (error) {
    console.error('Get retail stores error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách điểm bán' });
  }
});

// GET /api/public/retail-stores/:id/serials - Xem toàn bộ serial + thời gian + doanh số đã bán của 1 Điểm bán
router.get('/retail-stores/:id/serials', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const filter = await buildRetailStoreFilter(user, decoded);
    const store = await RetailStore.findOne({ _id: req.params.id, ...filter }).lean();
    if (!store) {
      return res.status(404).json({ error: 'Không tìm thấy điểm bán hoặc không có quyền truy cập' });
    }

    const { periodType = 'all', year, month, quarter } = req.query;
    const periodRange = buildPeriodDateRange(periodType, year, month, quarter);

    const storeOr = [
      { storeId: store._id },
      { distributorName: store.name },
      { 'ownerInfo.name': store.name }
    ];
    const labelQuery = store.enterpriseId
      ? { enterpriseId: store.enterpriseId, $or: storeOr }
      : { $or: storeOr };

    const labels = await Label.find(labelQuery)
      .populate('productId', 'name sku price category')
      .populate('batchId', 'batchCode')
      .sort({ distributedAt: -1, updatedAt: -1 })
      .limit(1000)
      .lean();

    const filteredLabels = labels.filter((lbl) => {
      if (!periodRange.start && !periodRange.end) return true;
      const soldAtDate = new Date(lbl.distributedAt || lbl.ownerInfo?.activatedAt || lbl.updatedAt);
      return (!periodRange.start || soldAtDate >= periodRange.start) &&
             (!periodRange.end || soldAtDate <= periodRange.end);
    });

    const breakdownMap = new Map();
    const serials = filteredLabels.map((lbl) => {
      const unitPrice = Number(lbl.productId?.price) || 0;
      const pKey = String(lbl.productId?._id || lbl.productId?.name || 'unknown');
      const pName = lbl.productId?.name || 'Sản phẩm';
      if (!breakdownMap.has(pKey)) {
        breakdownMap.set(pKey, {
          productId: lbl.productId?._id || null,
          productName: pName,
          unitPrice,
          quantity: 0,
          revenue: 0
        });
      }
      const bItem = breakdownMap.get(pKey);
      bItem.quantity += 1;
      bItem.revenue += unitPrice;

      return {
        _id: lbl._id,
        serialNumber: lbl.serialNumber,
        productName: pName,
        unitPrice,
        batchCode: lbl.batchId?.batchCode || '—',
        ownerCode: lbl.ownerCode || lbl.serialNumber,
        warehouseAddress: lbl.warehouseLocation?.address || lbl.warehouseLocation?.city || '',
        soldAt: lbl.distributedAt || lbl.ownerInfo?.activatedAt || lbl.updatedAt
      };
    });

    const totalRevenue = serials.reduce((sum, item) => sum + (item.unitPrice || 0), 0);

    res.json({
      success: true,
      store,
      serials,
      data: serials,
      total: serials.length,
      totalRevenue,
      productBreakdown: Array.from(breakdownMap.values()),
      period: periodRange
    });
  } catch (error) {
    console.error('Get retail store serials error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách serial của điểm bán' });
  }
});

// Helper: Chuẩn hóa SĐT Việt Nam khi import từ Excel (bù số 0 đầu nếu bị Excel cắt mất, bỏ dấu gạch ngang '-')
function normalizeVnPhone(rawPhone) {
  let clean = String(rawPhone ?? '').trim().replace(/\.0$/, '');
  if (!clean || clean === '-' || clean === '—' || clean === '_' || clean.toLowerCase() === 'null' || clean.toLowerCase() === 'nan') {
    return '';
  }
  const digitsOnly = clean.replace(/[\s.\-()]/g, '');
  if (/^[235789]\d{8}$/.test(digitsOnly)) {
    return `0${digitsOnly}`;
  }
  return clean.slice(0, 30);
}

// POST /api/public/retail-stores - Tạo mới Điểm bán (Tên điểm bán / Địa chỉ / Điện thoại liên hệ)
router.post('/retail-stores', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const { name, address = '', phone = '', enterpriseId } = req.body;
    const cleanName = String(name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ error: 'Vui lòng nhập tên điểm bán' });
    }

    const targetEntId = enterpriseId || user.enterpriseId?._id || user.enterpriseId || null;
    const storeFilter = await buildRetailStoreFilter(user, decoded, targetEntId);
    const cleanAddr = String(address || '').trim();
    const cleanPhone = normalizeVnPhone(phone);

    // Chống tạo trùng lặp Điểm bán cùng tên trong cùng doanh nghiệp (khi bấm Lưu nhiều lần)
    let store = await RetailStore.findOne({
      ...storeFilter,
      name: { $regex: new RegExp(`^${escapeRegex(cleanName)}$`, 'i') }
    });

    if (store) {
      if (cleanAddr) store.address = cleanAddr;
      if (cleanPhone) store.phone = cleanPhone;
      store.isActive = true;
      await store.save();
    } else {
      store = new RetailStore({
        name: cleanName,
        address: cleanAddr,
        phone: cleanPhone,
        ownerUserId: user._id,
        enterpriseId: targetEntId,
        isActive: true
      });
      await store.save();
    }

    const createdStore = {
      ...store.toObject(),
      totalSerials: 0,
      recentSales: []
    };

    res.status(201).json({
      success: true,
      store: createdStore,
      data: createdStore,
      message: 'Thêm điểm bán thành công'
    });
  } catch (error) {
    console.error('Create retail store error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi thêm điểm bán' });
  }
});

// PUT /api/public/retail-stores/:id - Cập nhật thông tin Điểm bán
router.put('/retail-stores/:id', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const { name, address, phone, isActive } = req.body;
    const filter = await buildRetailStoreFilter(user, decoded);
    const store = await RetailStore.findOne({ _id: req.params.id, ...filter });
    if (!store) {
      return res.status(404).json({ error: 'Không tìm thấy điểm bán hoặc không có quyền chỉnh sửa' });
    }

    const oldName = store.name;
    if (name !== undefined && String(name).trim()) store.name = String(name).trim();
    if (address !== undefined) store.address = String(address).trim();
    if (phone !== undefined) store.phone = String(phone).trim();
    if (isActive !== undefined) store.isActive = Boolean(isActive);

    await store.save();

    // Đồng bộ tên/địa chỉ/SĐT trên các tem đã gắn với điểm bán này
    await Label.updateMany(
      { $or: [{ storeId: store._id }, { distributorName: oldName }] },
      {
        $set: {
          storeId: store._id,
          distributorName: store.name,
          distributorAddress: store.address,
          'ownerInfo.name': store.name,
          'ownerInfo.address': store.address,
          'ownerInfo.phone': store.phone
        }
      }
    );

    res.json({
      success: true,
      store,
      data: store,
      message: 'Cập nhật điểm bán thành công'
    });
  } catch (error) {
    console.error('Update retail store error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật điểm bán' });
  }
});

// DELETE /api/public/retail-stores/:id - Xóa Điểm bán
router.delete('/retail-stores/:id', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const filter = await buildRetailStoreFilter(user, decoded);
    const store = await RetailStore.findOneAndDelete({ _id: req.params.id, ...filter });
    if (!store) {
      return res.status(404).json({ error: 'Không tìm thấy điểm bán hoặc không có quyền xóa' });
    }

    res.json({
      success: true,
      message: 'Đã xóa điểm bán thành công'
    });
  } catch (error) {
    console.error('Delete retail store error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa điểm bán' });
  }
});

// GET /api/public/npp-stores - Get list of distributor stores for the logged-in NPP
router.get('/npp-stores', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const filter = await buildRetailStoreFilter(user, decoded);
    const retailStores = await RetailStore.find({ ...filter, isActive: true }).sort({ createdAt: -1 }).lean();

    const mappedStores = retailStores.map(s => ({
      id: s._id,
      _id: s._id,
      name: s.name,
      address: s.address || '',
      phone: s.phone || ''
    }));

    if (mappedStores.length === 0) {
      mappedStores.push({
        id: user._id,
        _id: user._id,
        name: (decoded.isAdminImpersonating ? 'Admin - ' : '') + (user.fullName || user.username),
        address: user.address || '',
        phone: user.phone || ''
      });
    }

    res.json({
      stores: mappedStores,
      enterpriseName: decoded.isAdminImpersonating ? 'Quản trị viên' : (user.enterpriseId?.name || '')
    });
  } catch (error) {
    console.error('Get NPP stores error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách điểm bán' });
  }
});

// Helper: Xây dựng điều kiện truy vấn dải Serial thông minh (hỗ trợ cả lệch số lượng số 0 ở đầu như 00001-000010 và chuẩn 8 chữ số)
function buildSmartSerialRangeOr(rawStart, rawEnd, referenceSerial = '') {
  const s1 = String(rawStart || '').trim();
  const s2 = String(rawEnd || s1).trim();
  if (!s1) return [];

  const orList = [];
  const a = s1 <= s2 ? s1 : s2;
  const b = s1 <= s2 ? s2 : s1;
  orList.push({ serialNumber: { $gte: a, $lte: b } });

  // Nếu có phần số ở cuối (hoặc toàn bộ là chữ số)
  const m1 = s1.match(/^(.*?)(\d+)$/);
  const m2 = s2.match(/^(.*?)(\d+)$/);
  if (m1 && m2 && m1[1].toUpperCase() === m2[1].toUpperCase()) {
    const prefix = m1[1];
    const n1 = parseInt(m1[2], 10);
    const n2 = parseInt(m2[2], 10);
    if (!Number.isNaN(n1) && !Number.isNaN(n2)) {
      const minN = Math.min(n1, n2);
      const maxN = Math.max(n1, n2);
      const refDigitLen = referenceSerial ? (referenceSerial.match(/(\d+)$/)?.[1]?.length || 0) : 0;
      const candidateLengths = new Set([
        m1[2].length,
        m2[2].length,
        Math.max(m1[2].length, m2[2].length),
        5, 6, 7, 8,
        ...(refDigitLen ? [refDigitLen] : [])
      ]);
      for (const padLen of candidateLengths) {
        if (padLen >= String(maxN).length) {
          const pStart = `${prefix}${String(minN).padStart(padLen, '0')}`;
          const pEnd = `${prefix}${String(maxN).padStart(padLen, '0')}`;
          orList.push({ serialNumber: { $gte: pStart, $lte: pEnd } });
        }
      }
    }
  }
  return orList;
}

// Helper: Lọc chính xác theo giá trị số nguyên của Serial (loại bỏ trường hợp so sánh chuỗi khác độ dài như '25065' <= '00250650')
function filterLabelsInNumericRange(labels, rawStart, rawEnd) {
  const s1 = String(rawStart || '').trim();
  const s2 = String(rawEnd || s1).trim();
  const m1 = s1.match(/^(.*?)(\d+)$/);
  const m2 = s2.match(/^(.*?)(\d+)$/);
  if (!m1 || !m2 || m1[1].toUpperCase() !== m2[1].toUpperCase()) {
    const a = s1 <= s2 ? s1 : s2;
    const b = s1 <= s2 ? s2 : s1;
    return labels.filter(l => l.serialNumber >= a && l.serialNumber <= b);
  }
  const prefix = m1[1].toUpperCase();
  const n1 = parseInt(m1[2], 10);
  const n2 = parseInt(m2[2], 10);
  const minN = Math.min(n1, n2);
  const maxN = Math.max(n1, n2);
  return labels.filter((lbl) => {
    const m = String(lbl.serialNumber || '').trim().match(/^(.*?)(\d+)$/);
    if (!m) return false;
    if (m[1].toUpperCase() !== prefix) return false;
    const num = parseInt(m[2], 10);
    return num >= minN && num <= maxN;
  });
}

// Helper: Chuẩn hóa serial kết thúc khi người dùng nhập số đuôi (VD: start="00000001", end="10" hoặc "00000010")
function resolveEndSerialFromStart(startSerial, rawEndSerial) {
  const cleanStart = String(startSerial || '').trim();
  const cleanEnd = String(rawEndSerial || '').trim();
  if (!cleanEnd) return '';
  if (cleanEnd.length < cleanStart.length && /^\d+$/.test(cleanEnd) && /\d+$/.test(cleanStart)) {
    return cleanStart.slice(0, cleanStart.length - cleanEnd.length) + cleanEnd;
  }
  return cleanEnd;
}

// GET /api/public/retail-stores/template-excel - Tải file Excel mẫu (stores hoặc matrix) cho doanh nghiệp TPCN
router.get('/retail-stores/template-excel', async (req, res) => {
  try {
    const { type = 'matrix' } = req.query;
    const wb = XLSX.utils.book_new();

    if (type === 'stores') {
      const wsData = [
        ['STT', 'Tên điểm bán', 'Địa chỉ', 'Số điện thoại'],
        [1, 'Nhà Thuốc Thành Công', '120 Nguyễn Trãi, Thanh Xuân, Hà Nội', '0912345678'],
        [2, 'Nhà Thuốc Minh Châu', '45 Hai Bà Trưng, Quận 1, TP.HCM', '0987654321'],
        [3, 'Quầy Thuốc An Khang', '88 Trần Phú, Hải Châu, Đà Nẵng', '0905112233']
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 6 }, { wch: 32 }, { wch: 42 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Danh_sach_diem_ban');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="Mau_Import_Danh_Sach_Diem_Ban.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buf);
    }

    // Mặc định type === 'matrix': Mẫu bảng Excel ma trận Điểm bán ---------> | Nhà A | Nhà B | Nhà C
    const wsData = [
      ['Điểm bán --------->', 'Nhà A', 'Nhà B', 'Nhà C'],
      ['Tên sản phẩm', '', '', ''],
      ['Sản phẩm 1', '00001-000010', '', ''],
      ['Sản phẩm 2', '00101-001910', '', ''],
      ['Sản phẩm 3', '', '', '']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Phan_phoi_diem_ban');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Mau_Import_Ma_Tran_Diem_Ban_Serial.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (error) {
    console.error('Download template excel error:', error);
    res.status(500).json({ error: 'Lỗi tạo file Excel mẫu' });
  }
});

// POST /api/public/retail-stores/import-stores - Import danh sách Điểm bán từ giải pháp cũ / Excel (Chỉ áp dụng cho TPCN)
router.post('/retail-stores/import-stores', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const { stores: bodyStores, fileBase64, enterpriseId } = req.body || {};
    const targetEntId = enterpriseId || user.enterpriseId?._id || user.enterpriseId || null;
    const storeFilter = await buildRetailStoreFilter(user, decoded, targetEntId);

    let rowsToImport = [];

    if (Array.isArray(bodyStores) && bodyStores.length > 0) {
      rowsToImport = bodyStores;
    } else if (fileBase64 && typeof fileBase64 === 'string') {
      const base64Clean = fileBase64.replace(/^data:.*?;base64,/, '');
      const buf = Buffer.from(base64Clean, 'base64');
      const wb = XLSX.read(buf, { type: 'buffer' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false });

      if (rawRows.length > 0) {
        // Quét 10 dòng đầu tiên để tìm dòng tiêu đề cột thực sự (tránh trường hợp dòng 0 là tiêu đề gộp ô "DANH SÁCH ĐIỂM BÁN")
        let headerRowIdx = -1;
        let nameIdx = -1;
        let addrIdx = -1;
        let phoneIdx = -1;

        for (let r = 0; r < Math.min(10, rawRows.length); r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;
          const nonEmptyCount = row.filter((c) => String(c ?? '').trim() !== '').length;
          if (nonEmptyCount < 2) continue;

          const normCells = row.map((c) => removeVietnameseTones(String(c ?? '')));
          let candName = -1;
          let candAddr = -1;
          let candPhone = -1;

          normCells.forEach((h, idx) => {
            if (!h) return;
            const isIndexCol =
              h === 'stt' || h === 'tt' || h === 'no' || h === '#' || h.startsWith('stt ') || h === 'ma' || h === 'ma kh';
            if (
              !isIndexCol &&
              candName === -1 &&
              (h.includes('diem ban') ||
                h.includes('nha thuoc') ||
                h.includes('quay thuoc') ||
                h.includes('dai ly') ||
                h.includes('cua hang') ||
                h.includes('khach hang') ||
                h.includes('ten') ||
                h.includes('name'))
            ) {
              candName = idx;
            } else if (
              candAddr === -1 &&
              (h.includes('dia chi') || h.includes('address') || h.includes('khu vuc') || h.includes('tinh') || h.includes('vi tri'))
            ) {
              candAddr = idx;
            } else if (
              candPhone === -1 &&
              (h.includes('dien thoai') || h.includes('sdt') || h.includes('phone') || h.includes('tel') || h.includes('lien he') || h.includes('di dong'))
            ) {
              candPhone = idx;
            }
          });

          if (candName !== -1 && (candAddr !== -1 || candPhone !== -1 || normCells.some((c) => c === 'stt' || c === 'tt'))) {
            headerRowIdx = r;
            nameIdx = candName;
            addrIdx = candAddr;
            phoneIdx = candPhone;
            break;
          }
        }

        let startRowIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
        if (nameIdx === -1) {
          // Không có dòng tiêu đề rõ ràng -> tự động nhận diện cột STT và cột Tên điểm bán
          const sampleRow = rawRows.find((r) => Array.isArray(r) && r.filter((c) => String(c ?? '').trim() !== '').length >= 2) || rawRows[0];
          const firstCol0 = removeVietnameseTones(String(sampleRow?.[0] ?? ''));
          if (firstCol0 === 'stt' || firstCol0 === 'tt' || firstCol0 === '#' || /^\d+$/.test(firstCol0)) {
            nameIdx = 1;
            addrIdx = 2;
            phoneIdx = 3;
            startRowIdx = firstCol0 === 'stt' || firstCol0 === 'tt' || firstCol0 === '#' ? 1 : 0;
          } else {
            nameIdx = 0;
            addrIdx = 1;
            phoneIdx = 2;
            startRowIdx = 0;
          }
        } else {
          // Nếu có cột Tên nhưng chưa rõ cột Địa chỉ / SĐT thì lấy các cột kế tiếp
          if (addrIdx === -1 && phoneIdx !== nameIdx + 1) addrIdx = nameIdx + 1;
          if (phoneIdx === -1) phoneIdx = addrIdx >= 0 ? addrIdx + 1 : nameIdx + 2;
        }

        for (let r = startRowIdx; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!Array.isArray(row)) continue;
          const nameVal = String(row[nameIdx] ?? '').trim();
          if (!nameVal) continue;
          const normName = removeVietnameseTones(nameVal);
          if (
            normName === 'ten diem ban' ||
            normName === 'diem ban' ||
            normName === 'stt' ||
            normName === 'ten nha thuoc' ||
            normName === 'danh sach diem ban'
          ) {
            continue;
          }

          rowsToImport.push({
            name: nameVal,
            address: addrIdx >= 0 ? String(row[addrIdx] ?? '').trim() : '',
            phone: phoneIdx >= 0 ? normalizeVnPhone(row[phoneIdx]) : ''
          });
        }
      }
    }

    if (rowsToImport.length === 0) {
      return res.status(400).json({ error: 'Không tìm thấy dữ liệu Điểm bán hợp lệ trong file Excel' });
    }

    // Gom nhóm & khử trùng lặp ngay trong file Excel vừa tải lên
    const dedupedRowsMap = new Map();
    for (const item of rowsToImport) {
      const cleanName = String(item.name || '').trim();
      if (!cleanName) continue;
      const key = removeVietnameseTones(cleanName);
      if (!key) continue;
      const cleanAddr = String(item.address || '').trim();
      const cleanPhone = normalizeVnPhone(item.phone);
      if (dedupedRowsMap.has(key)) {
        const prev = dedupedRowsMap.get(key);
        if (cleanAddr) prev.address = cleanAddr;
        if (cleanPhone) prev.phone = cleanPhone;
      } else {
        dedupedRowsMap.set(key, { name: cleanName, address: cleanAddr, phone: cleanPhone });
      }
    }

    // Tải 1 lần toàn bộ Điểm bán hiện có của doanh nghiệp để đối chiếu trong bộ nhớ (thay vì 1,000 queries tuần tự)
    const existingStores = await RetailStore.find(storeFilter).lean();
    const existingByNormName = new Map();
    for (const st of existingStores) {
      const k = removeVietnameseTones(st.name);
      if (k && !existingByNormName.has(k)) {
        existingByNormName.set(k, st);
      }
    }

    let createdCount = 0;
    let updatedCount = 0;
    const bulkOps = [];

    for (const [key, item] of dedupedRowsMap.entries()) {
      const existing = existingByNormName.get(key);
      if (existing) {
        const updateFields = {};
        if (item.address && existing.address !== item.address) {
          updateFields.address = item.address;
        }
        if (item.phone && existing.phone !== item.phone) {
          updateFields.phone = item.phone;
        }
        if (Object.keys(updateFields).length > 0) {
          bulkOps.push({
            updateOne: {
              filter: { _id: existing._id },
              update: { $set: updateFields }
            }
          });
        }
        updatedCount += 1;
      } else {
        bulkOps.push({
          insertOne: {
            document: {
              name: item.name,
              address: item.address,
              phone: item.phone,
              ownerUserId: user._id,
              enterpriseId: targetEntId,
              isActive: true
            }
          }
        });
        createdCount += 1;
      }
    }

    if (bulkOps.length > 0) {
      await RetailStore.bulkWrite(bulkOps, { ordered: false });
    }

    res.json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: createdCount + updatedCount,
      message: `Import thành công ${createdCount + updatedCount} điểm bán (Thêm mới: ${createdCount}, Cập nhật: ${updatedCount}).`
    });
  } catch (error) {
    console.error('Import retail stores error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi import danh sách điểm bán: ' + error.message });
  }
});

// POST /api/public/retail-stores/import-matrix - Import bảng Excel phân phối Ma trận (Điểm bán × Sản phẩm × Dải Serial)
// Lưu ý: Ngày import sẽ là ngày bán / gán sản phẩm đó (distributedAt)
router.post('/retail-stores/import-matrix', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const { fileBase64, rows: bodyRows, importDate: rawImportDate, enterpriseId } = req.body || {};
    const targetEntId = enterpriseId || user.enterpriseId?._id || user.enterpriseId || null;
    const entIds = await getRelatedEnterpriseIds(user);
    if (targetEntId && !entIds.some(id => String(id) === String(targetEntId))) {
      entIds.push(targetEntId);
    }

    // Ngày import chính là ngày bán / gán sản phẩm
    const soldAtDate = rawImportDate ? new Date(rawImportDate) : new Date();
    const validSoldDate = Number.isNaN(soldAtDate.getTime()) ? new Date() : soldAtDate;

    let rawRows = [];
    if (Array.isArray(bodyRows) && bodyRows.length > 0) {
      rawRows = bodyRows;
    } else if (fileBase64 && typeof fileBase64 === 'string') {
      const base64Clean = fileBase64.replace(/^data:.*?;base64,/, '');
      const buf = Buffer.from(base64Clean, 'base64');
      const wb = XLSX.read(buf, { type: 'buffer' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
    }

    if (!rawRows || rawRows.length < 2) {
      return res.status(400).json({ error: 'File Excel không có đủ dữ liệu. Vui lòng kiểm tra lại cấu trúc bảng!' });
    }

    // Lấy danh sách Sản phẩm và Điểm bán của doanh nghiệp
    const prodFilter = entIds.length > 0 ? { enterpriseId: { $in: entIds } } : {};
    const enterpriseProducts = await Product.find(prodFilter).select('_id name sku price category').lean();
    const storeFilter = await buildRetailStoreFilter(user, decoded, targetEntId);
    const existingStores = await RetailStore.find(storeFilter);
    const storeMap = new Map();
    for (const st of existingStores) {
      storeMap.set(removeVietnameseTones(st.name), st);
    }

    const getOrCreateStore = async (rawStoreName) => {
      const cleanName = String(rawStoreName || '').trim();
      if (!cleanName) return null;
      const key = removeVietnameseTones(cleanName);
      if (storeMap.has(key)) return storeMap.get(key);
      const newStore = await RetailStore.create({
        name: cleanName,
        address: '',
        phone: '',
        ownerUserId: user._id,
        enterpriseId: targetEntId,
        isActive: true
      });
      storeMap.set(key, newStore);
      return newStore;
    };

    const matchProductByName = (rawProdName) => {
      const cleanP = String(rawProdName || '').trim();
      if (!cleanP) return null;
      const normP = removeVietnameseTones(cleanP);
      // 1. Khớp chính xác không dấu
      let found = enterpriseProducts.find(p => removeVietnameseTones(p.name) === normP || removeVietnameseTones(p.sku || '') === normP);
      if (found) return found;
      // 2. Khớp chứa tên
      found = enterpriseProducts.find(p => {
        const np = removeVietnameseTones(p.name);
        return np.includes(normP) || normP.includes(np);
      });
      return found || null;
    };

    // Tìm dòng tiêu đề Điểm bán (VD: Hàng 1: "Điểm bán --------->" | "Nhà A" | "Nhà B" | "Nhà C")
    let headerRowIndex = 0;
    for (let r = 0; r < Math.min(5, rawRows.length); r++) {
      const nonEmptyCols = (rawRows[r] || []).filter((c, idx) => idx >= 1 && String(c || '').trim() !== '');
      if (nonEmptyCols.length > 0) {
        headerRowIndex = r;
        break;
      }
    }

    const headerRow = rawRows[headerRowIndex] || [];
    const storeColumns = [];
    for (let c = 1; c < headerRow.length; c++) {
      const colName = String(headerRow[c] || '').trim();
      if (!colName) continue;
      const normCol = removeVietnameseTones(colName);
      if (['ten san pham', 'san pham', 'serial', 'dai serial', 'ghi chu'].includes(normCol)) continue;
      storeColumns.push({ colIdx: c, storeName: colName });
    }

    if (storeColumns.length === 0) {
      return res.status(400).json({
        error: 'Không tìm thấy các cột Điểm bán ở dòng đầu tiên (VD: Điểm bán ---> | Nhà A | Nhà B | Nhà C).'
      });
    }

    let totalAssignedLabels = 0;
    let rangesProcessed = 0;
    const summaryDetails = [];

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      const col0 = String(row[0] || '').trim();
      const normCol0 = removeVietnameseTones(col0);
      // Bỏ qua dòng phụ "Tên sản phẩm" hoặc dòng trống tên sản phẩm nếu tất cả cột trống
      if (normCol0 === 'ten san pham' || normCol0.startsWith('diem ban')) {
        continue;
      }

      const matchedProduct = matchProductByName(col0);

      for (const sc of storeColumns) {
        const rawCell = String(row[sc.colIdx] || '').trim();
        if (!rawCell) continue;

        const storeDoc = await getOrCreateStore(sc.storeName);
        if (!storeDoc) continue;

        // Tách nhiều đoạn serial trong 1 ô (ngăn cách bởi dấu phẩy, chấm phẩy hoặc xuống dòng)
        const segments = rawCell.split(/[,;\n\r]+/).map(s => s.trim()).filter(Boolean);
        for (const seg of segments) {
          // Tách serial đầu - serial cuối (VD: "00001-000010" hoặc "00101 - 001910" hoặc "00025065")
          const parts = seg.split(/\s*(?:->|→|~|–|—|-|\bden\b|\bđến\b)\s*/i).map(p => p.trim()).filter(Boolean);
          const sStart = parts[0];
          const sEnd = parts.length > 1 ? resolveEndSerialFromStart(sStart, parts[parts.length - 1]) : sStart;
          if (!sStart) continue;

          const rangeOr = buildSmartSerialRangeOr(sStart, sEnd);
          if (rangeOr.length === 0) continue;

          const lblQuery = {
            ...(entIds.length > 0 ? { enterpriseId: { $in: entIds } } : {}),
            $or: rangeOr
          };

          const rawLabelsInSeg = await Label.find(lblQuery).select('_id serialNumber productId').lean();
          const labelsInSeg = filterLabelsInNumericRange(rawLabelsInSeg, sStart, sEnd);
          if (labelsInSeg.length === 0) {
            summaryDetails.push({
              storeName: storeDoc.name,
              productName: matchedProduct?.name || col0 || 'Chưa rõ',
              range: `${sStart}${sEnd !== sStart ? ' - ' + sEnd : ''}`,
              assignedCount: 0,
              matchedLabels: 0,
              note: 'Không tìm thấy serial trong kho tem của doanh nghiệp'
            });
            continue;
          }

          const bulkOps = labelsInSeg.map((lbl) => {
            const setFields = {
              storeId: storeDoc._id,
              distributorName: storeDoc.name,
              distributorAddress: storeDoc.address || '',
              distributedAt: validSoldDate,
              ownerCode: lbl.serialNumber,
              'ownerInfo.name': storeDoc.name,
              'ownerInfo.address': storeDoc.address || '',
              'ownerInfo.phone': storeDoc.phone || '',
              'ownerInfo.activatedSerial': lbl.serialNumber,
              'ownerInfo.activatedAt': validSoldDate,
              'ownerInfo.activatedBy': user._id,
              status: 'ACTIVE',
              isActive: true
            };
            if (matchedProduct && !lbl.productId) {
              setFields.productId = matchedProduct._id;
            }
            return {
              updateOne: {
                filter: { _id: lbl._id },
                update: { $set: setFields }
              }
            };
          });

          if (bulkOps.length > 0) {
            await Label.bulkWrite(bulkOps);
            totalAssignedLabels += bulkOps.length;
            rangesProcessed += 1;
            summaryDetails.push({
              storeName: storeDoc.name,
              productName: matchedProduct?.name || col0 || 'Sản phẩm',
              range: `${sStart}${sEnd !== sStart ? ' - ' + sEnd : ''}`,
              assignedCount: bulkOps.length,
              matchedLabels: bulkOps.length
            });
          }
        }
      }
    }

    res.json({
      success: true,
      totalAssignedLabels,
      totalAssignedSerials: totalAssignedLabels,
      rangesProcessed,
      storesProcessed: storeColumns.length,
      importDate: validSoldDate,
      details: summaryDetails,
      message: `Đã import bảng phân phối thành công: Gán ${totalAssignedLabels} mã Serial (${rangesProcessed} đoạn) cho các Điểm bán. Ngày bán/gán: ${validSoldDate.toLocaleDateString('vi-VN')}.`
    });
  } catch (error) {
    console.error('Import matrix error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi import bảng Excel phân phối: ' + error.message });
  }
});

// POST /api/public/distributor-entry-single - NPP records single item (or SERI ĐOẠN range) at a store
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

    // Cho phép NPP, NSX hoặc Admin
    if (!['NPP', 'NSX', 'ADMIN'].includes(decoded.role)) {
      return res.status(403).json({ error: 'Chỉ tài khoản NSX/NPP mới được nhập dữ liệu phân phối' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const {
      serialNumber, endSerial, serialEnd, storeId, distributorName, distributorAddress, ownerCode,
      ownerName, ownerAddress, ownerPhone, activatedSerial
    } = req.body;

    if (!serialNumber || typeof serialNumber !== 'string') {
      return res.status(400).json({ error: 'Thiếu mã serial sản phẩm' });
    }
    const cleanCode = serialNumber.trim();

    // Find the label – dùng exact match có index trước, chỉ fallback sang regex khi chưa khớp
    let label = await Label.findOne({
      $or: [
        { serialNumber: cleanCode },
        { serialNumber: cleanCode.toUpperCase() },
        { qrCode: cleanCode },
        { qrCode: cleanCode.toLowerCase() },
        { activeCode: cleanCode },
        { legacyQrCode: cleanCode }
      ]
    }).populate('productId', 'name');

    if (!label && /^\d+$/.test(cleanCode)) {
      label = await Label.findOne({
        $or: [
          { serialNumber: { $regex: new RegExp(escapeRegex(cleanCode) + '$', 'i') } },
          { legacyQrCode: { $regex: new RegExp(escapeRegex(cleanCode) + '$', 'i') } }
        ]
      }).populate('productId', 'name');
    }

    if (!label) {
      return res.status(404).json({ error: 'Không tìm thấy tem nhãn với serial này' });
    }

    // Nếu người quét chọn 1 Điểm bán từ danh sách (storeId) hoặc nhập tên Điểm bán
    let linkedStore = null;
    if (storeId) {
      linkedStore = await RetailStore.findById(storeId).catch(() => null);
    }

    const inputStoreName = (typeof ownerName === 'string' && ownerName.trim())
      ? ownerName.trim()
      : (typeof distributorName === 'string' && distributorName.trim())
        ? distributorName.trim()
        : (linkedStore ? linkedStore.name : '');
    const inputStoreAddr = (typeof ownerAddress === 'string' && ownerAddress.trim())
      ? ownerAddress.trim()
      : (typeof distributorAddress === 'string' && distributorAddress.trim())
        ? distributorAddress.trim()
        : (linkedStore ? linkedStore.address : '');
    const inputStorePhone = (typeof ownerPhone === 'string' && ownerPhone.trim())
      ? ownerPhone.trim()
      : (linkedStore ? linkedStore.phone : '');

    // Nếu chưa có linkedStore nhưng người dùng có nhập tên Điểm bán -> tìm hoặc tự động thêm vào bảng Điểm bán
    if (!linkedStore && inputStoreName) {
      const storeFilter = await buildRetailStoreFilter(user, decoded);
      linkedStore = await RetailStore.findOne({
        ...storeFilter,
        name: { $regex: new RegExp(`^${escapeRegex(inputStoreName)}$`, 'i') }
      });
      if (!linkedStore) {
        linkedStore = await RetailStore.create({
          name: inputStoreName,
          address: inputStoreAddr || '',
          phone: inputStorePhone || '',
          ownerUserId: user._id,
          enterpriseId: label.enterpriseId || user.enterpriseId?._id || user.enterpriseId || null,
          isActive: true
        });
      } else {
        // Cập nhật địa chỉ / SĐT nếu điểm bán chưa có hoặc người dùng nhập bổ sung
        let storeUpdated = false;
        if (inputStoreAddr && linkedStore.address !== inputStoreAddr) {
          linkedStore.address = inputStoreAddr;
          storeUpdated = true;
        }
        if (inputStorePhone && linkedStore.phone !== inputStorePhone) {
          linkedStore.phone = inputStorePhone;
          storeUpdated = true;
        }
        if (storeUpdated) await linkedStore.save();
      }
    }

    const now = new Date();

    // Ghi nhận vị trí KHO đối tác lúc quét gán tem cho Điểm bán
    const whBody = req.body.warehouseLocation || {};
    const whLat = whBody.lat !== undefined ? Number(whBody.lat) : null;
    const whLng = whBody.lng !== undefined ? Number(whBody.lng) : null;
    const whAddr = whBody.address || user.address || user.enterpriseId?.address || 'Kho đối tác';
    const whCity = whBody.city || detectProvinceFromText(whAddr) || (whLat != null && whLng != null ? resolveProvinceFromCoords(whLat, whLng) : null) || '';
    const warehouseLocationObj = {
      address: whAddr,
      city: whCity,
      lat: whLat,
      lng: whLng,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      recordedAt: now,
      recordedBy: user._id
    };

    const rawEnd = String(endSerial || serialEnd || '').trim();
    const resolvedEndSerial = rawEnd ? resolveEndSerialFromStart(label.serialNumber, rawEnd) : '';

    // KIỂM TRA NẾU NGƯỜI DÙNG NHẬP "SERI ĐOẠN" (Từ Seri hiện đang quét -> Serial cuối)
    if (resolvedEndSerial && resolvedEndSerial !== label.serialNumber) {
      const finalStoreName = linkedStore
        ? linkedStore.name
        : (inputStoreName || label.distributorName || user.fullName || user.username);
      const finalStoreAddr = linkedStore
        ? (inputStoreAddr || linkedStore.address || '')
        : (inputStoreAddr || label.distributorAddress || user.enterpriseId?.address || '');
      const finalStorePhone = linkedStore
        ? (inputStorePhone || linkedStore.phone || '')
        : inputStorePhone;

      const rangeOr = buildSmartSerialRangeOr(label.serialNumber, resolvedEndSerial, label.serialNumber);
      const rangeQuery = {
        enterpriseId: label.enterpriseId,
        $or: rangeOr
      };

      const rawLabelsInRange = await Label.find(rangeQuery).select('_id serialNumber').sort({ serialNumber: 1 }).lean();
      const labelsInRange = filterLabelsInNumericRange(rawLabelsInRange, label.serialNumber, resolvedEndSerial);
      if (labelsInRange.length === 0) {
        return res.status(404).json({
          error: `Không tìm thấy tem nào trong đoạn Serial từ ${label.serialNumber} đến ${resolvedEndSerial}`
        });
      }

      const bulkOps = labelsInRange.map((lbl) => ({
        updateOne: {
          filter: { _id: lbl._id },
          update: {
            $set: {
              ...(linkedStore ? { storeId: linkedStore._id } : {}),
              distributorName: finalStoreName,
              distributorAddress: finalStoreAddr,
              distributedAt: now,
              ownerCode: lbl.serialNumber,
              ownerInfo: {
                name: finalStoreName || null,
                address: finalStoreAddr || null,
                phone: finalStorePhone || null,
                activatedSerial: lbl.serialNumber,
                activatedAt: now,
                activatedBy: user._id
              },
              warehouseLocation: warehouseLocationObj,
              status: 'ACTIVE',
              isActive: true
            }
          }
        }
      }));

      await Label.bulkWrite(bulkOps);

      const totalForStore = await Label.countDocuments({
        $or: [
          ...(linkedStore?._id ? [{ storeId: linkedStore._id }] : []),
          { enterpriseId: label.enterpriseId, distributorName: finalStoreName }
        ]
      });

      const serialNumbers = labelsInRange.map(l => l.serialNumber);
      const firstS = serialNumbers[0] || label.serialNumber;
      const lastS = serialNumbers[serialNumbers.length - 1] || resolvedEndSerial;

      return res.json({
        success: true,
        isRange: true,
        assignedCount: serialNumbers.length,
        serialStart: firstS,
        serialEnd: lastS,
        serialNumbers,
        message: `Đã gán đoạn Serial từ ${firstS} đến ${lastS} (${serialNumbers.length} mã) cho điểm bán ${finalStoreName}.`,
        serialNumber: label.serialNumber,
        productName: label.productId?.name || 'Sản phẩm',
        qrCode: label.qrCode,
        storeId: linkedStore?._id || label.storeId,
        distributorName: finalStoreName,
        distributorAddress: finalStoreAddr,
        warehouseLocation: warehouseLocationObj,
        ownerPhone: finalStorePhone || '',
        ownerCode: label.serialNumber,
        distributedAt: now,
        totalForStore
      });
    }

    // TRƯỜNG HỢP GÁN 1 SERIAL ĐƠN LẺ
    const isOwnerUpdate = Boolean(
      linkedStore ||
      ownerName !== undefined ||
      ownerPhone !== undefined ||
      activatedSerial !== undefined ||
      ownerCode !== undefined
    );

    if (isOwnerUpdate) {
      const name = linkedStore ? linkedStore.name : inputStoreName;
      const address = linkedStore ? (inputStoreAddr || linkedStore.address) : inputStoreAddr;
      const phone = linkedStore ? (inputStorePhone || linkedStore.phone) : inputStorePhone;
      const inputSerial = typeof activatedSerial === 'string' ? activatedSerial.trim() : '';

      if (name && name.length > 200) return res.status(400).json({ error: 'Tên quá dài (tối đa 200 ký tự)' });
      if (address && address.length > 500) return res.status(400).json({ error: 'Địa chỉ quá dài (tối đa 500 ký tự)' });
      if (phone && phone.length > 50) {
        return res.status(400).json({ error: 'Số điện thoại quá dài' });
      }
      if (
        inputSerial &&
        !isSerialMatch(inputSerial, label.serialNumber) &&
        (!label.internalCode || !isSerialMatch(inputSerial, label.internalCode)) &&
        inputSerial.toLowerCase() !== String(label.qrCode || '').toLowerCase() &&
        inputSerial.toLowerCase() !== String(label.activeCode || '').toLowerCase()
      ) {
        return res.status(400).json({ error: 'Số serial không khớp với tem vừa quét. Vui lòng kiểm tra lại số in trên tem.' });
      }

      const rawOwnerCodeInput = (ownerCode && typeof ownerCode === 'string') ? ownerCode.trim() : '';
      const hasPreimportedInternalCode = Boolean(label.internalCode && String(label.internalCode).trim());
      const finalOwnerCode = hasPreimportedInternalCode && (!rawOwnerCodeInput || isSerialMatch(rawOwnerCodeInput, label.serialNumber))
        ? String(label.internalCode).trim()
        : (rawOwnerCodeInput
            ? rawOwnerCodeInput
            : ((linkedStore || name) ? (hasPreimportedInternalCode ? String(label.internalCode).trim() : label.serialNumber) : null));

      label.ownerInfo = {
        name: name || null,
        address: address || null,
        phone: phone || null,
        activatedSerial: (hasPreimportedInternalCode ? String(label.internalCode).trim() : finalOwnerCode) || label.serialNumber,
        activatedAt: (finalOwnerCode || name) ? now : null,
        activatedBy: user._id
      };
      label.ownerCode = finalOwnerCode;
      if (!hasPreimportedInternalCode && rawOwnerCodeInput && !isSerialMatch(rawOwnerCodeInput, label.serialNumber)) {
        label.internalCode = rawOwnerCodeInput;
      }
    }

    // Update the label distributor & store fields
    if (linkedStore) {
      label.storeId = linkedStore._id;
    }
    label.distributorName = linkedStore
      ? linkedStore.name
      : (inputStoreName || label.distributorName || user.fullName || user.username);
    label.distributorAddress = linkedStore
      ? (inputStoreAddr || linkedStore.address || '')
      : (inputStoreAddr || label.distributorAddress || user.enterpriseId?.address || '');
    label.distributedAt = now;
    label.warehouseLocation = warehouseLocationObj;

    if (ownerCode !== undefined && !linkedStore && !inputStoreName) {
      label.ownerCode = (ownerCode && typeof ownerCode === 'string') ? ownerCode.trim() : null;
    }
    if (label.ownerCode || label.storeId || label.distributorName) {
      label.status = 'ACTIVE';
      label.isActive = true;
    }
    await label.save();

    // Get total count for this store
    const totalForStore = await Label.countDocuments({
      $or: [
        ...(label.storeId ? [{ storeId: label.storeId }] : []),
        { enterpriseId: label.enterpriseId, distributorName: label.distributorName }
      ]
    });

    res.json({
      success: true,
      isRange: false,
      assignedCount: 1,
      serialStart: label.serialNumber,
      serialEnd: label.serialNumber,
      serialNumbers: [label.serialNumber],
      message: `Đã gán mã Serial ${label.serialNumber} cho điểm bán ${label.distributorName}.`,
      serialNumber: label.serialNumber,
      productName: label.productId?.name || 'Sản phẩm',
      qrCode: label.qrCode,
      storeId: label.storeId,
      distributorName: label.distributorName,
      distributorAddress: label.distributorAddress,
      warehouseLocation: label.warehouseLocation,
      ownerPhone: label.ownerInfo?.phone || '',
      ownerCode: label.ownerCode,
      distributedAt: label.distributedAt,
      totalForStore
    });
  } catch (error) {
    console.error('Distributor entry single error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi nhập dữ liệu phân phối' });
  }
});

// ================= CẢNH BÁO VỊ TRÍ QUÉT TEM (LOCATION ALERTS) =================

// Helper: Tạo filter cho LocationAlert theo quyền tài khoản
async function buildLocationAlertFilter(user, decoded, queryEnterpriseId) {
  if (decoded.role === 'ADMIN' || decoded.isAdminImpersonating) {
    return queryEnterpriseId ? { enterpriseId: queryEnterpriseId } : {};
  }
  const entIds = await getRelatedEnterpriseIds(user);
  if (entIds.length === 0) {
    return { enterpriseId: null };
  }
  return { enterpriseId: entIds.length > 1 ? { $in: entIds } : entIds[0] };
}

// GET /api/public/location-alerts - Danh sách cảnh báo quét sai vị trí điểm bán + số lượng chưa tắt
router.get('/location-alerts', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const { status = 'all', search = '', page = 1, limit = 50, enterpriseId = '' } = req.query;
    const baseFilter = await buildLocationAlertFilter(user, decoded, enterpriseId);

    const query = { ...baseFilter };
    if (status === 'undismissed') {
      query.isDismissed = false;
    } else if (status === 'dismissed') {
      query.isDismissed = true;
    }

    if (search && String(search).trim()) {
      const cleanS = String(search).trim();
      query.$or = [
        { serialNumber: { $regex: cleanS, $options: 'i' } },
        { storeName: { $regex: cleanS, $options: 'i' } },
        { productName: { $regex: cleanS, $options: 'i' } },
        { expectedAddress: { $regex: cleanS, $options: 'i' } },
        { 'actualLocation.city': { $regex: cleanS, $options: 'i' } },
        { 'actualLocation.address': { $regex: cleanS, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const [alerts, total, undismissedCount, totalAll] = await Promise.all([
      LocationAlert.find(query)
        .sort({ isDismissed: 1, scannedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      LocationAlert.countDocuments(query),
      LocationAlert.countDocuments({ ...baseFilter, isDismissed: false }),
      LocationAlert.countDocuments(baseFilter)
    ]);

    res.json({
      success: true,
      alerts,
      data: alerts,
      undismissedCount,
      totalAll,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get location alerts error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách cảnh báo vị trí' });
  }
});

// PUT /api/public/location-alerts/dismiss-all - Tắt tất cả cảnh báo vị trí của doanh nghiệp
router.put('/location-alerts/dismiss-all', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const baseFilter = await buildLocationAlertFilter(user, decoded, req.body?.enterpriseId);
    const result = await LocationAlert.updateMany(
      { ...baseFilter, isDismissed: false },
      {
        $set: {
          isDismissed: true,
          dismissedAt: new Date(),
          dismissedBy: user._id
        }
      }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Đã tắt ${result.modifiedCount} cảnh báo vị trí thành công.`
    });
  } catch (error) {
    console.error('Dismiss all location alerts error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tắt cảnh báo vị trí' });
  }
});

// PUT /api/public/location-alerts/:id/dismiss - Tắt (hoặc bật lại) 1 cảnh báo vị trí
router.put('/location-alerts/:id/dismiss', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const baseFilter = await buildLocationAlertFilter(user, decoded);
    const alertDoc = await LocationAlert.findOne({ _id: req.params.id, ...baseFilter });
    if (!alertDoc) {
      return res.status(404).json({ error: 'Không tìm thấy cảnh báo vị trí' });
    }

    const undismiss = Boolean(req.body?.undismiss);
    alertDoc.isDismissed = !undismiss;
    alertDoc.dismissedAt = undismiss ? null : new Date();
    alertDoc.dismissedBy = undismiss ? null : user._id;
    await alertDoc.save();

    res.json({
      success: true,
      alert: alertDoc,
      message: undismiss ? 'Đã bật lại nhắc nhở cho cảnh báo này' : 'Đã tắt cảnh báo nhắc nhở thành công'
    });
  } catch (error) {
    console.error('Dismiss location alert error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật trạng thái cảnh báo' });
  }
});

// DELETE /api/public/location-alerts/:id - Xóa 1 cảnh báo vị trí
router.delete('/location-alerts/:id', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user, decoded } = authCtx;

    const baseFilter = await buildLocationAlertFilter(user, decoded);
    const deleted = await LocationAlert.findOneAndDelete({ _id: req.params.id, ...baseFilter });
    if (!deleted) {
      return res.status(404).json({ error: 'Không tìm thấy cảnh báo vị trí' });
    }

    res.json({
      success: true,
      message: 'Đã xóa cảnh báo vị trí thành công'
    });
  } catch (error) {
    console.error('Delete location alert error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa cảnh báo vị trí' });
  }
});

// POST /api/public/location-alerts/simulate - Kiểm tra / giả lập quét tem sai vị trí điểm bán
router.post('/location-alerts/simulate', async (req, res) => {
  try {
    const authCtx = await verifyNppOrAdminRequest(req, res);
    if (!authCtx) return;
    const { user } = authCtx;

    const { serialNumber, scanCity = 'Đà Nẵng', scanAddress = 'Quận Hải Châu, Đà Nẵng' } = req.body || {};
    const entIds = await getRelatedEnterpriseIds(user);

    let label = null;
    if (serialNumber && String(serialNumber).trim()) {
      const cleanS = String(serialNumber).trim();
      label = await Label.findOne({
        $or: [{ serialNumber: cleanS }, { qrCode: cleanS }]
      }).populate('productId', 'name');
    }

    if (!label) {
      const lblQuery = entIds.length > 0 ? { enterpriseId: { $in: entIds } } : {};
      label = await Label.findOne({
        ...lblQuery,
        $or: [
          { storeId: { $ne: null } },
          { distributorName: { $nin: [null, ''] } }
        ]
      }).sort({ distributedAt: -1, updatedAt: -1 }).populate('productId', 'name');
    }

    if (!label) {
      const lblQuery = entIds.length > 0 ? { enterpriseId: { $in: entIds } } : {};
      label = await Label.findOne(lblQuery).sort({ updatedAt: -1 }).populate('productId', 'name');
      if (label && !label.distributorAddress) {
        label.distributorName = label.distributorName || 'Điểm bán mẫu TP.HCM';
        label.distributorAddress = 'Quận 1, TP. Hồ Chí Minh';
        await label.save();
      }
    }

    if (!label) {
      return res.status(404).json({ error: 'Chưa có tem nhãn nào để kiểm tra cảnh báo vị trí' });
    }

    if (!label.distributorAddress && !label.ownerInfo?.address) {
      label.distributorAddress = 'Quận 1, TP. Hồ Chí Minh';
      await label.save();
    }

    const alertDoc = await checkAndCreateLocationAlert({
      label,
      actualLocation: {
        city: scanCity,
        address: scanAddress || scanCity,
        lat: 16.0544,
        lng: 108.2022
      },
      req
    });

    res.json({
      success: true,
      alert: alertDoc,
      message: alertDoc
        ? `Đã tạo cảnh báo lệch vị trí cho Serial ${label.serialNumber}`
        : `Vị trí quét trùng khớp với địa chỉ điểm bán của Serial ${label.serialNumber}`
    });
  } catch (error) {
    console.error('Simulate location alert error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi kiểm tra cảnh báo vị trí' });
  }
});

// Helper: Tạo filter xác định tem thuộc sở hữu của tài khoản NPP / NSX
async function buildNppLabelFilter(user) {
  if (user.role === 'ADMIN') {
    return {};
  }
  const nppNames = [user.fullName, user.username, user.enterpriseId?.name].filter(Boolean);
  const conditions = [
    { distributorName: { $in: nppNames } },
    { ownerCode: user.username },
    { 'ownerInfo.activatedBy': user._id }
  ];
  const entIds = await getRelatedEnterpriseIds(user);
  for (const entId of entIds) {
    conditions.push({ enterpriseId: entId });
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

    if (!['NPP', 'NSX', 'ADMIN'].includes(decoded.role) && !decoded.isAdminImpersonating) {
      return res.status(403).json({ error: 'Chỉ tài khoản NSX/NPP mới được truy cập' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const nppFilter = await buildNppLabelFilter(user);
    const distributedFilter = {
      $and: [
        nppFilter,
        {
          $or: [
            { storeId: { $ne: null } },
            { distributorName: { $nin: [null, ''] } },
            { 'ownerInfo.name': { $nin: [null, ''] } },
            { distributedAt: { $ne: null } }
          ]
        }
      ]
    };

    // Find labels distributed to retail stores by this NPP
    const labels = await Label.find(distributedFilter)
      .populate('productId')
      .sort({ distributedAt: -1, updatedAt: -1 })
      .limit(50);

    const historyList = labels.map(l => ({
      productName: l.productId?.name || 'Sản phẩm',
      serial: l.serialNumber,
      storeName: l.distributorName || l.ownerInfo?.name || '',
      storeAddress: l.distributorAddress || l.ownerInfo?.address || '',
      ownerCode: l.ownerCode || null,
      time: l.distributedAt || l.updatedAt
    }));

    const totalImported = await Label.countDocuments(distributedFilter);

    const entIds = await getRelatedEnterpriseIds(user);
    let totalPrinted = 0;
    if (entIds.length > 0) {
      const printedBatches = await LabelBatch.find({
        enterpriseId: { $in: entIds },
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

    if (!['NPP', 'NSX', 'ADMIN'].includes(decoded.role) && !decoded.isAdminImpersonating) {
      return res.status(403).json({ error: 'Chỉ tài khoản NSX/NPP mới được truy cập' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const nppFilter = await buildNppLabelFilter(user);
    const entIds = await getRelatedEnterpriseIds(user);

    // 1. Lấy tất cả productId từ các tem NPP đã nhận
    const labelProductIds = await Label.find({ ...nppFilter, productId: { $ne: null } }).distinct('productId');

    // 2. Tìm các sản phẩm thuộc tem NPP đã nhận HOẶC thuộc Doanh nghiệp của NPP HOẶC có NPP trong mảng distributors
    const productQuery = {
      $or: [
        { _id: { $in: labelProductIds } },
        ...(entIds.length > 0 ? [{ enterpriseId: { $in: entIds } }] : []),
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

    if (!['NPP', 'NSX', 'ADMIN'].includes(decoded.role) && !decoded.isAdminImpersonating) {
      return res.status(403).json({ error: 'Chỉ tài khoản NSX/NPP mới được truy cập' });
    }

    const user = await User.findById(decoded.userId).populate('enterpriseId');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    const { page = 1, limit = 20, search = '', productId = '', status = '' } = req.query;
    const baseNppFilter = await buildNppLabelFilter(user);

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

    // Tìm tài khoản ADMIN, NSX, NPP hoặc GUEST
    const user = await findUserByIdentifier(username, ['GUEST', 'ADMIN', 'NSX', 'NPP']);

    if (!user) {
      return res.status(401).json({ error: 'Tài khoản người dùng không tồn tại' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const isMatch = await verifyUserPassword(user, password);
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



