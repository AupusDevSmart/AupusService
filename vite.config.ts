import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plugin customizado para resolver @ baseado no contexto
function contextualAliasPlugin(): Plugin {
  return {
    name: 'contextual-alias',
    async resolveId(source, importer, options) {
      if (source.startsWith('@/')) {
        const cleanPath = source.replace('@/', '')

        // Se o importador vem do NexOn, resolver @ para NexOn
        if (importer && importer.includes('AupusNexOn')) {
          const basePath = path.resolve(__dirname, '../../AupusNexOn/src', cleanPath)
          // Deixar Vite resolver extensões (.ts, .tsx, .js, etc.)
          const resolved = await this.resolve(basePath, importer, { skipSelf: true, ...options })
          if (resolved) return resolved
        }

        // Caso contrário, resolver @ para Service
        const basePath = path.resolve(__dirname, './src', cleanPath)
        const resolved = await this.resolve(basePath, importer, { skipSelf: true, ...options })
        if (resolved) return resolved
      }
      return null // Deixar outros resolvers handlearem
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    contextualAliasPlugin()
  ],
  resolve: {
    alias: {
      // Alias explícito para importar do NexOn
      '@nexon': path.resolve(__dirname, '../../AupusNexOn/src'),
    },
  },
})