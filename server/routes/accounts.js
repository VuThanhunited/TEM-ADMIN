const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Enterprise = require('../models/Enterprise');
const auth = require('../middleware/auth');
const { requireRole, getRelatedEnterpriseIds } = require('../middleware/rbac');

const router = express.Router();

// GET /api/accounts/distributors - List all NPP / NSX accounts for the logged-in TK khách (NSX/NPP) or ADMIN
router.get('/distributors', auth, requireRole('NSX', 'NPP', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role } = req.query;
    
    // Non-admin can only see their own enterprise distributors (ko xem npp của đối tác khác đc)
    // ADMIN: nếu không truyền enterpriseId thì xem tất cả
    const query = {};
    if (req.user.role === 'ADMIN') {
      if (req.query.enterpriseId) {
        query.enterpriseId = req.query.enterpriseId;
      }
    } else {
      if (!req.user.enterpriseId) {
        return res.status(400).json({ error: 'Thiếu mã doanh nghiệp' });
      }
      const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
      query.enterpriseId = relatedIds.length > 1 ? { $in: relatedIds } : relatedIds[0];
    }

    if (role) {
      query.role = role;
    } else {
      query.role = { $in: ['NPP', 'NSX'] };
    }
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const distributors = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      data: distributors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/accounts/distributors - Create a new NPP / NSX account (distributor/manufacturer)
router.post('/distributors', auth, requireRole('NSX', 'NPP', 'ADMIN'), async (req, res) => {
  try {
    const {
      fullName, address, phone, details, role = 'NPP', username, password,
      logo, region, shortIntro, scale, foragingArea, cert, hasGeographicalIndication
    } = req.body;
    const allowedRole = ['NPP', 'NSX'].includes(role) ? role : 'NPP';

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đơn vị' });
    }
    
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(400).json({ error: 'Thiếu mã doanh nghiệp' });
    }

    // Get enterprise to copy subscriptionExpiry
    const enterprise = await Enterprise.findById(enterpriseId);
    if (!enterprise) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    }

    const timestamp = Date.now();
    const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';
    const finalUsername = (username && String(username).trim()) ? String(username).trim() : `${slug}_${timestamp}`;

    if (username && String(username).trim()) {
      const existing = await User.findOne({
        username: { $regex: new RegExp(`^${finalUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác' });
      }
    }

    const autoEmail = `${finalUsername}_${timestamp}@internal.local`;
    const rawPassword = (password && String(password).trim()) ? String(password).trim() : Math.random().toString(36).slice(2, 10);
    if (password && rawPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = new User({
      username: finalUsername,
      email: autoEmail,
      password: hashedPassword,
      fullName: fullName.trim(),
      phone: phone ? String(phone).trim() : '',
      address: address || '',
      details: details || '',
      logo: logo || null,
      region: region || '',
      shortIntro: shortIntro || '',
      scale: scale || '',
      foragingArea: foragingArea || '',
      cert: cert || '',
      hasGeographicalIndication: Boolean(hasGeographicalIndication),
      role: allowedRole,
      enterpriseId,
      subscriptionExpiry: enterprise.subscriptionExpiry
    });
    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json(userData);
  } catch (error) {
    console.error('Create distributor error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/accounts/distributors/:id - Update NPP / NSX account
router.put('/distributors/:id', auth, requireRole('NSX', 'NPP', 'ADMIN'), async (req, res) => {
  try {
    const {
      fullName, address, phone, details, isActive, role, username, password,
      logo, region, shortIntro, scale, foragingArea, cert, hasGeographicalIndication
    } = req.body;

    const distributor = await User.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    // Security check: non-admin can only update their own enterprise's distributors
    if (req.user.role !== 'ADMIN') {
      const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
      if (!relatedIds.some(id => String(id) === String(distributor.enterpriseId))) {
        return res.status(403).json({ error: 'Không có quyền truy cập tài khoản của đối tác khác' });
      }
    }

    if (username && String(username).trim() && String(username).trim() !== distributor.username) {
      const cleanU = String(username).trim();
      const existing = await User.findOne({
        _id: { $ne: distributor._id },
        username: { $regex: new RegExp(`^${cleanU.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại' });
      }
      distributor.username = cleanU;
    }

    if (password && String(password).trim()) {
      const cleanP = String(password).trim();
      if (cleanP.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      distributor.password = await bcrypt.hash(cleanP, 10);
    }

    distributor.fullName = fullName !== undefined ? fullName : distributor.fullName;
    distributor.address = address !== undefined ? address : distributor.address;
    distributor.phone = phone !== undefined ? phone : distributor.phone;
    distributor.details = details !== undefined ? details : distributor.details;
    if (logo !== undefined) distributor.logo = logo || null;
    if (region !== undefined) distributor.region = region || '';
    if (shortIntro !== undefined) distributor.shortIntro = shortIntro || '';
    if (scale !== undefined) distributor.scale = scale || '';
    if (foragingArea !== undefined) distributor.foragingArea = foragingArea || '';
    if (cert !== undefined) distributor.cert = cert || '';
    if (hasGeographicalIndication !== undefined) distributor.hasGeographicalIndication = Boolean(hasGeographicalIndication);
    distributor.isActive = isActive !== undefined ? isActive : distributor.isActive;
    if (role !== undefined && ['NPP', 'NSX'].includes(role)) {
      distributor.role = role;
    }

    await distributor.save();

    const userData = distributor.toObject();
    delete userData.password;

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// DELETE /api/accounts/distributors/:id - Delete NPP account
router.delete('/distributors/:id', auth, requireRole('NSX', 'NPP', 'ADMIN'), async (req, res) => {
  try {
    const distributor = await User.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    // Security check: non-admin can only delete their own enterprise's distributors
    if (req.user.role !== 'ADMIN') {
      const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
      if (!relatedIds.some(id => String(id) === String(distributor.enterpriseId))) {
        return res.status(403).json({ error: 'Không có quyền xóa tài khoản của đối tác khác' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/accounts - List all NSX/NPP accounts (Admin only)
router.get('/', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const query = { role: { $in: ['NSX', 'NPP', 'GUEST'] } };
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const accounts = await User.find(query)
      .select('-password')
      .populate('enterpriseId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      data: accounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/accounts - Create new account with enterprise
router.post('/', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const {
      username, email, password, fullName, role, enterpriseId, enterpriseName, enterpriseType,
      subscriptionMonths = 12, phone, address, logo, hasGeographicalIndication
    } = req.body;

    // Check existing
    const existing = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }
      ]
    });
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });
    }

    // Link existing enterprise or create new one
    let enterprise = null;
    if (enterpriseId) {
      enterprise = await Enterprise.findById(enterpriseId);
    }
    if (!enterprise && enterpriseName && enterpriseName.trim()) {
      enterprise = await Enterprise.findOne({
        name: { $regex: new RegExp(`^${enterpriseName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
    }
    if (!enterprise) {
      enterprise = new Enterprise({
        name: enterpriseName || `${fullName} Enterprise`,
        type: enterpriseType || role,
        email,
        phone: phone ? String(phone).trim() : '',
        address: address ? String(address).trim() : '',
        logo: logo || null,
        hasGeographicalIndication: Boolean(hasGeographicalIndication)
      });
      await enterprise.save();
    } else {
      let entChanged = false;
      if (phone && !enterprise.phone) { enterprise.phone = String(phone).trim(); entChanged = true; }
      if (address && !enterprise.address) { enterprise.address = String(address).trim(); entChanged = true; }
      if (logo && !enterprise.logo) { enterprise.logo = logo; entChanged = true; }
      if (hasGeographicalIndication !== undefined) { enterprise.hasGeographicalIndication = Boolean(hasGeographicalIndication); entChanged = true; }
      if (entChanged) await enterprise.save();
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + parseInt(subscriptionMonths));

    const user = new User({
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      fullName,
      phone: phone ? String(phone).trim() : (enterprise?.phone || ''),
      address: address ? String(address).trim() : (enterprise?.address || ''),
      logo: logo || enterprise?.logo || null,
      hasGeographicalIndication: Boolean(hasGeographicalIndication ?? enterprise?.hasGeographicalIndication),
      role,
      enterpriseId: enterprise._id,
      subscriptionExpiry: expiry
    });
    await user.save();

    const userData = user.toObject();
    delete userData.password;
    userData.enterpriseId = enterprise;

    res.status(201).json(userData);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/accounts/:id - Update account (Admin only)
router.put('/:id', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const {
      username, email, password, fullName, role, isActive, enterpriseId,
      enterpriseName, phone, address, logo, hasGeographicalIndication
    } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    if (username && username.trim() !== user.username) {
      const existing = await User.findOne({ _id: { $ne: user._id }, username: username.trim() });
      if (existing) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      user.username = username.trim();
    }

    if (email && email.trim() !== user.email) {
      const existing = await User.findOne({ _id: { $ne: user._id }, email: email.trim() });
      if (existing) return res.status(400).json({ error: 'Email đã tồn tại' });
      user.email = email.trim();
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = String(phone).trim();
    if (address !== undefined) user.address = String(address).trim();
    if (logo !== undefined) user.logo = logo || null;
    if (hasGeographicalIndication !== undefined) user.hasGeographicalIndication = Boolean(hasGeographicalIndication);
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (enterpriseId !== undefined && enterpriseId) user.enterpriseId = enterpriseId;

    if (password) {
      if (password.length < 4) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 4 ký tự' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Đồng bộ thông tin sang Doanh nghiệp sở hữu của tài khoản (Enterprise)
    if (user.enterpriseId) {
      const entUpdate = {};
      if (enterpriseName && enterpriseName.trim()) entUpdate.name = enterpriseName.trim();
      else if (fullName && fullName.trim()) entUpdate.name = fullName.trim();
      if (phone !== undefined) entUpdate.phone = String(phone).trim();
      if (address !== undefined) entUpdate.address = String(address).trim();
      if (logo !== undefined) entUpdate.logo = logo || null;
      if (hasGeographicalIndication !== undefined) entUpdate.hasGeographicalIndication = Boolean(hasGeographicalIndication);
      if (Object.keys(entUpdate).length > 0) {
        await Enterprise.findByIdAndUpdate(user.enterpriseId, { $set: entUpdate });
      }
    }

    const userData = await User.findById(user._id).select('-password').populate('enterpriseId');
    res.json(userData);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật tài khoản' });
  }
});

// PUT /api/accounts/:id/renew - Renew subscription
router.put('/:id/renew', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { months = 12 } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });

    const currentExpiry = user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date()
      ? new Date(user.subscriptionExpiry)
      : new Date();
    
    currentExpiry.setMonth(currentExpiry.getMonth() + parseInt(months));
    user.subscriptionExpiry = currentExpiry;
    user.isActive = true;
    await user.save();

    // Also update enterprise
    if (user.enterpriseId) {
      await Enterprise.findByIdAndUpdate(user.enterpriseId, {
        subscriptionExpiry: currentExpiry,
        isActive: true
      });
    }

    const userData = await User.findById(user._id).select('-password').populate('enterpriseId');
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/accounts/backup-database - Download full JSON backup of database (Admin only)
router.get('/backup-database', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const Label = require('../models/Label');
    const LabelBatch = require('../models/LabelBatch');
    const LabelDesign = require('../models/LabelDesign');
    const Product = require('../models/Product');
    const ScanLog = require('../models/ScanLog');
    const Template = require('../models/Template');
    const Contact = require('../models/Contact');

    const [users, enterprises, products, labelBatches, labels, labelDesigns, templates, scanLogs, contacts] = await Promise.all([
      User.find().select('-password'),
      Enterprise.find(),
      Product.find(),
      LabelBatch.find(),
      Label.find(),
      LabelDesign.find(),
      Template.find(),
      ScanLog.find(),
      Contact.find()
    ]);

    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      system: 'TEM QR CODE & BẢO HÀNH',
      counts: {
        users: users.length,
        enterprises: enterprises.length,
        products: products.length,
        labelBatches: labelBatches.length,
        labels: labels.length,
        labelDesigns: labelDesigns.length,
        templates: templates.length,
        scanLogs: scanLogs.length,
        contacts: contacts.length
      },
      data: {
        users,
        enterprises,
        products,
        labelBatches,
        labels,
        labelDesigns,
        templates,
        scanLogs,
        contacts
      }
    };

    const fileName = `database_backup_${new Date().toISOString().slice(0,10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi sao lưu dữ liệu' });
  }
});

// DELETE /api/accounts/:id
router.delete('/:id', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    res.json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
