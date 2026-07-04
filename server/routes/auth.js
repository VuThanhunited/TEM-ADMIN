const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    }).populate('enterpriseId');

    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }

    // GUEST không được đăng nhập vào hệ thống quản lý
    if (user.role === 'GUEST') {
      return res.status(403).json({ 
        error: 'Tài khoản khách hàng không có quyền truy cập hệ thống quản lý. Vui lòng liên hệ admin.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Check subscription (không áp dụng cho ADMIN)
    if (user.role !== 'ADMIN' && user.subscriptionExpiry) {
      if (new Date() > new Date(user.subscriptionExpiry)) {
        return res.status(403).json({ error: 'Tài khoản đã hết hạn. Vui lòng liên hệ Admin để gia hạn.' });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const userData = user.toObject();
    delete userData.password;

    res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});


// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('enterpriseId');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/auth/profile - Update own profile (for ADMIN, NSX, NPP)
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email, fullName, address, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // Check if new username already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
      }
      user.username = username;
    }

    // Check if new email already exists
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email đã tồn tại' });
      }
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    if (address !== undefined) user.address = address;

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
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật thông tin' });
  }
});

module.exports = router;
