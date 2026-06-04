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
