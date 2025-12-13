import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy image requests from vendor API server (localhost:8003) to avoid CORS issues
      '/uploads': {
        target: 'http://localhost:8003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add CORS headers for image requests
            proxyReq.setHeader('Access-Control-Allow-Origin', '*')
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Ensure CORS headers are present in response
            proxyRes.headers['Access-Control-Allow-Origin'] = '*'
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
            proxyRes.headers['Cache-Control'] = 'public, max-age=31536000'
          })
        }
      },
      // Proxy for assets from vendor API server
      '/assets': {
        target: 'http://localhost:8003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*'
            proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
            proxyRes.headers['Cache-Control'] = 'public, max-age=31536000'
          })
        }
      },
      // Fallback: Proxy karmleela.com images (for production/external images)
      '/karmleela-proxy': {
        target: 'https://www.karmleela.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/karmleela-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*'
            proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
          })
        }
      }
    }
  }
})
