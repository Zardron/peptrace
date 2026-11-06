import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_DEV_API_TARGET || 'http://localhost:3001'
  const isLocalTarget = /localhost|127\.0\.0\.1/.test(target)

  return {
    plugins: [react()],
    server: {
      // Match Google Cloud Authorized JavaScript origin: http://localhost:3000
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: true,
          // Local Express serves routes at /, while production nginx keeps /api.
          ...(isLocalTarget
            ? { rewrite: (path: string) => path.replace(/^\/api/, '') }
            : {}),
        },
      },
    },
  }
})
