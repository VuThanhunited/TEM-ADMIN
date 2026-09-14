const mongoose = require('mongoose');

const NamecardSchema = new mongoose.Schema({
  enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    // VD: "nguyen-van-a-cty-abc" — dùng trong URL public
  },

  // Thông tin cá nhân / doanh nghiệp
  name: { type: String, required: true, trim: true },
  title: { type: String, trim: true, default: '' },       // Chức danh: Giám đốc, CEO...
  company: { type: String, trim: true, default: '' },
  bio: { type: String, default: '' },                      // Giới thiệu ngắn

  // Liên lạc
  email: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  phone2: { type: String, trim: true, default: '' },       // Số điện thoại 2 (tùy chọn)
  website: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },

  // Hình ảnh
  logo: { type: String, default: '' },                     // URL ảnh logo doanh nghiệp / thương hiệu
  avatar: { type: String, default: '' },                   // URL ảnh đại diện cá nhân
  coverImage: { type: String, default: '' },               // URL ảnh nền / banner

  // Mạng xã hội
  socialLinks: {
    facebook: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    zalo: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },

  // Trạng thái
  isActive: { type: Boolean, default: true },

  // Màu chủ đạo của namecard (hex)
  themeColor: { type: String, default: '#6366f1' },

}, { timestamps: true });

// Index để tìm kiếm nhanh
NamecardSchema.index({ enterpriseId: 1 });
NamecardSchema.index({ name: 'text', company: 'text', email: 'text' });

module.exports = mongoose.model('Namecard', NamecardSchema);
