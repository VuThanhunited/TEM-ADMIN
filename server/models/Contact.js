const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email:    { type: String, required: true, trim: true },
  phone:    { type: String, trim: true, default: '' },
  subject:  { type: String, trim: true, default: '' },
  message:  { type: String, required: true, trim: true },
  status:   { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);
