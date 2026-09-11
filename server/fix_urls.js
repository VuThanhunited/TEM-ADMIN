const mongoose = require('mongoose');
require('dotenv').config();

const Label = require('./models/Label');
const LabelBatch = require('./models/LabelBatch');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tem_db';
const ADMIN_URL = process.env.ADMIN_URL || 'https://giaiphapqrcode.vn';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    // 1. Find labels with tem-admin-eight.vercel.app or http://
    const badLabels = await Label.find({
      $or: [
        { qrUrl: { $regex: 'tem-admin-eight\\.vercel\\.app' } },
        { qrUrl: { $regex: '^http://' } }
      ]
    });

    console.log(`Found ${badLabels.length} labels with outdated/invalid URLs.`);

    let updated = 0;
    for (const label of badLabels) {
      if (!label.qrUrl) continue;
      let newUrl = label.qrUrl
        .replace('https://tem-admin-eight.vercel.app', ADMIN_URL)
        .replace('http://tem-admin-eight.vercel.app', ADMIN_URL)
        .replace(/^http:\/\//, 'https://');
      
      if (newUrl !== label.qrUrl) {
        label.qrUrl = newUrl;
        await label.save();
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} label URLs successfully.`);
  } catch (err) {
    console.error('Error fixing URLs:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
