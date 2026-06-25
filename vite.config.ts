import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mientras se sirve como project Pages site:  VITE_BASE='/configurador.solupark.uy/'
// Cuando se active el subdominio propio:      VITE_BASE='/'
const fallbackBase = '/configurador.solupark.uy/'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE ?? (mode === 'production' ? fallbackBase : '/'),
}))
