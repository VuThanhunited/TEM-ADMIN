const mongoose = require('mongoose');

const enterpriseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['NSX', 'NPP'],
    required: true
  },
  logo: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  taxCode: {
    type: String,
    default: ''
  },
  domain: {
    type: String,
    default: null
  },
  subdomain: {
    type: String,
    default: null
  },
  chatbotConfig: {
    enabled: { type: Boolean, default: false },
    script: { type: String, default: '' },
    welcomeMessage: { type: String, default: 'Xin chào! Tôi có thể giúp gì cho bạn?' },
    qaList: [{
      question: { type: String, default: '' },
      answer: { type: String, default: '' }
    }]
  },
  brandConfig: {
    primaryColor: { type: String, default: '#6366f1' },
    secondaryColor: { type: String, default: '#8b5cf6' },
    fontFamily: { type: String, default: 'Inter' }
  },
  subscriptionPlan: {
    type: String,
    enum: ['BASIC', 'PRO', 'ENTERPRISE'],
    default: 'BASIC'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Enterprise', enterpriseSchema);
