import { defineConfig } from 'vite'

export default defineConfig({
  server: { host: '0.0.0.0' },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/react-dom')) return 'react-vendor'
          if (id.includes('/node_modules/@supabase')) return 'supabase'
          if (id.includes('/node_modules/lucide-react')) return 'icons'
          if (id.includes('/node_modules/qrcode.react')) return 'qr-code'
        },
      },
    },
  },
})
