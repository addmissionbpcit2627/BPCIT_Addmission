import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['.localhost', 'c06b-27-123-98-90.ngrok-free.app', "bpcit-addmission.vercel.app"],
  }
})
