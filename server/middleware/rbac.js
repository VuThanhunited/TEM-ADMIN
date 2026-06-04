// Role-Based Access Control Middleware

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Chưa xác thực' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập chức năng này' });
    }
    next();
  };
};

// Middleware to filter data by enterprise ownership
const requireOwnership = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Chưa xác thực' });
  }
  // Admin can see everything
  if (req.user.role === 'ADMIN') {
    return next();
  }
  // NSX/NPP can only see their own enterprise data
  if (!req.user.enterpriseId) {
    return res.status(403).json({ error: 'Tài khoản chưa được liên kết với doanh nghiệp' });
  }
  // Attach enterprise filter for subsequent queries
  req.enterpriseFilter = { enterpriseId: req.user.enterpriseId };
  next();
};

module.exports = { requireRole, requireOwnership };
