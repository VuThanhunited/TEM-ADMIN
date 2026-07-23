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
    enum: ['default', 'minimal', 'premium', 'modern', 'warranty_solution'],
    default: 'default'
  },
  templateType: {
    type: String,
    enum: ['default', 'minimal', 'premium', 'modern', 'food-agriculture', 'warranty_solution'],
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
  contentConfig: {
    headerTitle1: { type: String, default: 'GIẢI PHÁP QRcode' },
    headerTitle2: { type: String, default: 'TEM BẢO HÀNH SẢN PHẨM' },
    transparencyLine1: { type: String, default: 'SẢN PHẨM ĐÃ ĐƯỢC NHÀ CUNG CẤP' },
    transparencyLine2: { type: String, default: 'CAM KẾT MINH BẠCH THÔNG TIN' },
    
    spec1Label: { type: String, default: 'Dung tích' },
    spec1Value: { type: String, default: '1.8L' },
    spec2Label: { type: String, default: 'Công suất' },
    spec2Value: { type: String, default: '1200W' },
    spec3Label: { type: String, default: 'Lòng nồi' },
    spec3Value: { type: String, default: 'Inox 304' },
    spec4Label: { type: String, default: 'Bảo hành' },
    spec4Value: { type: String, default: '24 tháng' },

    checklistCol1: [{ type: String }],
    checklistCol2: [{ type: String }],

    benefits: [{
      title: { type: String },
      desc: { type: String }
    }],

    manufacturerNote: { type: String, default: '' }
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
