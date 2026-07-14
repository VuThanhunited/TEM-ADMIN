const express = require('express');
const LabelDesign = require('../models/LabelDesign');
const auth = require('../middleware/auth');
const { requireRole, requireOwnership } = require('../middleware/rbac');

const router = express.Router();

// GET /api/label-designs
router.get('/', auth, requireOwnership, async (req, res) => {
  try {
    const filter = req.enterpriseFilter || {};
    const designs = await LabelDesign.find(filter)
      .populate('enterpriseId', 'name')
      .sort({ createdAt: -1 });
    res.json(designs);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách mẫu tem' });
  }
});

// GET /api/label-designs/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const design = await LabelDesign.findById(req.params.id).populate('enterpriseId', 'name');
    if (!design) return res.status(404).json({ error: 'Không tìm thấy mẫu tem' });
    res.json(design);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/label-designs
router.post('/', auth, requireRole('ADMIN', 'NSX'), requireOwnership, async (req, res) => {
  try {
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(400).json({ error: 'Yêu cầu thông tin doanh nghiệp sở hữu' });
    }

    const { name, image, fileData, fileName, size } = req.body;
    if (!name || !image || !size) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: Tên mẫu tem, hình ảnh hoặc kích thước' });
    }

    const design = new LabelDesign({
      name,
      image,
      fileData,
      fileName,
      size,
      enterpriseId
    });

    await design.save();
    const populated = await LabelDesign.findById(design._id).populate('enterpriseId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create label design error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lưu mẫu tem' });
  }
});

// PUT /api/label-designs/:id
router.put('/:id', auth, requireRole('ADMIN', 'NSX'), async (req, res) => {
  try {
    const design = await LabelDesign.findById(req.params.id);
    if (!design) return res.status(404).json({ error: 'Không tìm thấy mẫu tem' });

    // Check ownership if not admin
    if (req.user.role !== 'ADMIN' && design.enterpriseId.toString() !== req.user.enterpriseId.toString()) {
      return res.status(403).json({ error: 'Không có quyền sửa mẫu tem này' });
    }

    const { name, image, fileData, fileName, size } = req.body;
    if (name) design.name = name;
    if (image) design.image = image;
    if (fileData !== undefined) design.fileData = fileData;
    if (fileName !== undefined) design.fileName = fileName;
    if (size) design.size = size;

    await design.save();
    const populated = await LabelDesign.findById(design._id).populate('enterpriseId', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật mẫu tem' });
  }
});

// DELETE /api/label-designs/:id
router.delete('/:id', auth, requireRole('ADMIN', 'NSX'), async (req, res) => {
  try {
    const design = await LabelDesign.findById(req.params.id);
    if (!design) return res.status(404).json({ error: 'Không tìm thấy mẫu tem' });

    // Check ownership if not admin
    if (req.user.role !== 'ADMIN' && design.enterpriseId.toString() !== req.user.enterpriseId.toString()) {
      return res.status(403).json({ error: 'Không có quyền xóa mẫu tem này' });
    }

    await LabelDesign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa mẫu tem thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa mẫu tem' });
  }
});

module.exports = router;
