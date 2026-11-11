const express = require('express');
const Enterprise = require('../models/Enterprise');
const auth = require('../middleware/auth');
const { requireOwnership, getRelatedEnterpriseIds } = require('../middleware/rbac');

const router = express.Router();

// GET /api/enterprises/manufacturers - Lấy danh sách Nhà Sản Xuất (từ cả Quản lý NSX/NPP và Doanh nghiệp)
router.get('/manufacturers', auth, async (req, res) => {
  try {
    const User = require('../models/User');

    // 1. Lấy danh sách NSX từ User collection (được tạo ở menu "Quản lý NSX / NPP / Điểm bán")
    const userQuery = { role: 'NSX', isActive: { $ne: false } };
    if (req.user.role !== 'ADMIN' && req.user.enterpriseId) {
      userQuery.enterpriseId = req.user.enterpriseId;
    }
    const userNSXList = await User.find(userQuery)
      .select('fullName address phone email details logo hasGeographicalIndication role enterpriseId')
      .sort({ fullName: 1 })
      .lean();

    // 2. Lấy danh sách NSX từ Enterprise collection (được tạo ở menu "Cấu hình Doanh nghiệp")
    const entQuery = { isActive: true };
    if (req.user.role !== 'ADMIN' && req.user.enterpriseId) {
      entQuery._id = req.user.enterpriseId;
    } else {
      entQuery.type = 'NSX';
    }
    let enterpriseNSXList = await Enterprise.find(entQuery)
      .select('name address phone email logo partnerDetails hasGeographicalIndication type')
      .sort({ name: 1 })
      .lean();

    if (enterpriseNSXList.length === 0 && req.user.role === 'ADMIN') {
      enterpriseNSXList = await Enterprise.find({ isActive: true })
        .select('name address phone email logo partnerDetails hasGeographicalIndication type')
        .sort({ name: 1 })
        .lean();
    }

    // Chuẩn hóa và gộp 2 danh sách
    const normalizedUserNSX = (userNSXList || []).map(u => ({
      _id: u._id,
      name: u.fullName || '',
      address: u.address || '',
      phone: u.phone || '',
      email: u.email || '',
      partnerDetails: u.details || '',
      logo: u.logo || null,
      hasGeographicalIndication: Boolean(u.hasGeographicalIndication),
      source: 'USER_NSX',
      isEnterprise: false
    }));

    const normalizedEntNSX = (enterpriseNSXList || []).map(e => ({
      _id: e._id,
      name: e.name || '',
      address: e.address || '',
      phone: e.phone || '',
      email: e.email || '',
      partnerDetails: e.partnerDetails || '',
      logo: e.logo || null,
      hasGeographicalIndication: Boolean(e.hasGeographicalIndication),
      source: 'ENTERPRISE_NSX',
      isEnterprise: true
    }));

    // Đưa các NSX đối tác lên đầu, sau đó đến doanh nghiệp sở hữu
    res.json([...normalizedUserNSX, ...normalizedEntNSX]);
  } catch (error) {
    console.error('Get manufacturers error:', error);
    res.status(500).json({ error: 'Lỗi lấy danh sách nhà sản xuất: ' + error.message });
  }
});

