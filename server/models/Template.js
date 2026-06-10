const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
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
  primaryColor: {
    type: String,
    default: '#6366f1'
  },
  secondaryColor: {
    type: String,
    default: '#8b5cf6'
  },
  backgroundColor: {
    type: String,
    default: '#0f172a'
  },
  textColor: {
    type: String,
    default: '#f8fafc'
  },
  logo: {
    type: String,
    default: null
  },
  backgroundImage: {
    type: String,
    default: null
  },
  layout: {
    type: String,
    enum: ['default', 'minimal', 'premium', 'modern'],
    default: 'default'
  },
  templateType: {
    type: String,
    enum: ['default', 'minimal', 'premium', 'modern', 'food-agriculture'],
    default: 'default'
  },
  extendedConfig: {
    type: String,
    default: null
  },
  showVerificationBadge: {
    type: Boolean,
    default: true
  },
  showProductInfo: {
    type: Boolean,
    default: true
  },
  showDistributorInfo: {
    type: Boolean,
    default: true
  },
  showScanCount: {
    type: Boolean,
    default: false
  },
  customCSS: {
    type: String,
    default: ''
  },
  customHTML: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

templateSchema.index({ enterpriseId: 1 });

module.exports = mongoose.model('Template', templateSchema);
