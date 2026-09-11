// app-test.js — Chỉ dùng để test Passenger có chạy không
// Không cần MongoDB, không cần node_modules ngoài express
const express = require('express');
const app = express();

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now(), msg: 'Passenger is working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', db: 'not_connected', test_mode: true });
});

app.get('*', (req, res) => {
  res.json({ path: req.path, method: req.method });
});

// KHÔNG gọi app.listen() — Passenger tự inject
module.exports = app;
