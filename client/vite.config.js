import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Default to production API on Vercel unless explicitly overridden
  const target = (env.VITE_API_BASE || 'https://queme-mocha.vercel.app').replace(/\/+$/, '')
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        // Proxy API to backend to avoid CORS in dev and support cookies
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          // preserve prefix and forward as-is
          rewrite: (p) => p,
        },
      },
    },
  }
})
 