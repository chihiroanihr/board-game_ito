import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // build: {
  //   rollupOptions: {
  //     external: ['@bgi/shared'] // This module should remain external to the bundle.
  //   }
  // },

  // Monorepos and Linked Dependencies (https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies)
  optimizeDeps: {
    include: ['@bgi/shared'] // Include the linked dependency in optimization
  },
  build: {
    commonjsOptions: {
      include: [/shared/, /node_modules/] // Include the linked dependency in the build
    }
  },

  // Path Alias
  resolve: {
    alias: {
      '@bgi/shared': resolve(__dirname, '../shared/src'),
      '@': resolve(__dirname, './src/'),
      assets: resolve(__dirname, './src/assets/'),
      pages: resolve(__dirname, './src/pages/'),
      layouts: resolve(__dirname, './src/layouts/'),
      components: resolve(__dirname, './src/components/'),
      hooks: resolve(__dirname, './src/hooks/'),
      utils: resolve(__dirname, './src/utils/')
    }
  }
});
