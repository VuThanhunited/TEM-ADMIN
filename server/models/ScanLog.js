const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema({
  labelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Label',
    required: true
  },
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  serialNumber: {
    type: String,
    default: ''
  },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: 'Vietnam' }
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown'
  },
  scannedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

scanLogSchema.index({ enterpriseId: 1 });
scanLogSchema.index({ labelId: 1 });
scanLogSchema.index({ scannedAt: -1 });
scanLogSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('ScanLog', scanLogSchema);
