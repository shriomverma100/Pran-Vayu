import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' keeps every asset path relative, so the build works on GitHub Pages
// and from any folder on a BMC office PC.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