// Helper: Lấy danh sách đầy đủ các Đơn vị (Doanh nghiệp + NSX/NPP) kèm sản phẩm đại diện để ghép vùng phân phối
async function buildRegionUnitsList() {
  const User = require('../models/User');
  const Product = require('../models/Product');

  const [enterprises, users, products] = await Promise.all([
    Enterprise.find({ isActive: true })
      .select('name type address phone email logo partnerDetails hasGeographicalIndication region')
      .sort({ createdAt: -1 })
      .lean(),
    User.find({ isActive: { $ne: false } })
      .select('username fullName role address phone email details logo hasGeographicalIndication region shortIntro scale foragingArea cert enterpriseId')
      .sort({ createdAt: -1 })
      .lean(),
    Product.find({})
      .select('name images description enterpriseId manufacturerId hasGeographicalIndication theme category')
      .sort({ createdAt: -1 })
      .lean()
  ]);

  const ownerByEntId = new Map();
  for (const u of users) {
    if (u.enterpriseId && u.username && !ownerByEntId.has(String(u.enterpriseId))) {
      ownerByEntId.set(String(u.enterpriseId), u);
    }
  }

  const productByEntId = new Map();
  const productByMfgId = new Map();
  for (const p of products) {
    if (p.enterpriseId && !productByEntId.has(String(p.enterpriseId))) {
      productByEntId.set(String(p.enterpriseId), p);
    }
    if (p.manufacturerId && !productByMfgId.has(String(p.manufacturerId))) {
      productByMfgId.set(String(p.manufacturerId), p);
    }
  }

  const resultUnits = [];
  const seenEntNames = new Set();

  for (const ent of enterprises) {
    const owner = ownerByEntId.get(String(ent._id));
    const prod = productByEntId.get(String(ent._id)) || productByMfgId.get(String(ent._id));
    const unitName = (ent.name || owner?.fullName || '').trim();
    if (!unitName) continue;
    seenEntNames.add(unitName.toLowerCase());

    const rawDetails = ent.partnerDetails || owner?.details || prod?.description || '';
    const stripHtml = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
    const cleanText = stripHtml(rawDetails);

    resultUnits.push({
      id: String(ent._id),
      _id: ent._id,
      unitSource: 'ENTERPRISE',
      name: unitName,
      productName: prod?.name || '',
      address: ent.address || owner?.address || '',
      phone: ent.phone || owner?.phone || '',
      email: ent.email || owner?.email || '',
      image: prod?.images?.[0] || ent.logo || owner?.logo || '/images/honey/honey_dist_dong_van.png',
      logo: ent.logo || owner?.logo || prod?.images?.[0] || '',
      partnerDetails: rawDetails,
      details: rawDetails,
      shortIntro: owner?.shortIntro || (cleanText ? (cleanText.length > 180 ? `${cleanText.slice(0, 180)}...` : cleanText) : ''),
      scale: owner?.scale || 'Cơ sở nuôi ong & khai thác tiêu chuẩn',
      foragingArea: owner?.foragingArea || ent.address || owner?.address || '',
      cert: owner?.cert || '',
      hasGeographicalIndication: Boolean(ent.hasGeographicalIndication || owner?.hasGeographicalIndication || prod?.hasGeographicalIndication),
      region: ent.region || owner?.region || ''
    });
  }

  for (const u of users) {
    if (!['NSX', 'NPP'].includes(u.role)) continue;
    const unitName = (u.fullName || u.username || '').trim();
    if (!unitName) continue;
    // Nếu trùng tên với Doanh nghiệp chủ sở hữu và là chủ tài khoản của doanh nghiệp đó thì gộp vào Enterprise ở trên
    if (u.username && seenEntNames.has(unitName.toLowerCase())) continue;

    const prod = productByMfgId.get(String(u._id)) || (u.enterpriseId ? productByEntId.get(String(u.enterpriseId)) : null);
    const rawDetails = u.details || prod?.description || '';
    const stripHtml = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
    const cleanText = stripHtml(rawDetails);

    resultUnits.push({
      id: String(u._id),
      _id: u._id,
      unitSource: 'USER',
      name: unitName,
      productName: prod?.name || '',
      address: u.address || '',
      phone: u.phone || '',
      email: u.email || '',
      image: u.logo || prod?.images?.[0] || '/images/honey/honey_dist_dong_van.png',
      logo: u.logo || prod?.images?.[0] || '',
      partnerDetails: rawDetails,
      details: rawDetails,
      shortIntro: u.shortIntro || (cleanText ? (cleanText.length > 180 ? `${cleanText.slice(0, 180)}...` : cleanText) : ''),
      scale: u.scale || 'Cơ sở nuôi ong & khai thác tiêu chuẩn',
      foragingArea: u.foragingArea || u.address || '',
      cert: u.cert || '',
      hasGeographicalIndication: Boolean(u.hasGeographicalIndication || prod?.hasGeographicalIndication),
      region: u.region || ''
    });
  }

  return resultUnits;
}

