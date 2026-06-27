import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        // This removes the '/api' prefix when forwarding to OpenSky
        rewrite: (path) => path.replace(/^\/api/, '/api'), 
      },
    },
  },
})