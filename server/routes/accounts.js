const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Enterprise = require('../models/Enterprise');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// GET /api/accounts/distributors - List all NPP / NSX accounts for the logged-in NSX
router.get('/distributors', auth, requireRole('NSX', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role } = req.query;
    
    // Non-admin can only see their own enterprise distributors
    // ADMIN: nếu không truyền enterpriseId thì xem tất cả
    const enterpriseId = req.user.role === 'ADMIN' ? req.query.enterpriseId : req.user.enterpriseId;
    if (!enterpriseId && req.user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Thiếu mã doanh nghiệp' });
    }

    const query = enterpriseId ? { enterpriseId } : {};
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
// username, email, password are auto-generated — frontend only needs: fullName, address, details, role
router.post('/distributors', auth, requireRole('NSX', 'ADMIN'), async (req, res) => {
  try {
    const { fullName, address, details, role = 'NPP' } = req.body;
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

    // Auto-generate unique username & email
    const timestamp = Date.now();
    const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || 'user';
    const autoUsername = `${slug}_${timestamp}`;
    const autoEmail = `${autoUsername}@internal.local`;
    const autoPassword = Math.random().toString(36).slice(2, 10); // random, not used for login
    const hashedPassword = await bcrypt.hash(autoPassword, 10);

    const user = new User({
      username: autoUsername,
      email: autoEmail,
      password: hashedPassword,
      fullName,
      address: address || '',
      details: details || '',
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
router.put('/distributors/:id', auth, requireRole('NSX', 'ADMIN'), async (req, res) => {
  try {
    const { fullName, address, details, isActive, role } = req.body;

    const distributor = await User.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    // Security check: non-admin can only update their own enterprise's distributors
    if (req.user.role !== 'ADMIN' && distributor.enterpriseId?.toString() !== req.user.enterpriseId?.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập tài khoản này' });
    }

    distributor.fullName = fullName !== undefined ? fullName : distributor.fullName;
    distributor.address = address !== undefined ? address : distributor.address;
    distributor.details = details !== undefined ? details : distributor.details;
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
router.delete('/distributors/:id', auth, requireRole('NSX', 'ADMIN'), async (req, res) => {
  try {
    const distributor = await User.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    // Security check: non-admin can only delete their own enterprise's distributors
    if (req.user.role !== 'ADMIN' && distributor.enterpriseId?.toString() !== req.user.enterpriseId?.toString()) {
      return res.status(403).json({ error: 'Không có quyền xóa tài khoản này' });
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
    const { username, email, password, fullName, role, enterpriseName, enterpriseType, subscriptionMonths = 12 } = req.body;

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

    // Create enterprise
    const enterprise = new Enterprise({
      name: enterpriseName || `${fullName} Enterprise`,
      type: enterpriseType || role,
      email
    });
    await enterprise.save();

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + parseInt(subscriptionMonths));

    const user = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
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
    const { username, email, password, fullName, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      user.username = username;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email đã tồn tại' });
      user.email = email;
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

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
