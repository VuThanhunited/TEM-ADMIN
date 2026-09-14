/**
 * Seed namecard Thúy Hoàng vào MongoDB
 * Chạy: node scripts/seed_namecard.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Namecard = require('../models/Namecard');
const Enterprise = require('../models/Enterprise');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_db';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // Lấy enterprise đầu tiên (hoặc tạo mới nếu cần)
  let enterprise = await Enterprise.findOne().lean();
  if (!enterprise) {
    console.error('❌ Không tìm thấy Enterprise nào. Vui lòng tạo doanh nghiệp trước.');
    process.exit(1);
  }
  console.log(`📋 Dùng Enterprise: ${enterprise.name} (${enterprise._id})`);

  // Xoá record cũ nếu tồn tại
  await Namecard.deleteOne({ slug: 'thuy-hoang' });

  const namecard = new Namecard({
    enterpriseId: enterprise._id,
    slug: 'thuy-hoang',
    name: 'Thúy Hoàng',
    title: '',
    company: 'HHB Elevator',
    bio: 'Kết nối – Giá trị – Bền lâu',
    email: 'thuyhoang@hhbelevator.vn',
    phone: '0947 19 8686',
    phone2: '0943 877 688',
    website: 'https://www.hhbelevator.vn',
    address: 'Số 9, đường 2.4, KĐT Gamuda Gardens, Hoàng Mai, Hà Nội',
    avatar: '',
    coverImage: '',
    themeColor: '#c9a84c',
    socialLinks: {
      facebook: '',
      linkedin: '',
      zalo: '',
      instagram: '',
      youtube: '',
      tiktok: '',
      twitter: '',
    },
    isActive: true,
  });

  await namecard.save();
  console.log('✅ Đã tạo Namecard: Thúy Hoàng — HHB Elevator');
  console.log(`   Slug: thuy-hoang`);
  console.log(`   Link: https://www.giaiphapqrcode.vn/namecard/thuy-hoang`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
