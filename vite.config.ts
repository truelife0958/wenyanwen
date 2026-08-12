import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        // Vite 8 (rolldown) 使用 advancedChunks 替代 manualChunks 对象语法
        advancedChunks: {
          groups: [
            { name: 'data-articles', test: /runtime[\\/]articles\.json/ },
            { name: 'data-questions', test: /runtime[\\/]questions\.json/ },
            { name: 'data-words', test: /runtime[\\/]words\.json/ },
          ],
        },
      },
    },
  },
  server: {
    port: 8765,
    host: true,
  },
});
