// app.js - Entry point cho Phusion Passenger (cPanel)
// Passenger tự inject biến môi trường PORT và IP listener
// KHÔNG gọi app.listen() trực tiếp - Passenger sẽ làm việc đó

'use strict';

// ─── Bắt lỗi crash toàn bộ để Passenger không die silently ───────────────────
process.on('uncaughtException', err => {
  console.error('[UNCAUGHT EXCEPTION]', new Date().toISOString(), err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', new Date().toISOString(), reason);
});

const express = require('express');
const app = express();

// ─── CORS (load trước khi require routes để tránh dependency error) ───────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Ping/Health sẵn sàng ngay lập tức (không cần DB) ───────────────────────
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now(), uptime: process.uptime() });
});

// ─── Load toàn bộ app trong try/catch để bắt lỗi module ─────────────────────
let _appReady = false;
let _appError = null;

function loadApp() {
  try {
    require('dotenv').config();

    const cors = require('cors');
    const mongoose = require('mongoose');

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
        if (!origin) return callback(null, true);
        if (/\.vercel\.app$/.test(origin) || /giaiphapqrcode\.vn$/.test(origin)) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Routes
    app.use('/api/auth',         require('./routes/auth'));
    app.use('/api/accounts',     require('./routes/accounts'));
    app.use('/api/enterprises',  require('./routes/enterprises'));
    app.use('/api/products',     require('./routes/products'));
    app.use('/api/labels',       require('./routes/labels'));
    app.use('/api/analytics',    require('./routes/analytics'));
    app.use('/api/templates',    require('./routes/templates'));
    app.use('/api/public',       require('./routes/public'));
    app.use('/api/label-designs',require('./routes/labelDesigns'));

    // Health check
    app.get('/api/health', (req, res) => {
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      res.json({
        status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
        db: dbStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
      });
    });

    // Global Express error handler
    app.use((err, req, res, next) => {
      console.error('[Global Error Handler]', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Lỗi máy chủ nội bộ' });
      }
    });

    _appReady = true;
    console.log('✅ [App] Tất cả routes đã load thành công');

    // ─── MongoDB Connection ───────────────────────────────────────────────────
    const MONGO_URI = process.env.MONGO_URI || '';
    const MONGO_URI_FALLBACK = 'mongodb://vtu21102000:Vuthanh1810%40@ac-hjrte0y-shard-00-01.7t35nab.mongodb.net:27017/tem_db?ssl=true&authSource=admin&directConnection=true';

    const MONGOOSE_OPTIONS = {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
      family: 4,
    };

    async function connectMongo(uri, label) {
      try {
        console.log(`📡 [MongoDB] Kết nối ${label}...`);
        await mongoose.connect(uri, MONGOOSE_OPTIONS);
        console.log(`✅ [MongoDB] Kết nối ${label} thành công!`);

        mongoose.connection.on('disconnected', () => console.warn('⚠️ [MongoDB] Mất kết nối'));
        mongoose.connection.on('reconnected', () => console.log('✅ [MongoDB] Đã kết nối lại'));
        mongoose.connection.on('error', e => console.error('❌ [MongoDB]', e.message));

        // Auto-restore nếu DB trống
        setTimeout(async () => {
          try {
            const User = require('./models/User');
            const count = await User.countDocuments();
            if (count === 0) {
              console.log('⚠️ DB trống – thử restore backup...');
              const runAutoRestore = require('./scripts/restore_backup');
              runAutoRestore().catch(e => console.error('Restore error:', e.message));
            } else {
              console.log(`✅ DB có ${count} users.`);
            }
          } catch (e) {
            console.error('⚠️ Restore check error:', e.message);
          }
        }, 3000);

        // Auto backup mỗi 24h
        try {
          const runAutoBackup = require('./scripts/auto_backup');
          setTimeout(() => runAutoBackup(), 2 * 60 * 1000);
          setInterval(() => runAutoBackup(), 24 * 60 * 60 * 1000);
        } catch (e) {
          console.warn('⚠️ Auto backup unavailable:', e.message);
        }

      } catch (err) {
        const isSrvError = err.message?.includes('querySrv') ||
                           err.message?.includes('ECONNREFUSED') ||
                           err.message?.includes('ENOTFOUND');

        if (isSrvError && uri === MONGO_URI && MONGO_URI !== MONGO_URI_FALLBACK) {
          console.warn('⚠️ SRV lookup thất bại – thử fallback direct connection...');
          return connectMongo(MONGO_URI_FALLBACK, 'fallback');
        }

        console.error(`❌ [MongoDB] Kết nối thất bại: ${err.message}`);
        // Thử lại sau 15s tối đa 3 lần
        const maxRetry = (connectMongo._retries = (connectMongo._retries || 0) + 1);
        if (maxRetry < 3) {
          console.log(`🔄 Thử lại sau 15s (lần ${maxRetry}/3)...`);
          setTimeout(() => connectMongo(uri, label), 15000);
        } else {
          console.error('❌ [MongoDB] Đã thử 3 lần, DB offline. Server vẫn chạy.');
        }
      }
    }

    if (MONGO_URI) {
      connectMongo(MONGO_URI, 'SRV');
    } else {
      console.warn('⚠️ MONGO_URI chưa được cấu hình!');
    }

  } catch (loadErr) {
    _appError = loadErr.message;
    console.error('❌ [App] Lỗi khi load app:', loadErr.message, loadErr.stack);
  }
}

// Load app ngay lập tức
loadApp();

// Middleware catch-all: trả lỗi nếu app chưa ready
app.use((req, res) => {
  if (!_appReady) {
    return res.status(503).json({
      error: 'Server đang khởi động, vui lòng thử lại sau 30 giây',
      detail: _appError || 'Loading...',
      timestamp: new Date().toISOString(),
    });
  }
  res.status(404).json({ error: 'Route không tồn tại', path: req.path });
});

// Export app cho Phusion Passenger
module.exports = app;
