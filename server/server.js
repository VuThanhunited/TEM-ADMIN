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

// Request timeout middleware (60s) - trả lời JSON lỗi nếu request bị treo quá lâu
app.use((req, res, next) => {
  const TIMEOUT_MS = 60000;
  // Bỏ qua các route export vốn cần nhiều thời gian
  if (req.path.includes('/export')) return next();
  // Thêm Connection: keep-alive để tránh Render idle disconnect
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

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: dbStatus === 'connected' ? 'OK' : 'DEGRADED', 
    db: dbStatus,
    timestamp: new Date().toISOString() 
  });
});

// Ping endpoint – trả về 200 người lập tức, dùng để warmup Render cold-start
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Global Express error handler - Bắt tất cả uncaught async errors trong routes
// Ngăn trường hợp server crash không gửi response -> client nhận empty body
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).json({
      error: err.message || 'Lỗi máy chủ nội bộ',
      timestamp: new Date().toISOString()
    });
  }
});

// Connect to MongoDB and start server
const startServer = async () => {
  const runAutoRestore = require('./scripts/restore_backup');
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_db';

  try {
    console.log(`📡 Connecting to MongoDB: ${MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}...`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 60000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    // Không exit ngay – Passenger có thể restart lại
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} | ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🟢 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Auto-restore nếu DB trống – chạy background sau 3s không block request
    setTimeout(async () => {
      try {
        const User = require('./models/User');
        const count = await User.countDocuments();
        if (count === 0) {
          console.log('⚠️ DB empty – starting background restore...');
          runAutoRestore().then(ok => {
            if (!ok) seed(false);
          }).catch(e => console.error('⚠️ Restore error:', e.message));
        } else {
          console.log(`✅ DB has ${count} users – no restore needed`);
        }
      } catch (e) {
        console.error('⚠️ Restore check error:', e.message);
      }
    }, 3000);

    // Mongoose connection health monitoring
    mongoose.connection.on('disconnected', () =>
      console.warn('⚠️ MongoDB disconnected – will attempt reconnect...')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('✅ MongoDB reconnected')
    );
    mongoose.connection.on('error', err =>
      console.error('❌ MongoDB error:', err.message)
    );

    // Auto backup mỗi 24h
    try {
      const runAutoBackup = require('./scripts/auto_backup');
      setTimeout(() => runAutoBackup(), 2 * 60 * 1000);      // 2 min sau khi start
      setInterval(() => runAutoBackup(), 24 * 60 * 60 * 1000); // mỗi 24h
    } catch (e) {
      console.error('⚠️ Could not schedule auto backup:', e.message);
    }
  });
};

startServer();

// Process-level error handlers - giữ server không crash silent
process.on('uncaughtException', err =>
  console.error('❌ [UNCAUGHT EXCEPTION]', err.message, err.stack)
);
process.on('unhandledRejection', (reason) =>
  console.error('❌ [UNHANDLED REJECTION]', reason)
);


module.exports = app;
