import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    // Los 14 archivos de interfaz levantan cada uno un entorno jsdom, que es
    // caro. Arrancarlos todos a la vez agota la CPU y Vitest acaba sin poder
    // crear los procesos de trabajo: los archivos afectados no se ejecutan y
    // el resumen no lo delata. Acotar los trabajadores lo evita sin
    // renunciar del todo al paralelismo.
    maxWorkers: 2,
  },
})