// GET /api/enterprises/region-units - Lấy danh sách các đơn vị để ghép vùng phân phối (Khối 7)
router.get('/region-units', auth, async (req, res) => {
  try {
    const units = await buildRegionUnitsList();
    res.json({ success: true, units, data: units });
  } catch (error) {
    console.error('Get region units error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách đơn vị ghép vùng' });
  }
});

// POST /api/enterprises/assign-region - Ghép đơn vị vào vùng phân phối (Đồng Văn | Mèo Vạc | Yên Minh)
router.post('/assign-region', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const { unitId, unitSource, region, hasGeographicalIndication } = req.body || {};
    if (!unitId) {
      return res.status(400).json({ error: 'Vui lòng chọn đơn vị ghép vùng!' });
    }

    const cleanRegion = ['dong_van', 'meo_vac', 'yen_minh', ''].includes(String(region || '').trim())
      ? String(region || '').trim()
      : '';

    const updateFields = { region: cleanRegion };
    if (hasGeographicalIndication !== undefined) {
      updateFields.hasGeographicalIndication = Boolean(hasGeographicalIndication);
    }

    let updated = false;
    if (unitSource === 'ENTERPRISE') {
      const ent = await Enterprise.findByIdAndUpdate(unitId, { $set: updateFields }, { new: true });
      if (ent) {
        updated = true;
        await User.updateMany(
          { enterpriseId: ent._id, username: { $exists: true, $ne: null } },
          { $set: updateFields }
        );
      }
    } else if (unitSource === 'USER') {
      const u = await User.findByIdAndUpdate(unitId, { $set: updateFields }, { new: true });
      if (u) updated = true;
    }

    if (!updated) {
      const ent = await Enterprise.findByIdAndUpdate(unitId, { $set: updateFields }, { new: true });
      if (ent) {
        updated = true;
        await User.updateMany(
          { enterpriseId: ent._id, username: { $exists: true, $ne: null } },
          { $set: updateFields }
        );
      } else {
        const u = await User.findByIdAndUpdate(unitId, { $set: updateFields }, { new: true });
        if (u) updated = true;
      }
    }

    if (!updated) {
      return res.status(404).json({ error: 'Không tìm thấy đơn vị đã chọn!' });
    }

    const units = await buildRegionUnitsList();
    const matchedUnit = units.find(u => String(u.id) === String(unitId)) || null;

    res.json({
      success: true,
      unit: matchedUnit,
      units,
      message: cleanRegion
        ? `Đã ghép đơn vị "${matchedUnit?.name || ''}" vào vùng thành công!`
        : `Đã huỷ ghép vùng cho đơn vị "${matchedUnit?.name || ''}"!`
    });
  } catch (error) {
    console.error('Assign region error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi ghép vùng phân phối: ' + error.message });
  }
});

