const express = require('express');
const Template = require('../models/Template');
const auth = require('../middleware/auth');
const { requireOwnership } = require('../middleware/rbac');

const router = express.Router();

// GET /api/templates
router.get('/', auth, requireOwnership, async (req, res) => {
  try {
    const filter = req.enterpriseFilter || {};
    const templates = await Template.find(filter)
      .populate('enterpriseId', 'name')
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/templates/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id).populate('enterpriseId', 'name');
    if (!template) return res.status(404).json({ error: 'Không tìm thấy template' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/templates
router.post('/', auth, requireOwnership, async (req, res) => {
  try {
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;
    const template = new Template({ ...req.body, enterpriseId });
    await template.save();
    
    const populated = await Template.findById(template._id).populate('enterpriseId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/templates/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('enterpriseId', 'name');

    if (!template) return res.status(404).json({ error: 'Không tìm thấy template' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ error: 'Không tìm thấy template' });
    res.json({ message: 'Xóa template thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
