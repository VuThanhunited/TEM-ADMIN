const mongoose = require('mongoose');

const labelBatchSchema = new mongoose.Schema({
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
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    default: null
  },
  batchCode: {
    type: String,
    required: true,
    unique: true
  },
  totalLabels: {
    type: Number,
    required: true,
    min: 1
  },
  serialStart: {
    type: String,
    required: true
  },
  serialEnd: {
    type: String,
    required: true
  },
  prefix: {
    type: String,
    default: 'TEM'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    default: 'INACTIVE'
  },
  activatedCount: {
    type: Number,
    default: 0
  },
  scannedCount: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isMigrated: {
    type: Boolean,
    default: false
  },
  migrationSource: {
    type: String,
    default: null
  },
  migrationOldLink: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    enum: ['default', 'agriculture', 'medical', 'food', 'functional_food', 'cosmetics', 'appliance'],
    default: 'default'
  },
  customDomain: {
    type: String,
    default: null
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

labelBatchSchema.index({ enterpriseId: 1 });
labelBatchSchema.index({ status: 1 });

module.exports = mongoose.model('LabelBatch', labelBatchSchema);
