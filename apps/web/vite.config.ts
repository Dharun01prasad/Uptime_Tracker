import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadConfig } from '@uptime/config';
const config = loadConfig();
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:' + config.API_PORT,
      '/health': 'http://127.0.0.1:' + config.API_PORT,
    },
  },
});
