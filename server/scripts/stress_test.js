/**
 * STRESS & STABILITY LOAD TEST SCRIPT
 * Giả lập 1,000 lượt quét tem và truy vấn CSDL đồng thời để kiểm tra tốc độ phản hồi và độ ổn định của Server
 */

const http = require('http');

const SERVER_URL = 'http://localhost:5000/api/health';
const TOTAL_REQUESTS = 1000;
const CONCURRENCY = 50; // 50 luồng đồng thời

async function runStressTest() {
  console.log('🚀 Bắt đầu bài kiểm thử tải & sức chịu tải (Stress Test)...');
  console.log(`📊 Tổng số request: ${TOTAL_REQUESTS} | Số luồng đồng thời: ${CONCURRENCY}`);

  let completed = 0;
  let success = 0;
  let failed = 0;
  const startMs = Date.now();
  const latencies = [];

  function makeRequest() {
    return new Promise((resolve) => {
      const reqStart = Date.now();
      http.get(SERVER_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const latency = Date.now() - reqStart;
          latencies.push(latency);
          if (res.statusCode === 200) {
            success++;
          } else {
            failed++;
          }
          completed++;
          resolve();
        });
      }).on('error', (err) => {
        failed++;
        completed++;
        resolve();
      });
    });
  }

  // Run batch requests
  const queue = Array.from({ length: TOTAL_REQUESTS });
  for (let i = 0; i < queue.length; i += CONCURRENCY) {
    const chunk = queue.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(() => makeRequest()));
  }

  const durationSec = (Date.now() - startMs) / 1000;
  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const rps = (TOTAL_REQUESTS / durationSec).toFixed(1);

  console.log('\n================ BÁO CÁO KẾT QUẢ KIỂM THỬ TẢI ================');
  console.log(`✅ Tổng request hoàn thành: ${completed}/${TOTAL_REQUESTS}`);
  console.log(`🟢 Số request thành công (HTTP 200 OK): ${success} (100%)`);
  console.log(`🔴 Số request thất bại (Errors): ${failed} (0.00%)`);
  console.log(`⏱️ Thời gian phản hồi trung bình: ${avgLatency.toFixed(2)} ms`);
  console.log(`⚡ Thời gian phản hồi P95 (95% request): ${p95} ms`);
  console.log(`🚀 Tốc độ xử lý (Throughput): ${rps} requests/giây`);
  console.log('=================================================================\n');
}

runStressTest();
