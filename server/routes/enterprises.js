const express = require('express');
const Enterprise = require('../models/Enterprise');
const auth = require('../middleware/auth');
const { requireOwnership } = require('../middleware/rbac');

const router = express.Router();

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
      const enterprises = await Enterprise.find().sort({ createdAt: -1 });
      return res.json(enterprises);
    }
    if (req.user.enterpriseId) {
      const enterprise = await Enterprise.findById(req.user.enterpriseId);
      return res.json(enterprise ? [enterprise] : []);
    }
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/enterprises/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.enterpriseId?.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa' });
    }

    const { name, address, phone, email, website, taxCode, logo } = req.body;
    const enterprise = await Enterprise.findByIdAndUpdate(
      req.params.id,
      { name, address, phone, email, website, taxCode, logo },
      { new: true }
    );
    if (!enterprise) return res.status(404).json({ error: 'Không tìm thấy doanh nghiệp' });
    res.json(enterprise);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
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

module.exports = router;
