const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabelBatch',
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
    required: true,
    unique: true
  },
  qrCode: {
    type: String,
    default: null
  },
  qrUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SCANNED', 'EXPIRED'],
    default: 'INACTIVE'
  },
  distributorName: {
    type: String,
    default: null
  },
  distributorAddress: {
    type: String,
    default: null
  },
  scanCount: {
    type: Number,
    default: 0
  },
  firstScannedAt: {
    type: Date,
    default: null
  },
  lastScannedAt: {
    type: Date,
    default: null
  },
  legacyQrCode: {
    type: String,
    default: null
  },
  legacyTemQr: {
    type: String,
    default: null
  },
  activeCode: {
    type: String,
    default: null
  },
  smsCode: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

labelSchema.index({ batchId: 1 });
labelSchema.index({ enterpriseId: 1 });
labelSchema.index({ status: 1 });
labelSchema.index({ legacyQrCode: 1 });
labelSchema.index({ legacyTemQr: 1 });
labelSchema.index({ activeCode: 1 });
labelSchema.index({ smsCode: 1 });

module.exports = mongoose.model('Label', labelSchema);
