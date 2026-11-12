const mongoose = require('mongoose');

const retailStoreSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  address: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  phone: {
    type: String,
    default: '',
    trim: true,
    maxlength: 30
  },
  ownerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

retailStoreSchema.index({ ownerUserId: 1, createdAt: -1 });
retailStoreSchema.index({ enterpriseId: 1, createdAt: -1 });
retailStoreSchema.index({ name: 1 });
retailStoreSchema.index({ customerCode: 1 });

module.exports = mongoose.model('RetailStore', retailStoreSchema);

