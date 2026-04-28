import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Forca uma unica instancia de React, Radix, etc. no bundle.
    // @aupus/shared-pages declara essas como peerDependencies; o dedupe
    // garante que o consumer e o pacote shared usem a mesma instancia.
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@radix-ui/react-popover',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-label',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-avatar',
      '@radix-ui/react-progress',
      '@radix-ui/react-toast',
      'cmdk',
      'zustand',
      'react-router-dom',
      'lucide-react',
      'class-variance-authority',
      'clsx',
    ],
  },
})
