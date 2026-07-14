import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Cho phep truy cap qua domain Render (neu lo chay dev server tren production).
      allowedHosts: ['.onrender.com'],
    },
    preview: {
      // `yarn preview` serve ban build trong dist/ - dung lenh nay tren Render.
      host: true,
      port: Number(process.env.PORT) || 4173,
      allowedHosts: ['.onrender.com'],
    },
  };
});
