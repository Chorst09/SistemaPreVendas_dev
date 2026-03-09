import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

const frontendRoot = __dirname
const frontendNodeModules = path.resolve(frontendRoot, 'node_modules')

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(frontendRoot, 'src/test-setup.ts')],
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(frontendRoot, 'src'),
      react: path.resolve(frontendNodeModules, 'react'),
      'react-dom': path.resolve(frontendNodeModules, 'react-dom'),
      'react/jsx-runtime': path.resolve(frontendNodeModules, 'react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(frontendNodeModules, 'react/jsx-dev-runtime.js'),
    },
  },
})
