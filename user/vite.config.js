import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Khi deploy lên Vercel qua proxy từ giaiphapqrcode.vn,
// assets phải dùng absolute URL để browser tải đúng từ tem-user-page.vercel.app
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
  // Base URL tuyệt đối trong production để assets không bị nhầm domain khi proxy
  base: isProd ? 'https://tem-user-page.vercel.app/' : '/',
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
