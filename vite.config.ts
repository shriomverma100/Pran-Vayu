import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' keeps every asset path relative, so the build works on GitHub Pages
// and from any folder on a BMC office PC.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // The checked dataset (1,524 readings with receipts) is bundled so the tool
    // works offline; that puts the main chunk near 1 MB (about 190 kB gzipped).
    chunkSizeWarningLimit: 1200,
  },
})
