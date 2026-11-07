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
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RetailStore',
    default: null
  },
  distributorName: {
    type: String,
    default: null
  },
  distributorAddress: {
    type: String,
    default: null
  },
  distributedAt: {
    type: Date,
    default: null
  },
  // Vị trí kho đối tác lúc quét gán tem cho điểm bán
  warehouseLocation: {
    address: { type: String, default: null },
    city: { type: String, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    ipAddress: { type: String, default: null },
    recordedAt: { type: Date, default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  ownerCode: {
    type: String,
    trim: true,
    default: null
  },
  // Mã nội bộ của khách hàng (Import từ Cột 2 file Excel trong Lô tem bảo hành)
  internalCode: {
    type: String,
    trim: true,
    default: null
  },
  // Thông tin khách hàng sở hữu sản phẩm (NPP nhập khi kích hoạt tem)
  ownerInfo: {
    name: { type: String, trim: true, maxlength: 200, default: null },
    address: { type: String, trim: true, maxlength: 500, default: null },
    phone: { type: String, trim: true, maxlength: 20, default: null },
    activatedSerial: { type: String, trim: true, maxlength: 50, default: null },
    activatedAt: { type: Date, default: null },
    activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
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
labelSchema.index({ batchId: 1, serialNumber: 1 }); // Compound index for batch export with sort
labelSchema.index({ enterpriseId: 1 });
labelSchema.index({ enterpriseId: 1, serialNumber: 1 }); // Compound index for filtered export
labelSchema.index({ qrCode: 1 });
labelSchema.index({ status: 1 });
labelSchema.index({ legacyQrCode: 1 });
labelSchema.index({ legacyTemQr: 1 });
labelSchema.index({ activeCode: 1 });
labelSchema.index({ smsCode: 1 });
labelSchema.index({ ownerCode: 1 });
labelSchema.index({ internalCode: 1 });
labelSchema.index({ storeId: 1 });
labelSchema.index({ distributorName: 1 });
labelSchema.index({ 'ownerInfo.name': 1 });
labelSchema.index({ 'ownerInfo.activatedBy': 1 });
labelSchema.index({ enterpriseId: 1, storeId: 1 });
labelSchema.index({ enterpriseId: 1, distributorName: 1 });

module.exports = mongoose.model('Label', labelSchema);
