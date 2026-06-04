const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_admin';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/enterprises', enterpriseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
let mongoServer = null;

const startServer = async () => {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    // Connect to the configured URI with a 3-second timeout
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to MongoDB');
    
    // Check if database is empty to auto-seed
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('⚠️ Database is empty. Running seed script...');
      await seed(false);
    }
  } catch (error) {
    console.log('⚠️ Local MongoDB connection failed or not running. Starting in-memory MongoDB...');
    try {
      process.env.DEBUG = 'MongoMS:*';
      mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '6.0.14'
        }
      });
      const inMemoryUri = mongoServer.getUri();
      console.log(`🚀 In-memory MongoDB URI: ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('✅ Connected to in-memory MongoDB');
      
      console.log('🌱 Seeding in-memory database...');
      await seed(false);
    } catch (memError) {
      console.error('❌ Failed to start/seed in-memory MongoDB:', memError.message);
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();

// Cleanup on exit
process.on('SIGINT', async () => {
  if (mongoServer) {
    await mongoServer.stop();
    console.log('🛑 In-memory MongoDB stopped');
  }
  process.exit(0);
});

module.exports = app;
