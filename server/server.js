const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const seed = require('./seed');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const enterpriseRoutes = require('./routes/enterprises');
const productRoutes = require('./routes/products');
const labelRoutes = require('./routes/labels');
const analyticsRoutes = require('./routes/analytics');
const templateRoutes = require('./routes/templates');
const publicRoutes = require('./routes/public');
const labelDesignRoutes = require('./routes/labelDesigns');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_db';

// Middleware – CORS cho phép tất cả domain hệ thống
const allowedOrigins = [
  'https://www.giaiphapqrcode.vn',
  'https://giaiphapqrcode.vn',
  'https://tem-admin-eight.vercel.app',
  'https://tem-user-page.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Cho phép tất cả subdomain của vercel.app và giaiphapqrcode.vn
    if (/\.vercel\.app$/.test(origin) || /giaiphapqrcode\.vn$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // Mở rộng cho mọi origin trong giai đoạn hiện tại
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/label-designs', labelDesignRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
let mongoServer = null;

const startServer = async () => {
  const path = require('path');
  const fs = require('fs');
  const runAutoRestore = require('./scripts/restore_backup');
  let connected = false;

  // 1. Prioritize Primary Database on C2 Server Local (Direct MongoDB or Local Persistent Engine)
  const isC2Server = process.env.C2_SERVER === 'true' || process.env.PASSENGER_APP_ENV || __dirname.includes('giaiphapqrcode');
  const targetMongoUri = process.env.MONGO_URI;

  if (targetMongoUri && !targetMongoUri.includes('mongodb.net')) {
    try {
      console.log(`📡 Connecting to Primary Local MongoDB on C2: ${targetMongoUri}...`);
      await mongoose.connect(targetMongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to Primary Local MongoDB on C2 Server');
      connected = true;
    } catch (err) {
      console.warn('⚠️ Direct local MongoDB connection failed:', err.message);
    }
  }

  // 2. Persistent C2 Storage Fallback (MongoMemoryServer with dbPath on C2 Disk)
  if (!connected) {
    try {
      console.log('🚀 Starting Primary Persistent Storage Engine on C2 Server disk...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const c2DbPath = path.join(__dirname, 'mongodb_data');
      if (!fs.existsSync(c2DbPath)) {
        fs.mkdirSync(c2DbPath, { recursive: true });
      }

      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: c2DbPath,
          storageEngine: 'wiredTiger'
        }
      });
      const c2LocalUri = mongoServer.getUri();
      console.log(`✅ Connected to Primary Persistent C2 Database at: ${c2DbPath}`);
      await mongoose.connect(c2LocalUri);
      connected = true;
    } catch (memErr) {
      console.warn('⚠️ Could not start local persistent C2 engine:', memErr.message);
    }
  }

  // 3. Fallback to Atlas/External MONGO_URI if local C2 engine is unavailable
  if (!connected && targetMongoUri) {
    try {
      console.log(`📡 Secondary Fallback: Connecting to MongoDB Cloud/Atlas...`);
      await mongoose.connect(targetMongoUri, { serverSelectionTimeoutMS: 15000 });
      console.log('✅ Connected to Secondary MongoDB Cloud/Atlas');
      connected = true;
    } catch (cloudErr) {
      console.error('❌ Cloud Database connection failed:', cloudErr.message);
    }
  }

  if (!connected) {
    console.error('❌ CRITICAL: Unable to initialize any database engine on C2 Server.');
    process.exit(1);
  }

  // 4. Auto-Restore Database if empty (Restores all 10,070+ labels, users, products from C2 JSON backup)
  try {
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚠️ Database is empty. Restoring full database backup on C2 Server...');
      const restored = await runAutoRestore();
      if (!restored) {
        await seed(false);
      }
    }
  } catch (restoreErr) {
    console.error('⚠️ Auto-restore error:', restoreErr.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 C2 Server running on port ${PORT}`);

    // Schedule 24-hour automatic JSON backup to C2 disk
    try {
      const runAutoBackup = require('./scripts/auto_backup');
      setTimeout(() => { runAutoBackup(); }, 60000);
      setInterval(() => { runAutoBackup(); }, 24 * 60 * 60 * 1000);
    } catch (e) {
      console.error('⚠️ Could not start auto backup schedule:', e.message);
    }
  });
};

startServer();

// Cleanup on exit
process.on('SIGINT', async () => {
  if (mongoServer) {
    await mongoServer.stop();
    console.log('🛑 Local C2 Database engine stopped');
  }
  process.exit(0);
});

module.exports = app;
