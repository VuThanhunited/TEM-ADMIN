const express = require('express');
const Namecard = require('../models/Namecard');
const auth = require('../middleware/auth');
const { requireOwnership } = require('../middleware/rbac');

const router = express.Router();

// ── Helper: tạo slug từ tên ────────────────────────────────────────────────
function generateSlug(name, suffix = '') {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return suffix ? `${base}-${suffix}` : base;
}

// ── GET /api/namecards ─────────────────────────────────────────────────────
// Danh sách namecard (có phân trang + tìm kiếm)
router.get('/', auth, requireOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', isActive } = req.query;
    const query = req.enterpriseFilter || {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    const total = await Namecard.countDocuments(query);
    const namecards = await Namecard.find(query)
      .populate('enterpriseId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      data: namecards,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /namecards error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ── GET /api/namecards/:id ─────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const namecard = await Namecard.findById(req.params.id).populate('enterpriseId', 'name');
    if (!namecard) return res.status(404).json({ error: 'Không tìm thấy namecard' });
    res.json(namecard);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ── POST /api/namecards ────────────────────────────────────────────────────
router.post('/', auth, requireOwnership, async (req, res) => {
  try {
    const {
      name, title, company, bio, email, phone, phone2, website, address,
      avatar, coverImage, socialLinks, isActive, themeColor
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Tên là bắt buộc' });

    const enterpriseId = req.user.role === 'ADMIN'
      ? (req.body.enterpriseId || req.user.enterpriseId)
      : req.user.enterpriseId;

    if (!enterpriseId) {
      return res.status(400).json({ error: 'Vui lòng chọn Doanh nghiệp' });
    }

    // Tạo slug unique
    let slug = generateSlug(name);
    const existing = await Namecard.findOne({ slug });
    if (existing) {
      slug = generateSlug(name, Date.now().toString(36));
    }

    const namecard = new Namecard({
      enterpriseId,
      slug,
      name, title, company, bio,
      email, phone, phone2, website, address,
      avatar, coverImage,
      socialLinks: socialLinks || {},
      isActive: isActive !== undefined ? isActive : true,
      themeColor: themeColor || '#6366f1',
    });

    await namecard.save();
    const populated = await Namecard.findById(namecard._id).populate('enterpriseId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    console.error('POST /namecards error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug đã tồn tại, vui lòng thử tên khác' });
    }
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ── PUT /api/namecards/:id ─────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name, title, company, bio, email, phone, phone2, website, address,
      avatar, coverImage, socialLinks, isActive, themeColor, slug: newSlug
    } = req.body;

    const namecard = await Namecard.findById(req.params.id);
    if (!namecard) return res.status(404).json({ error: 'Không tìm thấy namecard' });

    // Nếu tên thay đổi và không tự nhập slug → tự gen slug mới
    let slug = namecard.slug;
    if (newSlug && newSlug !== namecard.slug) {
      // Kiểm tra slug mới có trùng không
      const conflict = await Namecard.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
      if (conflict) return res.status(400).json({ error: 'Slug này đã được sử dụng' });
      slug = newSlug.toLowerCase().trim();
    } else if (name && name !== namecard.name && !newSlug) {
      const candidateSlug = generateSlug(name);
      const conflict = await Namecard.findOne({ slug: candidateSlug, _id: { $ne: req.params.id } });
      slug = conflict ? generateSlug(name, Date.now().toString(36)) : candidateSlug;
    }

    const updated = await Namecard.findByIdAndUpdate(
      req.params.id,
      {
        name, title, company, bio,
        email, phone, phone2, website, address,
        avatar, coverImage,
        socialLinks: socialLinks || namecard.socialLinks,
        isActive, themeColor, slug,
      },
      { new: true, runValidators: true }
    ).populate('enterpriseId', 'name');

    res.json(updated);
  } catch (error) {
    console.error('PUT /namecards/:id error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Slug đã tồn tại' });
    }
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ── PATCH /api/namecards/:id/toggle ───────────────────────────────────────
// Bật / tắt isActive nhanh
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const namecard = await Namecard.findById(req.params.id);
    if (!namecard) return res.status(404).json({ error: 'Không tìm thấy namecard' });

    namecard.isActive = !namecard.isActive;
    await namecard.save();
    res.json({ _id: namecard._id, isActive: namecard.isActive });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ── DELETE /api/namecards/:id ──────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const namecard = await Namecard.findByIdAndDelete(req.params.id);
    if (!namecard) return res.status(404).json({ error: 'Không tìm thấy namecard' });
    res.json({ message: 'Xóa namecard thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
