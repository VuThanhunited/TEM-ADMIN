const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tem_admin_jwt_secret_key_2024_super_secure');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản đã bị vô hiệu hóa' });
    }

    // Check subscription expiry for non-admin users
    if (user.role !== 'ADMIN' && user.subscriptionExpiry) {
      if (new Date() > new Date(user.subscriptionExpiry)) {
        return res.status(403).json({ error: 'Tài khoản đã hết hạn. Vui lòng liên hệ Admin để gia hạn.' });
      }
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn' });
    }
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

module.exports = auth;
