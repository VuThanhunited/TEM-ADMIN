const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Enterprise = require('../models/Enterprise');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// GET /api/accounts/distributors - List all NPP accounts for the logged-in NSX
router.get('/distributors', auth, requireRole('NSX', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    // Non-admin can only see their own enterprise distributors
    const enterpriseId = req.user.role === 'ADMIN' ? req.query.enterpriseId : req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(400).json({ error: 'Thiếu mã doanh nghiệp' });
    }

    const query = { role: 'NPP', enterpriseId };
    
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

// POST /api/accounts/distributors - Create a new NPP account (distributor)
router.post('/distributors', auth, requireRole('NSX', 'ADMIN'), async (req, res) => {
  try {
    const { username, email, password, fullName, address } = req.body;
    
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(400).json({ error: 'Thiếu mã doanh nghiệp' });
    }

    // Check existing
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });
    }

    // Get enterprise to copy subscriptionExpiry
    const enterprise = await Enterprise.findById(enterpriseId);
    if (!enterprise) {
      return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
      address: address || '',
      role: 'NPP',
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

// PUT /api/accounts/distributors/:id - Update NPP account
router.put('/distributors/:id', auth, requireRole('NSX', 'ADMIN'), async (req, res) => {
  try {
    const { fullName, email, address, isActive, password } = req.body;

    const distributor = await User.findById(req.params.id);
    if (!distributor) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    // Security check: non-admin can only update their own enterprise's distributors
    if (req.user.role !== 'ADMIN' && distributor.enterpriseId?.toString() !== req.user.enterpriseId?.toString()) {
      return res.status(403).json({ error: 'Không có quyền truy cập tài khoản này' });
    }

    distributor.fullName = fullName !== undefined ? fullName : distributor.fullName;
    distributor.email = email !== undefined ? email : distributor.email;
    distributor.address = address !== undefined ? address : distributor.address;
    distributor.isActive = isActive !== undefined ? isActive : distributor.isActive;

    if (password) {
      distributor.password = await bcrypt.hash(password, 10);
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
    const query = { role: { $in: ['NSX', 'NPP'] } };
    
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
    const existing = await User.findOne({ $or: [{ username }, { email }] });
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
