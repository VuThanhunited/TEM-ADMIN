const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Enterprise = require('../models/Enterprise');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

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

// PUT /api/accounts/:id - Update account
router.put('/:id', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { fullName, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, role, isActive },
      { new: true }
    ).select('-password').populate('enterpriseId');

    if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
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
