import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Das Aspire-Gateway laeuft im Container und muss hier hereinreichen —
    // mit der Vorgabe (nur localhost) kaeme es nicht durch.
    host: true,
  },
})
