const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Enterprise = require('./models/Enterprise');
const Product = require('./models/Product');
const LabelBatch = require('./models/LabelBatch');
const Label = require('./models/Label');
const ScanLog = require('./models/ScanLog');
const Template = require('./models/Template');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_admin';
const ADMIN_URL = process.env.ADMIN_URL || 'https://tem-admin-iota.vercel.app';

const seed = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Enterprise.deleteMany({}),
      Product.deleteMany({}),
      LabelBatch.deleteMany({}),
      Label.deleteMany({}),
      ScanLog.deleteMany({}),
      Template.deleteMany({})
    ]);
    console.log('🗑️  Cleared all collections');

    // Create enterprises
    const enterprise1 = await Enterprise.create({
      name: 'Công ty TNHH Thực phẩm Việt Hương',
      type: 'NSX',
      address: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
      phone: '028-1234-5678',
      email: 'info@viethuong.vn',
      website: 'https://viethuong.vn',
      taxCode: '0312345678',
      domain: 'viethuong.tem.vn',
      subscriptionPlan: 'PRO',
      subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      brandConfig: { primaryColor: '#e74c3c', secondaryColor: '#c0392b' }
    });

    const enterprise2 = await Enterprise.create({
      name: 'Công ty CP Dược phẩm Sao Vàng',
      type: 'NPP',
      address: '456 Lê Lợi, Q.1, TP.HCM',
      phone: '028-8765-4321',
      email: 'contact@saovang.vn',
      website: 'https://saovang.vn',
      taxCode: '0398765432',
      domain: 'saovang.tem.vn',
      subscriptionPlan: 'ENTERPRISE',
      subscriptionExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      brandConfig: { primaryColor: '#f39c12', secondaryColor: '#e67e22' }
    });

    const enterprise3 = await Enterprise.create({
      name: 'Công ty TNHH Mỹ phẩm Hoa Sen',
      type: 'NSX',
      address: '789 Trần Hưng Đạo, Q.5, TP.HCM',
      phone: '028-5555-6666',
      email: 'info@hoasen.vn',
      website: 'https://hoasen.vn',
      taxCode: '0355556666',
      subscriptionPlan: 'BASIC',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      brandConfig: { primaryColor: '#e91e90', secondaryColor: '#c71585' }
    });

    console.log('🏢 Created 3 enterprises');

    // Create users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const nsxPassword = await bcrypt.hash('nsx123', 10);
    const nppPassword = await bcrypt.hash('npp123', 10);

    await User.create([
      {
        username: 'admin',
        email: 'admin@tem.vn',
        password: hashedPassword,
        fullName: 'Quản Trị Viên',
        role: 'ADMIN',
        isActive: true
      },
      {
        username: 'viethuong',
        email: 'manager@viethuong.vn',
        password: nsxPassword,
        fullName: 'Nguyễn Văn Hùng',
        role: 'NSX',
        enterpriseId: enterprise1._id,
        subscriptionExpiry: enterprise1.subscriptionExpiry,
        isActive: true
      },
      {
        username: 'saovang',
        email: 'manager@saovang.vn',
        password: nppPassword,
        fullName: 'Trần Thị Mai',
        role: 'NPP',
        enterpriseId: enterprise2._id,
        subscriptionExpiry: enterprise2.subscriptionExpiry,
        isActive: true
      },
      {
        username: 'anhtuan',
        email: 'anhtuan@saovang.vn',
        password: nppPassword,
        fullName: 'ĐIỂM BÁN 01 – TẠP HÓA ANH TUẤN',
        address: '12 Đường số 5, P. Hiệp Bình, TP. Thủ Đức',
        role: 'NPP',
        enterpriseId: enterprise2._id,
        subscriptionExpiry: enterprise2.subscriptionExpiry,
        isActive: true
      },
      {
        username: 'minhchau',
        email: 'minhchau@saovang.vn',
        password: nppPassword,
        fullName: 'ĐIỂM BÁN 02 – TẠP HÓA MINH CHÂU',
        address: '45 Kha Vạn Cân, P. Linh Đông, TP. Thủ Đức',
        role: 'NPP',
        enterpriseId: enterprise2._id,
        subscriptionExpiry: enterprise2.subscriptionExpiry,
        isActive: true
      },
      {
        username: 'hongphat',
        email: 'hongphat@saovang.vn',
        password: nppPassword,
        fullName: 'ĐIỂM BÁN 03 – TẠP HÓA HỒNG PHÁT',
        address: '100 Phạm Văn Đồng, P. Linh Tây, TP. Thủ Đức',
        role: 'NPP',
        enterpriseId: enterprise2._id,
        subscriptionExpiry: enterprise2.subscriptionExpiry,
        isActive: true
      },
      {
        username: 'baoan',
        email: 'baoan@saovang.vn',
        password: nppPassword,
        fullName: 'ĐIỂM BÁN 04 – TẠP HÓA BẢO AN',
        address: '23 Quốc lộ 13, P. Hiệp Bình Phước, TP. Thủ Đức',
        role: 'NPP',
        enterpriseId: enterprise2._id,
        subscriptionExpiry: enterprise2.subscriptionExpiry,
        isActive: true
      },
      {
        username: 'thanhha',
        email: 'thanhha@saovang.vn',
        password: nppPassword,
        fullName: 'ĐIỂM BÁN 05 – TẠP HÓA THANH HÀ',
        address: '88 Đường số 7, P. Hiệp Bình Chánh, TP. Thủ Đức',
        role: 'NPP',
        enterpriseId: enterprise2._id,
        subscriptionExpiry: enterprise2.subscriptionExpiry,
        isActive: true
      },
      {
        username: 'hoasen',
        email: 'manager@hoasen.vn',
        password: nsxPassword,
        fullName: 'Lê Minh Tuấn',
        role: 'NSX',
        enterpriseId: enterprise3._id,
        subscriptionExpiry: enterprise3.subscriptionExpiry,
        isActive: true
      }
    ]);
    console.log('👤 Created 4 users (admin, viethuong, saovang, hoasen)');

    // Create products
    const products = await Product.create([
      {
        enterpriseId: enterprise1._id,
        name: 'Nước mắm Việt Hương Premium',
        description: 'Nước mắm cá cơm truyền thống, ủ 12 tháng, 40 độ đạm. Sản phẩm đạt tiêu chuẩn HACCP.',
        category: 'Gia vị',
        sku: 'VH-NM-001',
        images: ['https://placehold.co/400x400/e74c3c/fff?text=Nuoc+Mam'],
        distributors: [
          { name: 'Siêu thị Co.opMart', address: 'Q.1, TP.HCM', phone: '028-1111-2222' },
          { name: 'Siêu thị BigC', address: 'Q.7, TP.HCM', phone: '028-3333-4444' }
        ]
      },
      {
        enterpriseId: enterprise1._id,
        name: 'Tương ớt Việt Hương 250ml',
        description: 'Tương ớt tươi nguyên chất, vị cay nồng tự nhiên. Không chất bảo quản.',
        category: 'Gia vị',
        sku: 'VH-TO-002',
        images: ['https://placehold.co/400x400/e74c3c/fff?text=Tuong+Ot']
      },
      {
        enterpriseId: enterprise1._id,
        name: 'Dầu ăn Việt Hương 1L',
        description: 'Dầu ăn tinh luyện từ hạt cải, giàu vitamin E, tốt cho sức khỏe.',
        category: 'Dầu ăn',
        sku: 'VH-DA-003',
        images: ['https://placehold.co/400x400/e74c3c/fff?text=Dau+An']
      },
      {
        enterpriseId: enterprise2._id,
        name: 'Viên uống Vitamin C Sao Vàng',
        description: 'Bổ sung vitamin C 1000mg, tăng cường sức đề kháng. Hộp 100 viên.',
        category: 'Thực phẩm chức năng',
        sku: 'SV-VC-001',
        images: ['https://placehold.co/400x400/f39c12/fff?text=Vitamin+C']
      },
      {
        enterpriseId: enterprise2._id,
        name: 'Dầu gió Sao Vàng 10ml',
        description: 'Dầu gió truyền thống, giảm đau nhức, cảm lạnh. Sản phẩm được tin dùng 50+ năm.',
        category: 'Dược phẩm',
        sku: 'SV-DG-002',
        images: ['https://placehold.co/400x400/f39c12/fff?text=Dau+Gio']
      },
      {
        enterpriseId: enterprise2._id,
        name: 'Cao dán Sao Vàng',
        description: 'Cao dán giảm đau, kháng viêm. Hộp 10 miếng.',
        category: 'Dược phẩm',
        sku: 'SV-CD-003',
        images: ['https://placehold.co/400x400/f39c12/fff?text=Cao+Dan']
      },
      {
        enterpriseId: enterprise3._id,
        name: 'Kem dưỡng da Hoa Sen 50ml',
        description: 'Kem dưỡng ẩm chiết xuất hoa sen, phù hợp mọi loại da.',
        category: 'Chăm sóc da',
        sku: 'HS-KD-001',
        images: ['https://placehold.co/400x400/e91e90/fff?text=Kem+Duong']
      },
      {
        enterpriseId: enterprise3._id,
        name: 'Son môi Hoa Sen Rose',
        description: 'Son môi lì, màu hồng cánh sen, dưỡng ẩm 24h.',
        category: 'Trang điểm',
        sku: 'HS-SM-002',
        images: ['https://placehold.co/400x400/e91e90/fff?text=Son+Moi']
      }
    ]);
    console.log('📦 Created 8 products');

    // Create label batches and labels
    const batches = [];
    const allLabels = [];

    // Batch 1 - Việt Hương
    const batch1 = await LabelBatch.create({
      enterpriseId: enterprise1._id,
      productId: products[0]._id,
      batchCode: 'VH-2024-001',
      totalLabels: 50,
      serialStart: 'VH-000001',
      serialEnd: 'VH-000050',
      prefix: 'VH',
      status: 'ACTIVE',
      activatedCount: 50,
      scannedCount: 32,
      theme: 'agriculture',
      expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000)
    });
    batches.push(batch1);

    for (let i = 1; i <= 50; i++) {
      allLabels.push({
        batchId: batch1._id,
        enterpriseId: enterprise1._id,
        productId: products[0]._id,
        serialNumber: `VH-${String(i).padStart(6, '0')}`,
        qrUrl: `${ADMIN_URL}/scan/VH-${String(i).padStart(6, '0')}`,
        status: i <= 32 ? 'SCANNED' : 'ACTIVE',
        scanCount: i <= 32 ? Math.floor(Math.random() * 5) + 1 : 0,
        isActive: true
      });
    }

    // Batch 2 - Việt Hương (inactive)
    const batch2 = await LabelBatch.create({
      enterpriseId: enterprise1._id,
      productId: products[1]._id,
      batchCode: 'VH-2024-002',
      totalLabels: 30,
      serialStart: 'VH-000051',
      serialEnd: 'VH-000080',
      prefix: 'VH',
      status: 'INACTIVE',
      expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000)
    });
    batches.push(batch2);

    for (let i = 51; i <= 80; i++) {
      allLabels.push({
        batchId: batch2._id,
        enterpriseId: enterprise1._id,
        productId: products[1]._id,
        serialNumber: `VH-${String(i).padStart(6, '0')}`,
        qrUrl: `${ADMIN_URL}/scan/VH-${String(i).padStart(6, '0')}`,
        status: 'INACTIVE',
        isActive: false
      });
    }

    // Batch 3 - Sao Vàng
    const batch3 = await LabelBatch.create({
      enterpriseId: enterprise2._id,
      productId: products[3]._id,
      batchCode: 'SV-2024-001',
      totalLabels: 100,
      serialStart: 'SV-000001',
      serialEnd: 'SV-000100',
      prefix: 'SV',
      status: 'ACTIVE',
      activatedCount: 100,
      scannedCount: 75,
      theme: 'functional_food',
      expiryDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000)
    });
    batches.push(batch3);

    for (let i = 1; i <= 100; i++) {
      allLabels.push({
        batchId: batch3._id,
        enterpriseId: enterprise2._id,
        productId: products[3]._id,
        serialNumber: `SV-${String(i).padStart(6, '0')}`,
        qrUrl: `${ADMIN_URL}/scan/SV-${String(i).padStart(6, '0')}`,
        status: i <= 75 ? 'SCANNED' : 'ACTIVE',
        scanCount: i <= 75 ? Math.floor(Math.random() * 10) + 1 : 0,
        distributorName: i % 3 === 0 ? 'Nhà thuốc Long Châu' : i % 3 === 1 ? 'Nhà thuốc Pharmacity' : 'Nhà thuốc An Khang',
        isActive: true
      });
    }

    // Batch 4 - Sao Vàng (migrated)
    const batch4 = await LabelBatch.create({
      enterpriseId: enterprise2._id,
      productId: products[4]._id,
      batchCode: 'SV-LEGACY-001',
      totalLabels: 20,
      serialStart: 'OLD-SV-0001',
      serialEnd: 'OLD-SV-0020',
      prefix: 'OLD-SV',
      status: 'ACTIVE',
      isMigrated: true,
      migrationSource: 'Hệ thống tem cũ v1',
      migrationOldLink: 'https://old.saovang.vn/tem/',
      expiryDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000)
    });
    batches.push(batch4);

    for (let i = 1; i <= 20; i++) {
      allLabels.push({
        batchId: batch4._id,
        enterpriseId: enterprise2._id,
        productId: products[4]._id,
        serialNumber: `OLD-SV-${String(i).padStart(4, '0')}`,
        qrUrl: `${ADMIN_URL}/scan/OLD-SV-${String(i).padStart(4, '0')}`,
        status: 'ACTIVE',
        scanCount: Math.floor(Math.random() * 20) + 5,
        isActive: true
      });
    }

    // Batch 5 - Hoa Sen
    const batch5 = await LabelBatch.create({
      enterpriseId: enterprise3._id,
      productId: products[6]._id,
      batchCode: 'HS-2024-001',
      totalLabels: 40,
      serialStart: 'HS-000001',
      serialEnd: 'HS-000040',
      prefix: 'HS',
      status: 'ACTIVE',
      activatedCount: 40,
      scannedCount: 18,
      theme: 'cosmetics',
      expiryDate: new Date(Date.now() + 250 * 24 * 60 * 60 * 1000)
    });
    batches.push(batch5);

    for (let i = 1; i <= 40; i++) {
      allLabels.push({
        batchId: batch5._id,
        enterpriseId: enterprise3._id,
        productId: products[6]._id,
        serialNumber: `HS-${String(i).padStart(6, '0')}`,
        qrUrl: `${ADMIN_URL}/scan/HS-${String(i).padStart(6, '0')}`,
        status: i <= 18 ? 'SCANNED' : 'ACTIVE',
        scanCount: i <= 18 ? Math.floor(Math.random() * 3) + 1 : 0,
        isActive: true
      });
    }

    await Label.insertMany(allLabels);
    console.log(`🏷️  Created ${batches.length} batches and ${allLabels.length} labels`);

    // Create scan logs
    const cities = [
      { city: 'TP. Hồ Chí Minh', lat: 10.8231, lng: 106.6297 },
      { city: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
      { city: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
      { city: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
      { city: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
      { city: 'Biên Hòa', lat: 10.9574, lng: 106.8429 },
      { city: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
      { city: 'Huế', lat: 16.4637, lng: 107.5909 },
      { city: 'Vũng Tàu', lat: 10.346, lng: 107.0843 },
      { city: 'Đà Lạt', lat: 11.9404, lng: 108.4583 }
    ];

    const scanLogs = [];
    const devices = ['mobile', 'tablet', 'desktop'];
    const createdLabels = await Label.find({});

    for (let i = 0; i < 200; i++) {
      const label = createdLabels[Math.floor(Math.random() * createdLabels.length)];
      const cityData = cities[Math.floor(Math.random() * cities.length)];
      const daysAgo = Math.floor(Math.random() * 60);

      scanLogs.push({
        labelId: label._id,
        enterpriseId: label.enterpriseId,
        productId: label.productId,
        serialNumber: label.serialNumber,
        location: {
          lat: cityData.lat + (Math.random() - 0.5) * 0.1,
          lng: cityData.lng + (Math.random() - 0.5) * 0.1,
          city: cityData.city,
          country: 'Vietnam'
        },
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        deviceType: devices[Math.floor(Math.random() * devices.length)],
        scannedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 24 * 60 * 60 * 1000)
      });
    }

    await ScanLog.insertMany(scanLogs);
    console.log(`📊 Created ${scanLogs.length} scan logs`);

    // Create templates
    await Template.create([
      {
        enterpriseId: enterprise1._id,
        name: 'Việt Hương Classic',
        primaryColor: '#e74c3c',
        secondaryColor: '#c0392b',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        layout: 'default',
        showVerificationBadge: true,
        showProductInfo: true,
        showDistributorInfo: true,
        isDefault: true
      },
      {
        enterpriseId: enterprise2._id,
        name: 'Sao Vàng Premium',
        primaryColor: '#f39c12',
        secondaryColor: '#e67e22',
        backgroundColor: '#0f0f23',
        textColor: '#f8f8f2',
        layout: 'premium',
        showVerificationBadge: true,
        showProductInfo: true,
        showDistributorInfo: true,
        showScanCount: true,
        isDefault: true
      },
      {
        enterpriseId: enterprise3._id,
        name: 'Hoa Sen Minimal',
        primaryColor: '#e91e90',
        secondaryColor: '#c71585',
        backgroundColor: '#fafafa',
        textColor: '#333333',
        layout: 'minimal',
        showVerificationBadge: true,
        showProductInfo: true,
        isDefault: true
      }
    ]);
    console.log('🎨 Created 3 templates');

    console.log('\n========================================');
    console.log('✅ SEED DATA COMPLETE!');
    console.log('========================================');
    console.log('📋 Login credentials:');
    console.log('  Admin:      admin / admin123');
    console.log('  NSX (VH):   viethuong / nsx123');
    console.log('  NPP (SV):   saovang / npp123');
    console.log('  NSX (HS):   hoasen / nsx123');
    console.log('========================================\n');

    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seed error:', error);
    if (shouldExit) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

if (require.main === module) {
  seed(true);
}

module.exports = seed;
