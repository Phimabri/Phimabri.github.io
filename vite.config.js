import { defineConfig } from 'vite';

// base './' => works on GitHub Pages under any repo name (user.github.io/repo/)
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
