const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const seed = require('./seed');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const enterpriseRoutes = require('./routes/enterprises');
const productRoutes = require('./routes/products');
const labelRoutes = require('./routes/labels');
const analyticsRoutes = require('./routes/analytics');
const templateRoutes = require('./routes/templates');
const publicRoutes = require('./routes/public');
const labelDesignRoutes = require('./routes/labelDesigns');
const mergeRoutes = require('./routes/merge'); // TẠM THỜI — xóa sau khi merge
const uploadRoutes = require('./routes/upload');
const namecardRoutes = require('./routes/namecards');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Request timeout middleware (60s) - trả lời JSON lỗi nếu request bị treo quá lâu
app.use((req, res, next) => {
  const TIMEOUT_MS = 60000;
  // Bỏ qua các route export vốn cần nhiều thời gian
  if (req.path.includes('/export')) return next();
  // Thêm Connection: keep-alive để tránh idle disconnect
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=65, max=1000');
  res.setTimeout(TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timeout - Vui lòng thử lại' });
    }
  });
  req.setTimeout(TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timeout - Vui lòng thử lại' });
    }
  });
  next();
});

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
app.use('/api/merge', mergeRoutes); // TẠM THỜI — xóa sau khi merge
app.use('/api/upload', uploadRoutes);
app.use('/api/namecards', namecardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
    db: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Ping endpoint – trả về 200 lập tức, dùng để warmup cold-start
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Global Express error handler - Bắt tất cả uncaught async errors trong routes
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).json({
      error: err.message || 'Lỗi máy chủ nội bộ',
      timestamp: new Date().toISOString()
    });
  }
});

// ─── MongoDB Connection with Retry ───────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_db';

const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 30000,  // 30s để chọn server (đủ cho Atlas cold-start)
  connectTimeoutMS: 30000,
  socketTimeoutMS: 75000,           // 75s socket idle – khớp với Keep-Alive=65s
  heartbeatFrequencyMS: 10000,      // ping server mỗi 10s để phát hiện disconnect sớm
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
  family: 4,                        // Bắt buộc dùng IPv4, tránh IPv6 lookup timeout
};

let mongoServerInstance = null;

async function startServerApp() {
  if (app.listening) return;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} | ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🟢 MongoDB: Connected (${mongoose.connection.readyState === 1 ? 'OK' : 'Pending'})`);

    // Auto-restore nếu DB trống – chạy background sau 1s không block request
    setTimeout(async () => {
      try {
        const runAutoRestore = require('./scripts/restore_backup');
        const User = require('./models/User');
        const count = await User.countDocuments();
        if (count === 0) {
          console.log('⚠️ DB trống – đang khôi phục dữ liệu từ backup...');
          runAutoRestore().then(ok => {
            if (!ok) seed(false);
          }).catch(e => console.error('⚠️ Restore error:', e.message));
        } else {
          console.log(`✅ DB có ${count} users – không cần khôi phục.`);
        }
      } catch (e) {
        console.error('⚠️ Restore check error:', e.message);
      }
    }, 1000);

    // Mongoose connection health monitoring
    mongoose.connection.on('disconnected', () =>
      console.warn('⚠️ [MongoDB] Mất kết nối – Mongoose sẽ tự reconnect...')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('✅ [MongoDB] Đã kết nối lại thành công')
    );
    mongoose.connection.on('error', err =>
      console.error('❌ [MongoDB] Lỗi:', err.message)
    );

    // Auto backup mỗi 24h
    try {
      const runAutoBackup = require('./scripts/auto_backup');
      setTimeout(() => runAutoBackup(), 2 * 60 * 1000);        // 2 min sau khi start
      setInterval(() => runAutoBackup(), 24 * 60 * 60 * 1000); // mỗi 24h
    } catch (e) {
      console.error('⚠️ Không thể lập lịch auto backup:', e.message);
    }
  });
}

async function connectMongo(attempt = 1) {
  const MAX_ATTEMPTS = 2;

  try {
    console.log(`📡 [MongoDB] Đang kết nối... (${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')})`);
    await mongoose.connect(MONGO_URI, { ...MONGOOSE_OPTIONS, serverSelectionTimeoutMS: 5000 });
    console.log('✅ [MongoDB] Kết nối Atlas thành công!');
    await startServerApp();
  } catch (err) {
    console.warn(`⚠️ [MongoDB] Không thể kết nối Atlas (${err.message.slice(0, 100)}...)`);

    if (attempt < MAX_ATTEMPTS) {
      console.log(`🔄 Thử lại kết nối Atlas lần ${attempt + 1}...`);
      return connectMongo(attempt + 1);
    }

    // Fallback: Khởi động MongoMemoryServer dự phòng cho môi trường dev / offline
    try {
      console.log('🚀 [MongoDB] Đang khởi động MongoMemoryServer dự phòng...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const path = require('path');
      const fs = require('fs');
      const dbPath = path.join(__dirname, 'mongodb_data');
      if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

      mongoServerInstance = await MongoMemoryServer.create({
        instance: { dbPath, storageEngine: 'wiredTiger' }
      });
      const localUri = mongoServerInstance.getUri();
      await mongoose.connect(localUri);
      console.log('✅ [MongoDB] Đã kết nối MongoMemoryServer thành công!');
      await startServerApp();
    } catch (fallbackErr) {
      console.error('❌ [MongoDB] Cả kết nối Atlas và MongoMemoryServer đều thất bại:', fallbackErr.message);
      process.exit(1);
    }
  }
}

connectMongo();

// Dọn dẹp mongoServer khi tắt process
process.on('SIGINT', async () => {
  if (mongoServerInstance) {
    await mongoServerInstance.stop();
  }
  process.exit(0);
});
process.on('SIGTERM', async () => {
  if (mongoServerInstance) {
    await mongoServerInstance.stop();
  }
  process.exit(0);
});

// Process-level error handlers - giữ server không crash silent
process.on('uncaughtException', err =>
  console.error('❌ [UNCAUGHT EXCEPTION]', err.message, err.stack)
);
process.on('unhandledRejection', (reason) =>
  console.error('❌ [UNHANDLED REJECTION]', reason)
);

module.exports = app;
