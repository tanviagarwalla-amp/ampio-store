import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' keeps asset URLs relative, so the same build works at a domain
// root or under a sub-path (e.g. a GitHub Pages project site).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
})
