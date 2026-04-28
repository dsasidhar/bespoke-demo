import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Set VITE_BASE for GH Pages (e.g., "/bespoke/"); default to "/" for local dev.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
  }
})