// GET /api/enterprises/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const enterprise = await Enterprise.findById(req.params.id);
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });

    // Non-admin users can only view their own enterprise
    if (req.user.role !== 'ADMIN') {
      const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
      if (!relatedIds.some(id => String(id) === String(enterprise._id))) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
      }
    }
    res.json(enterprise);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/enterprises - List all (Admin) or own enterprise
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const enterprises = await Enterprise.find().select('name type address logo bannerImage domain subdomain displayConfig brandConfig phone email website taxCode partnerDetails hasGeographicalIndication region chatbotConfig isActive').sort({ createdAt: -1 }).lean();
      return res.json(enterprises);
    }
    if (req.user.enterpriseId) {
      const enterprise = await Enterprise.findById(req.user.enterpriseId).lean();
      return res.json(enterprise ? [enterprise] : []);
    }
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/enterprises/:id - Update enterprise details
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
      if (!relatedIds.some(id => String(id) === String(req.params.id))) {
        return res.status(403).json({ error: 'Không có quyền chỉnh sửa' });
      }
    }

    const { name, type, address, phone, email, website, taxCode, logo, bannerImage, brandConfig, partnerDetails, hasGeographicalIndication, region, domain, subdomain, chatbotConfig, displayConfig } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (taxCode !== undefined) updateData.taxCode = taxCode;
    if (logo !== undefined) updateData.logo = logo;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (brandConfig !== undefined) updateData.brandConfig = brandConfig;
    if (partnerDetails !== undefined) updateData.partnerDetails = partnerDetails;
    if (hasGeographicalIndication !== undefined) updateData.hasGeographicalIndication = Boolean(hasGeographicalIndication);
    if (region !== undefined) updateData.region = String(region || '').trim();
    if (domain !== undefined) updateData.domain = domain;
    if (subdomain !== undefined) updateData.subdomain = subdomain;
    if (chatbotConfig !== undefined) updateData.chatbotConfig = chatbotConfig;
    if (displayConfig !== undefined) {
      const existingEnt = await Enterprise.findById(req.params.id).select('displayConfig').lean();
      const existingDisplay = existingEnt?.displayConfig || {};
      updateData.displayConfig = {
        ...existingDisplay,
        ...displayConfig,
        themeContents: displayConfig.themeContents !== undefined
          ? displayConfig.themeContents
          : (existingDisplay.themeContents || {})
      };
    }

    const enterprise = await Enterprise.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });

    // Đồng bộ địa chỉ, liên hệ, logo, chỉ dẫn địa lý sang tài khoản chủ sở hữu doanh nghiệp
    try {
      const User = require('../models/User');
      const userSync = {};
      if (address !== undefined) userSync.address = address;
      if (phone !== undefined) userSync.phone = phone;
      if (logo !== undefined) userSync.logo = logo;
      if (hasGeographicalIndication !== undefined) userSync.hasGeographicalIndication = Boolean(hasGeographicalIndication);
      if (Object.keys(userSync).length > 0) {
        await User.updateMany(
          { enterpriseId: enterprise._id, username: { $exists: true, $ne: null } },
          { $set: userSync }
        );
      }
    } catch (syncErr) {
      console.error('Sync enterprise to owner user error (non-fatal):', syncErr.message);
    }

    res.json(enterprise);
  } catch (error) {
    console.error('Update enterprise error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật doanh nghiệp: ' + error.message });
  }
});

// PUT /api/enterprises/:id/domain
router.put('/:id/domain', auth, async (req, res) => {
  try {
    const { domain, subdomain } = req.body;
    const enterprise = await Enterprise.findByIdAndUpdate(
      req.params.id,
      { domain, subdomain },
      { new: true }
    );
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    res.json(enterprise);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/enterprises/:id/chatbot
router.put('/:id/chatbot', auth, async (req, res) => {
  try {
    const { chatbotConfig } = req.body;
    const enterprise = await Enterprise.findByIdAndUpdate(
      req.params.id,
      { chatbotConfig },
      { new: true }
    );
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    res.json(enterprise);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PATCH /api/enterprises/:id/toggle-related-products - Bật/tắt nhanh hiển thị sản phẩm liên quan
router.patch('/:id/toggle-related-products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.enterpriseId?.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa' });
    }
    const enterprise = await Enterprise.findById(req.params.id);
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });

    if (!enterprise.displayConfig) {
      enterprise.displayConfig = { showRelatedProducts: true, defaultTheme: 'default' };
    }

    const currentVal = enterprise.displayConfig.showRelatedProducts !== false;
    const newVal = req.body.showRelatedProducts !== undefined 
      ? Boolean(req.body.showRelatedProducts) 
      : !currentVal;

    enterprise.displayConfig.showRelatedProducts = newVal;
    enterprise.markModified('displayConfig');
    await enterprise.save();

    res.json({
      success: true,
      enterprise,
      showRelatedProducts: newVal,
      message: `Đã ${newVal ? 'bật' : 'tắt'} hiển thị sản phẩm liên quan thành công`
    });
  } catch (error) {
    console.error('Toggle related products error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật hiển thị sản phẩm liên quan: ' + error.message });
  }
});

