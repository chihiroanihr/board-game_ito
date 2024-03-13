import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/dist',
  // Monorepos and Linked Dependencies (https://vitejs.dev/guide/dep-pre-bundling.html#monorepos-and-linked-dependencies)
  optimizeDeps: {
    include: ['@bgi/shared'] // Include the linked dependency in optimization
  },
  build: {
    commonjsOptions: {
      include: [/shared/, /node_modules/] // Include the linked dependency in the build
    },
    rollupOptions: {
      // external: ['@bgi/shared'], // This module should remain external to the bundle.
      output: {
        // "Use Manual Chunks to tackle the warning: JavaScript chunks generated by Vite are larger than 500 kB after minification."
        // This is an option option to manually define how your code is split into chunks which provides more control over the size and composition of your bundles.
        manualChunks(id) {
          // Group modules from 'node_modules' directory into a 'vendors' chunk
          if (id.includes('node_modules')) {
            return 'vendors';
          }
          // Group modules from 'src/components' directory into a 'components' chunk
          // if (id.includes('src/components')) {
          //   return 'components';
          // }
          // if (id.includes('src/hooks')) {
          //   return 'hooks';
          // }
          // if (id.includes('src/layouts')) {
          //   return 'layouts';
          // }

          // If no specific grouping is needed, return null
          return null;
        }
      }
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
