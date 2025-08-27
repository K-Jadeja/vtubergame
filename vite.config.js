import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        format: 'es', // Use ES modules instead of IIFE to support top-level await
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
    target: 'esnext', // Use modern JS features
  },
  // Worker configuration
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
  // Ensure proper handling of static assets
  publicDir: 'public',
  // Configure for development
  server: {
    port: 3000,
    open: true,
  },
});
