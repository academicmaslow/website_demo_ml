import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      external: ['onnxruntime-web'],
    },
  },
  assetsInclude: ['**/*.onnx'],
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
});