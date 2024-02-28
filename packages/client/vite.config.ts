import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

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
      ' @bgi/shared': `${path.resolve(__dirname, '../shared/src')}`,
      '@': path.resolve(__dirname, './src/'),
      assets: `${path.resolve(__dirname, './src/assets/')}`,
      pages: `${path.resolve(__dirname, './src/pages/')}`,
      layouts: `${path.resolve(__dirname, './src/layouts/')}`,
      components: `${path.resolve(__dirname, './src/components/')}`,
      hooks: `${path.resolve(__dirname, './src/hooks/')}`,
      utils: `${path.resolve(__dirname, './src/utils/')}`
    }
  }
});
