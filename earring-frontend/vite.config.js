import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Prueba-despliegue-taos/',
  server: {
    allowedHosts: [
      'rush-ashy-chemicals.ngrok-free.dev'
    ]
  }
})

