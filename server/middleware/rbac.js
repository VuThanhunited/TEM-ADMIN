// Role-Based Access Control Middleware
const Enterprise = require('../models/Enterprise');

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getRelatedEnterpriseIds = async (enterpriseId) => {
  if (!enterpriseId) return [];
  const rawId = enterpriseId._id || enterpriseId;
  const ids = [rawId];
  try {
    let entName = enterpriseId.name;
    if (!entName) {
      const ent = await Enterprise.findById(rawId).select('name').lean();
      entName = ent?.name;
    }
    if (entName && String(entName).trim()) {
      const sameNameEnts = await Enterprise.find({
        name: { $regex: new RegExp(`^${escapeRegex(entName.trim())}$`, 'i') }
      }).select('_id').lean();
      for (const e of sameNameEnts) {
        if (!ids.some(id => String(id) === String(e._id))) {
          ids.push(e._id);
        }
      }
    }
  } catch (err) {
    // fallback to single id
  }
  return ids;
};

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
const requireOwnership = async (req, res, next) => {
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
  const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
  req.relatedEnterpriseIds = relatedIds;
  req.enterpriseFilter = relatedIds.length > 1
    ? { enterpriseId: { $in: relatedIds } }
    : { enterpriseId: req.user.enterpriseId._id || req.user.enterpriseId };
  next();
};

module.exports = { requireRole, requireOwnership, getRelatedEnterpriseIds };
