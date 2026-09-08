import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: { host: true } // ponytail: bind em 0.0.0.0 para acesso via IP local
})