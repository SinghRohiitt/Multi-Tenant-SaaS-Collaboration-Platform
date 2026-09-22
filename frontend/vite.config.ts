import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts')) return 'chart-vendor';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) {
            return 'form-vendor';
          }
          if (id.includes('@reduxjs')) return 'state-vendor';
          if (
            id.includes('/react/') ||
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('react-redux')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
