const express = require('express');
const Enterprise = require('../models/Enterprise');
const auth = require('../middleware/auth');
const { requireOwnership } = require('../middleware/rbac');

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
      .select('fullName address phone email details logo role enterpriseId')
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
      .select('name address phone email logo partnerDetails type')
      .sort({ name: 1 })
      .lean();

    if (enterpriseNSXList.length === 0 && req.user.role === 'ADMIN') {
      enterpriseNSXList = await Enterprise.find({ isActive: true })
        .select('name address phone email logo partnerDetails type')
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

// GET /api/enterprises/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const enterprise = await Enterprise.findById(req.params.id);
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });

    // Non-admin users can only view their own enterprise
    if (req.user.role !== 'ADMIN' && req.user.enterpriseId?.toString() !== enterprise._id.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
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
      const enterprises = await Enterprise.find().select('name type address logo domain').sort({ createdAt: -1 }).lean();
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
    if (req.user.role !== 'ADMIN' && req.user.enterpriseId?.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa' });
    }

    const { name, type, address, phone, email, website, taxCode, logo, partnerDetails, domain, subdomain, chatbotConfig, displayConfig } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (taxCode !== undefined) updateData.taxCode = taxCode;
    if (logo !== undefined) updateData.logo = logo;
    if (partnerDetails !== undefined) updateData.partnerDetails = partnerDetails;
    if (domain !== undefined) updateData.domain = domain;
    if (subdomain !== undefined) updateData.subdomain = subdomain;
    if (chatbotConfig !== undefined) updateData.chatbotConfig = chatbotConfig;
    if (displayConfig !== undefined) updateData.displayConfig = displayConfig;

    const enterprise = await Enterprise.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
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
