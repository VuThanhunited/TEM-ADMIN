const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { requireOwnership, getRelatedEnterpriseIds } = require('../middleware/rbac');

const router = express.Router();

// ── In-Memory Cache cho danh sách sản phẩm (TTL 60s) ─────────────────────────
const productsCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 giây

const invalidateProductsCache = () => {
  productsCache.clear();
};

// GET /api/products
router.get('/', auth, requireOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '', full = 'false', simple = 'false' } = req.query;
    const query = req.enterpriseFilter || {};
    
    // Nếu là Admin và truyền enterpriseId trong query string -> lọc theo enterpriseId đó
    if (req.user.role === 'ADMIN' && req.query.enterpriseId && req.query.enterpriseId.trim() !== '') {
      query.enterpriseId = req.query.enterpriseId.trim();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || (simple === 'true' ? 1000 : 100), 1), 5000);
    const parsedPage = Math.max(parseInt(page) || 1, 1);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    let findQuery = Product.find(query)
      .populate('enterpriseId', 'name')
      .sort({ createdAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .lean();

    if (simple === 'true') {
      // Chế độ gọn nhẹ phục vụ dropdown / select: siêu nhanh (<100ms), không populate manufacturerId nặng
      findQuery = findQuery.select('name sku price category enterpriseId distributors hasGeographicalIndication createdAt');
    } else {
      findQuery = findQuery.populate('manufacturerId', 'name address phone email logo hasGeographicalIndication');
      // Không strip dữ liệu quan trọng (images, congBoImages, certifications...) để frontend luôn có đủ 100% dữ liệu
      // Chỉ loại trừ chatbotQA nếu không yêu cầu full
      if (full !== 'true') {
        findQuery = findQuery.select('-chatbotQA');
      }
    }

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      findQuery
    ]);

    const payload = {
      data: products,
      products,
      pagination: { total, page: parsedPage, limit: parsedLimit, totalPages: Math.ceil(total / parsedLimit) }
    };

    res.json(payload);
  } catch (error) {
    console.error('[GET /api/products] Lỗi truy vấn sản phẩm:', error);
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// GET /api/products/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    .populate('enterpriseId', 'name')
    .populate('manufacturerId', 'name address phone email logo hasGeographicalIndication');
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
      const u = await User.findById(prod.manufacturerId).select('fullName address phone email details logo hasGeographicalIndication').lean();
      if (u) {
        prod.manufacturerId = {
          _id: u._id,
          name: u.fullName,
          address: u.address || '',
          phone: u.phone || '',
          email: u.email || '',
          partnerDetails: u.details || '',
          logo: u.logo || null,
          hasGeographicalIndication: Boolean(u.hasGeographicalIndication)
        };
      } else {
        const ent = await Enterprise.findById(prod.manufacturerId).select('name address phone email logo partnerDetails hasGeographicalIndication').lean();
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
      name, images, description, category, sku, price, barcode, distributors, specifications,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId, manufacturerInfo, congBoImages, congBoNumber, distributionBannerText,
      bannerImage, theme, hasGeographicalIndication
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
      // Lọc bỏ base64 quá lớn (>5MB) để đảm bảo an toàn tài nguyên
      images: (images || []).filter(img => {
        if (!img || !img.trim()) return false;
        if (img.startsWith('data:') && img.length > 5 * 1024 * 1024) return false;
        return true;
      }),
      bannerImage: bannerImage || '',
      theme: theme || '',
      hasGeographicalIndication: Boolean(hasGeographicalIndication),
      description,
      category,
      sku,
      price: price !== undefined && price !== '' ? Math.max(0, Number(price) || 0) : 0,
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
      congBoImages: (congBoImages || []).filter(img => img && img.trim()),
      congBoNumber: congBoNumber || ''
    });
    await product.save();
    invalidateProductsCache();
    
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
      name, images, description, category, sku, price, barcode, distributors, specifications, isActive,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId, manufacturerInfo, congBoImages, congBoNumber, distributionBannerText,
      bannerImage, theme, hasGeographicalIndication
    } = req.body;

    if (req.user.role !== 'ADMIN') {
      const existingProd = await Product.findById(req.params.id).select('enterpriseId').lean();
      if (!existingProd) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
      if (!relatedIds.some(id => String(id) === String(existingProd.enterpriseId))) {
        return res.status(403).json({ error: 'Không có quyền chỉnh sửa sản phẩm của doanh nghiệp khác' });
      }
    }

    let manufacturerModel = 'Enterprise';
    if (manufacturerId) {
      const User = require('../models/User');
      const isUser = await User.exists({ _id: manufacturerId });
      if (isUser) manufacturerModel = 'User';
    }

    // Xây dựng updateData cơ bản
    const updateData = {
      name, description, category, sku, barcode, distributors, specifications, isActive,
      verificationText, productionProcess, certifications, producerInfo, distributorInfo,
      chatbotQA, manufacturerId: manufacturerId || null, manufacturerModel, manufacturerInfo,
      distributionBannerText: distributionBannerText !== undefined ? distributionBannerText : undefined,
      congBoNumber: congBoNumber !== undefined ? congBoNumber : undefined
    };

    if (hasGeographicalIndication !== undefined) {
      updateData.hasGeographicalIndication = Boolean(hasGeographicalIndication);
    }

    if (price !== undefined && price !== '') {
      updateData.price = Math.max(0, Number(price) || 0);
    }

    if (bannerImage !== undefined) updateData.bannerImage = bannerImage;
    if (theme !== undefined) updateData.theme = theme;

    // BẢO VỆ DỮ LIỆU CÔNG BỐ: Chỉ cập nhật nếu client gửi mảng có nội dung (>0 URL hợp lệ)
    // Hoặc có cờ clearCongBoImages: true. Không bao giờ xóa sạch do lỗi nạp form rỗng từ client
    if (Array.isArray(congBoImages)) {
      const validCongBo = congBoImages.filter(img => img && typeof img === 'string' && img.trim());
      if (validCongBo.length > 0) {
        updateData.congBoImages = validCongBo;
      } else if (req.body.clearCongBoImages === true) {
        updateData.congBoImages = [];
      }
    }

    // BẢO VỆ ẢNH SẢN PHẨM: Chỉ cập nhật nếu client gửi mảng có nội dung (>0 URL hợp lệ)
    // Đồng thời lọc bỏ base64 quá lớn (>5MB) để đảm bảo an toàn tài nguyên
    if (Array.isArray(images)) {
      const filteredImages = images.filter(img => {
        if (!img || typeof img !== 'string' || !img.trim()) return false;
        if (img.startsWith('data:') && img.length > 5 * 1024 * 1024) return false;
        return true;
      });
      if (filteredImages.length > 0) {
        updateData.images = filteredImages;
      } else if (req.body.clearImages === true) {
        updateData.images = [];
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('enterpriseId', 'name').populate('manufacturerId');

    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    invalidateProductsCache();
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
    if (req.user.role !== 'ADMIN') {
      const existingProd = await Product.findById(req.params.id).select('enterpriseId').lean();
      if (!existingProd) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      const relatedIds = await getRelatedEnterpriseIds(req.user.enterpriseId);
      if (!relatedIds.some(id => String(id) === String(existingProd.enterpriseId))) {
        return res.status(403).json({ error: 'Không có quyền xóa sản phẩm của doanh nghiệp khác' });
      }
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    invalidateProductsCache();
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
