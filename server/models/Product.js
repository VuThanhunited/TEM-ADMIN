const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Chung'
  },
  sku: {
    type: String,
    default: ''
  },
  barcode: {
    type: String,
    default: ''
  },
  distributors: [{
    name: { type: String, required: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' }
  }],
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  verificationText: {
    type: String,
    default: 'XÁC THỰC THÀNH CÔNG\nSản phẩm chính hãng'
  },
  productionProcess: [{
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' }
  }],
  certifications: {
    iso: {
      checked: { type: Boolean, default: false },
      certNo: { type: String, default: '' },
      image: { type: String, default: '' }
    },
    vetinhATTP: {
      checked: { type: Boolean, default: false },
      certNo: { type: String, default: '' },
      image: { type: String, default: '' }
    },
    gmp: {
      checked: { type: Boolean, default: false },
      certNo: { type: String, default: '' },
      image: { type: String, default: '' }
    },
    cgmp: {
      checked: { type: Boolean, default: false },
      certNo: { type: String, default: '' },
      image: { type: String, default: '' }
    },
    vietgap: {
      checked: { type: Boolean, default: false },
      certNo: { type: String, default: '' },
      image: { type: String, default: '' }
    },
    organic: {
      checked: { type: Boolean, default: false },
      certNo: { type: String, default: '' },
      image: { type: String, default: '' }
    }
  },
  producerInfo: {
    type: String,
    default: ''
  },
  distributorInfo: {
    type: String,
    default: ''
  },
  chatbotQA: [{
    question: { type: String, default: '' },
    answer: { type: String, default: '' }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productSchema.index({ enterpriseId: 1 });
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
