import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The synthetic demo log lives in demo-public/ and is served only in demo mode, so it can never
// end up in a production build.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: process.env.VITE_DEMO === '1' ? 'demo-public' : 'public',
})
