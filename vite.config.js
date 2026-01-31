import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000,
    strictPort: false,
    hmr: {
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
