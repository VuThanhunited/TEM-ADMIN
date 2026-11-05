const mongoose = require('mongoose');

const locationAlertSchema = new mongoose.Schema({
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    required: true
  },
  labelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Label',
    required: true
  },
  serialNumber: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  productName: {
    type: String,
    default: ''
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RetailStore',
    default: null
  },
  storeName: {
    type: String,
    default: ''
  },
  expectedAddress: {
    type: String,
    default: ''
  },
  warehouseAddress: {
    type: String,
    default: ''
  },
  actualLocation: {
    city: { type: String, default: '' },
    address: { type: String, default: '' },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    ipAddress: { type: String, default: '' },
    deviceType: { type: String, default: 'mobile' }
  },
  message: {
    type: String,
    default: ''
  },
  isDismissed: {
    type: Boolean,
    default: false
  },
  dismissedAt: {
    type: Date,
    default: null
  },
  dismissedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  scannedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

locationAlertSchema.index({ enterpriseId: 1, isDismissed: 1, scannedAt: -1 });
locationAlertSchema.index({ serialNumber: 1, scannedAt: -1 });

module.exports = mongoose.model('LocationAlert', locationAlertSchema);