// PUT /api/enterprises/:id/theme-content - Lưu cấu hình nội dung chi tiết cho từng giao diện tem (Theme Content Builder)
router.put('/:id/theme-content', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
      if (!relatedIds.some(id => String(id) === String(req.params.id))) {
        return res.status(403).json({ error: 'Không có quyền chỉnh sửa cấu hình giao diện của doanh nghiệp này' });
      }
    }

    const { themeKey, content, productId, setAsDefaultTheme } = req.body || {};
    if (!themeKey) {
      return res.status(400).json({ error: 'Thiếu mã giao diện (themeKey) cần lưu nội dung' });
    }

    const enterprise = await Enterprise.findById(req.params.id);
    if (!enterprise) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    }

    // Nếu lưu ghi đè riêng cho 1 Sản phẩm cụ thể
    if (productId) {
      const Product = require('../models/Product');
      const prod = await Product.findOne({ _id: productId, enterpriseId: enterprise._id });
      if (!prod) {
        return res.status(404).json({ error: 'Không tìm thấy sản phẩm thuộc doanh nghiệp này' });
      }
      const existingOverrides = (prod.themeContentOverride && typeof prod.themeContentOverride === 'object')
        ? prod.themeContentOverride
        : {};
      if (content === null) {
        delete existingOverrides[themeKey];
        prod.themeContentOverride = Object.keys(existingOverrides).length > 0 ? { ...existingOverrides } : null;
      } else {
        prod.themeContentOverride = {
          ...existingOverrides,
          [themeKey]: content
        };
      }
      prod.markModified('themeContentOverride');
      await prod.save();
      return res.json({
        success: true,
        product: prod,
        themeKey,
        themeContent: prod.themeContentOverride?.[themeKey] || null,
        message: content === null
          ? `Đã khôi phục nội dung mặc định cho sản phẩm "${prod.name}"`
          : `Đã lưu nội dung giao diện riêng cho sản phẩm "${prod.name}"!`
      });
    }

    // Lưu cấu hình nội dung theo Doanh nghiệp + Giao diện (Enterprise.displayConfig.themeContents[themeKey])
    if (!enterprise.displayConfig || typeof enterprise.displayConfig !== 'object') {
      enterprise.displayConfig = {
        showRelatedProducts: true,
        defaultTheme: 'default',
        distributionBannerText: '',
        bannerImage: '',
        themeContents: {}
      };
    }

    const currentThemeContents =
      enterprise.displayConfig.themeContents && typeof enterprise.displayConfig.themeContents === 'object'
        ? { ...enterprise.displayConfig.themeContents }
        : {};

    if (content === null) {
      delete currentThemeContents[themeKey];
    } else {
      currentThemeContents[themeKey] = content;
    }

    enterprise.displayConfig.themeContents = currentThemeContents;
    if (setAsDefaultTheme) {
      enterprise.displayConfig.defaultTheme = themeKey;
    }
    enterprise.markModified('displayConfig');
    await enterprise.save();

    res.json({
      success: true,
      enterprise,
      themeKey,
      themeContent: currentThemeContents[themeKey] || null,
      message: content === null
        ? 'Đã khôi phục nội dung giao diện về mặc định!'
        : 'Đã lưu thay đổi nội dung giao diện thành công!'
    });
  } catch (error) {
    console.error('Save theme content error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu nội dung giao diện: ' + error.message });
  }
});


// POST /api/enterprises - Create new enterprise (Admin, NSX, NPP)
router.post('/', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const { name, type = 'NSX', address, phone, email, website, taxCode, logo, partnerDetails } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên doanh nghiệp không được để trống' });
    }

    const enterprise = new Enterprise({
      name: name.trim(),
      type,
      address: address || '',
      phone: phone || '',
      email: email || '',
      website: website || '',
      taxCode: taxCode || '',
      partnerDetails: partnerDetails || '',
      logo: logo || null
    });

    await enterprise.save();

    // Link newly created enterprise to current user if they don't have one
    if (!req.user.enterpriseId) {
      await User.findByIdAndUpdate(req.user._id, { enterpriseId: enterprise._id });
    }

    res.status(201).json(enterprise);
  } catch (error) {
    console.error('Create enterprise error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo doanh nghiệp: ' + error.message });
  }
});

// DELETE /api/enterprises/:id - Delete enterprise (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ Admin mới có quyền xóa doanh nghiệp' });
    }

    const enterprise = await Enterprise.findByIdAndDelete(req.params.id);
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });

    res.json({ message: 'Đã xóa doanh nghiệp thành công' });
  } catch (error) {
    console.error('Delete enterprise error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa doanh nghiệp' });
  }
});

module.exports = router;
