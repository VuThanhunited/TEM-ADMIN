const mongoose = require('mongoose');

const labelDesignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true }, // Base64 image
  fileData: { type: String }, // Base64 file or link for downloading (vector/pdf/png)
  fileName: { type: String }, // Name of the downloaded file
  size: { type: String, required: true, trim: true }, // Size of label, e.g. "40x20mm"
  enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabelDesign', labelDesignSchema);
