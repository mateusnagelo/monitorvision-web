import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ibpt-csv': {
        target: 'https://www.concity.com.br',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/arquivos/b1b38f9f32e01ab6a20e81ffea020c54.csv',
      },
      '/cnpj': {
        target: 'https://publica.cnpj.ws',
        changeOrigin: true,
        secure: true,
        // sem rewrite necessário: /cnpj/XXXXXXXXXXXXXX -> https://publica.cnpj.ws/cnpj/XXXXXXXXXXXXXX
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[proxy:/cnpj] → ${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[proxy:/cnpj] ← ${proxyRes.statusCode} ${req.url}`)
          })
          proxy.on('error', (err, req) => {
            console.error(`[proxy:/cnpj] ✖ erro: ${err.message} ${req.url}`)
          })
        },
      },
      '/api/cosmos': {
        target: 'https://api.cosmos.bluesoft.com.br',
        changeOrigin: true,
        secure: true,
        // Importante: remover o prefixo /api/cosmos para que o backend receba /gtins, /ncms, etc.
        rewrite: (path) => path.replace(/^\/api\/cosmos/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[proxy:/api/cosmos] → ${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[proxy:/api/cosmos] ← ${proxyRes.statusCode} ${req.url}`)
          })
          proxy.on('error', (err, req) => {
            console.error(`[proxy:/api/cosmos] ✖ erro: ${err.message} ${req.url}`)
          })
        },
      },
    },
  },
})