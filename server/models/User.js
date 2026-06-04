const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'NSX', 'NPP', 'GUEST'],
    required: true,
    default: 'GUEST'
  },
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

userSchema.index({ role: 1 });
userSchema.index({ enterpriseId: 1 });

module.exports = mongoose.model('User', userSchema);
