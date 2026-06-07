import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (
            id.includes('recharts') ||
            id.includes('/d3-') ||
            id.includes('/d3.') ||
            id.includes('d3/src')
          ) return 'vendor-charts';
          if (id.includes('@clerk/clerk-react')) return 'vendor-clerk';
          if (
            id.includes('react-dom') ||
            id.includes('react-router-dom') ||
            id.includes('react-router/') ||
            (id.includes('/react/') && !id.includes('react-dom') && !id.includes('react-router'))
          ) return 'vendor-react';
        },
      },
    },
  },
})
