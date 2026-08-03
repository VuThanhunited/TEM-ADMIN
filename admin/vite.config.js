import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'charts';
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('react-dom')) return 'react-dom';
            return 'vendor';
          }
        }
      }
    }
  }
});
