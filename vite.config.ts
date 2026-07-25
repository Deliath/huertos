import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // La web se sirve desde https://Deliath.github.io/huertos/, es decir, desde
  // un subdirectorio y no desde la raíz del dominio. Sin esto, los recursos se
  // pedirían a /assets/… y darían 404 en producción.
  base: '/huertos/',
  plugins: [react()],
  server: {
    host: true,
  },
})
