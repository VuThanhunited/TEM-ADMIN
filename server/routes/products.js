const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { requireOwnership } = require('../middleware/rbac');

const router = express.Router();

// GET /api/products
router.get('/', auth, requireOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '' } = req.query;
    const query = req.enterpriseFilter || {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('enterpriseId', 'name')
      .populate('manufacturerId', 'name address phone email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      data: products,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// GET /api/products/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    .populate('enterpriseId', 'name')
    .populate('manufacturerId', 'name address phone email logo');
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Helper to normalize populated manufacturer details
const normalizeManufacturer = async (product) => {
  if (!product) return product;
  const prod = product.toObject ? product.toObject() : { ...product };
  if (prod.manufacturerId) {
    if (typeof prod.manufacturerId === 'object' && prod.manufacturerId._id) {
      const m = prod.manufacturerId;
      if (m.fullName && !m.name) m.name = m.fullName;
      if (m.details && !m.partnerDetails) m.partnerDetails = m.details;
    } else {
      // Fallback manual resolution if populate failed
      const User = require('../models/User');
      const Enterprise = require('../models/Enterprise');
      const u = await User.findById(prod.manufacturerId).select('fullName address phone email details logo').lean();
      if (u) {
        prod.manufacturerId = {
          _id: u._id,
          name: u.fullName,
          address: u.address || '',
          phone: u.phone || '',
          email: u.email || '',
          partnerDetails: u.details || '',
          logo: u.logo || null
        };
      } else {
        const ent = await Enterprise.findById(prod.manufacturerId).select('name address phone email logo partnerDetails').lean();
        if (ent) prod.manufacturerId = ent;
      }
    }
  }
  return prod;
};

// POST /api/products
router.post('/', auth, requireOwnership, async (req, res) => {
  try {
    const {
      name, images, description, category, sku, barcode, distributors, specifications,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId, manufacturerInfo, congBoImages, distributionBannerText
    } = req.body;
    const enterpriseId = req.user.role === 'ADMIN' ? (req.body.enterpriseId || req.user.enterpriseId) : req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(400).json({ error: 'Vui lòng chọn Doanh nghiệp sở hữu sản phẩm' });
    }

    let manufacturerModel = 'Enterprise';
    if (manufacturerId) {
      const User = require('../models/User');
      const isUser = await User.exists({ _id: manufacturerId });
      if (isUser) manufacturerModel = 'User';
    }

    const product = new Product({
      enterpriseId,
      name,
      // Lọc bỏ base64 quá lớn (>500KB) để tránh MongoDB 16MB document limit
      images: (images || []).filter(img => {
        if (!img || !img.trim()) return false;
        if (img.startsWith('data:') && img.length > 500 * 1024) return false;
        return true;
      }),
      description,
      category,
      sku,
      barcode,
      distributors: distributors || [],
      specifications: specifications || {},
      verificationText,
      productionProcess: productionProcess || [],
      certifications: certifications || {},
      producerInfo,
      distributorInfo,
      chatbotQA: chatbotQA || [],
      manufacturerId: manufacturerId || null,
      manufacturerModel,
      manufacturerInfo: manufacturerInfo || '',
      distributionBannerText: distributionBannerText || '',
      congBoImages: (congBoImages || []).filter(img => img && img.trim())
    });
    await product.save();
    
    const populated = await Product.findById(product._id)
      .populate('enterpriseId', 'name')
      .populate('manufacturerId');
    const result = await normalizeManufacturer(populated);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name, images, description, category, sku, barcode, distributors, specifications, isActive,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId, manufacturerInfo, congBoImages, distributionBannerText
    } = req.body;

    let manufacturerModel = 'Enterprise';
    if (manufacturerId) {
      const User = require('../models/User');
      const isUser = await User.exists({ _id: manufacturerId });
      if (isUser) manufacturerModel = 'User';
    }

    // Xây dựng updateData — chỉ set images nếu client gửi mảng không rỗng
    // Tránh bug xóa ảnh cũ khi admin submit form mà không chủ ý thay ảnh
    const updateData = {
      name, description, category, sku, barcode, distributors, specifications, isActive,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId: manufacturerId || null, manufacturerModel, manufacturerInfo,
      distributionBannerText: distributionBannerText !== undefined ? distributionBannerText : undefined,
      congBoImages: Array.isArray(congBoImages) ? congBoImages.filter(img => img && img.trim()) : undefined
    };

    // Chỉ cập nhật images nếu client gửi mảng có nội dung (>0 URL hợp lệ)
    // Đồng thời lọc bỏ base64 quá lớn để tránh MongoDB overflow
    const filteredImages = Array.isArray(images)
      ? images.filter(img => {
          if (!img || !img.trim()) return false;
          if (img.startsWith('data:') && img.length > 500 * 1024) return false;
          return true;
        })
      : [];

    if (filteredImages.length > 0) {
      updateData.images = filteredImages;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('enterpriseId', 'name').populate('manufacturerId');

    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    const result = await normalizeManufacturer(product);
    res.json(result);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});


// DELETE /api/products/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
