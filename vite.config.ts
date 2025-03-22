import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://eduvulcan.pl',
        changeOrigin: true,
        secure: false
      },
      '/Account': {
        target: 'https://eduvulcan.pl',
        changeOrigin: true,
        secure: false
      },
      '/logowanie': {
        target: 'https://eduvulcan.pl',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
