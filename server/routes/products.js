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

// POST /api/products
router.post('/', auth, requireOwnership, async (req, res) => {
  try {
    const {
      name, images, description, category, sku, barcode, distributors, specifications,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId, manufacturerInfo
    } = req.body;
    const enterpriseId = req.user.role === 'ADMIN' ? (req.body.enterpriseId || req.user.enterpriseId) : req.user.enterpriseId;
    if (!enterpriseId) {
      return res.status(400).json({ error: 'Vui lòng chọn Doanh nghiệp sở hữu sản phẩm' });
    }

    const product = new Product({
      enterpriseId,
      name,
      images: images || [],
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
      manufacturerInfo: manufacturerInfo || ''
    });
    await product.save();
    
    const populated = await Product.findById(product._id)
      .populate('enterpriseId', 'name')
      .populate('manufacturerId', 'name address phone email');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name, images, description, category, sku, barcode, distributors, specifications, isActive,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId, manufacturerInfo
    } = req.body;

    // Xây dựng updateData — chỉ set images nếu client gửi mảng không rỗng
    // Tránh bug xóa ảnh cũ khi admin submit form mà không chủ ý thay ảnh
    const updateData = {
      name, description, category, sku, barcode, distributors, specifications, isActive,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId, manufacturerInfo
    };

    // Chỉ cập nhật images nếu client gửi mảng có nội dung (> 0 URL hợp lệ)
    if (Array.isArray(images) && images.length > 0) {
      updateData.images = images;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('enterpriseId', 'name').populate('manufacturerId', 'name address phone email');

    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json(product);
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
