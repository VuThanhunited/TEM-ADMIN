// app-zero.js — KHÔNG cần node_modules, chỉ dùng Node.js built-in
// Dùng để test Passenger hoạt động không, không cần npm install

const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    ok: true,
    ts: Date.now(),
    path: req.url,
    msg: 'Passenger is working! No npm needed.',
    node: process.version
  }));
});

// KHÔNG gọi server.listen() — Passenger inject PORT tự động
module.exports = server;
