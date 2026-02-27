import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plugin customizado para resolver @ baseado no contexto
function contextualAliasPlugin(): Plugin {
  const nexonPath = path.resolve(__dirname, '../../AupusNexOn')
  const servicePath = path.resolve(__dirname, './src')

  return {
    name: 'contextual-alias',
    async resolveId(source, importer, options) {
      if (source.startsWith('@/')) {
        const cleanPath = source.replace('@/', '')

        // ✅ FORÇAR: Se o importador vem do NexOn OU se o arquivo já foi resolvido no NexOn, resolver @ para NexOn
        // Isso garante que TODA a árvore de imports do NexOn continue no NexOn
        if (importer && (importer.includes('AupusNexOn') || importer.includes(nexonPath.replace(/\\/g, '/')))) {
          const basePath = path.resolve(nexonPath, 'src', cleanPath)
          // Deixar Vite resolver extensões (.ts, .tsx, .js, etc.)
          const resolved = await this.resolve(basePath, importer, { skipSelf: true, ...options })

          if (resolved) {
            console.log(`✅ [ALIAS] ${source} → NexOn (from ${importer?.substring(importer.lastIndexOf('/') + 1)})`)
            return resolved
          }

          // ❌ Se não encontrou no NexOn, NÃO fazer fallback para Service
          // Isso evita que componentes do NexOn peguem versões erradas do Service
          console.warn(`⚠️ [ALIAS] ${source} não encontrado no NexOn (esperado), importer: ${importer}`)
          return null // Deixar Vite mostrar o erro correto
        }

        // Caso contrário, resolver @ para Service
        const basePath = path.resolve(servicePath, cleanPath)
        const resolved = await this.resolve(basePath, importer, { skipSelf: true, ...options })
        if (resolved) {
          console.log(`✅ [ALIAS] ${source} → Service (from ${importer?.substring(importer.lastIndexOf('/') + 1)})`)
          return resolved
        }
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