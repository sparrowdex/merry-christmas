import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@react-three')) {
              return 'react-three';
            }
            if (id.includes('three-stdlib')) {
              return 'three-stdlib';
            }
            if (id.includes('/three/') || id.includes('\\three\\')) {
              return 'three';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
          }
        },
      },
    },
  },
})


