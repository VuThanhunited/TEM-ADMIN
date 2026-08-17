import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Base '/' để assets dùng đường dẫn tuyệt đối từ root (không bị CORS khi proxy qua giaiphapqrcode.vn)
  base: '/',
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    // Tên thư mục assets khác với admin (/assets/) để tránh xung đột khi proxy
    assetsDir: 'user-assets',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('html5-qrcode')) return 'scanner';
            if (id.includes('react-dom')) return 'react-dom';
            return 'vendor';
          }
        }
      }
    }
  }
});
