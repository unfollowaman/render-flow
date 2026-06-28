import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/html2png/', // GitHub Pages repo name — adjust if repo name differs
})
