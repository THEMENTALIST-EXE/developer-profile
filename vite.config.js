import { defineConfig } from 'vite';

export default defineConfig({
  base: '/developer-profile/',
  server: {
    port: 5173,
    proxy: {
      '/students': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
