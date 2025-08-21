import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/sashizume-generator/',   // ← GitHub Pages用の追記
  plugins: [react()],
})
