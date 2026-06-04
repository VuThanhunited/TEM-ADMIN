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
    const product = await Product.findById(req.params.id).populate('enterpriseId', 'name');
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/products
router.post('/', auth, requireOwnership, async (req, res) => {
  try {
    const { name, images, description, category, sku, barcode, distributors } = req.body;
    const enterpriseId = req.user.role === 'ADMIN' ? req.body.enterpriseId : req.user.enterpriseId;

    const product = new Product({
      enterpriseId,
      name,
      images: images || [],
      description,
      category,
      sku,
      barcode,
      distributors: distributors || []
    });
    await product.save();
    
    const populated = await Product.findById(product._id).populate('enterpriseId', 'name');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, images, description, category, sku, barcode, distributors, isActive } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, images, description, category, sku, barcode, distributors, isActive },
      { new: true }
    ).populate('enterpriseId', 'name');

    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (error) {
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
