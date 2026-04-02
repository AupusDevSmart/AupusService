import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plugin customizado para resolver @ baseado no contexto
function contextualAliasPlugin(): Plugin {
  const nexonPath = path.resolve(__dirname, '../../AupusNexOn')
  const servicePath = path.resolve(__dirname, './src')

  // Módulos compartilhados: imports do NexOn que devem usar a versão do Service
  // Garante uma única instância de estado (store) no bundle
  const sharedModules = [
    'store/useUserStore',
  ]

  return {
    name: 'contextual-alias',
    async resolveId(source, importer, options) {
      if (source.startsWith('@/')) {
        const cleanPath = source.replace('@/', '')

        // ✅ FORÇAR: Se o importador vem do NexOn OU se o arquivo já foi resolvido no NexOn, resolver @ para NexOn
        // Isso garante que TODA a árvore de imports do NexOn continue no NexOn
        if (importer && (importer.includes('AupusNexOn') || importer.includes(nexonPath.replace(/\\/g, '/')))) {
          // Módulos compartilhados: usar SEMPRE a versão do Service
          // Ex: useUserStore deve ser único para manter o estado de login
          if (sharedModules.some(mod => cleanPath.startsWith(mod))) {
            const basePath = path.resolve(servicePath, cleanPath)
            const resolved = await this.resolve(basePath, importer, { skipSelf: true, ...options })
            if (resolved) {
              console.log(`🔗 [ALIAS] ${source} → Service (shared module, from ${importer?.substring(importer.lastIndexOf('/') + 1)})`)
              return resolved
            }
          }

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
    // Forçar uma única instância de React e Radix UI no bundle
    // Sem isso, NexOn resolve de seu próprio node_modules/ criando
    // instâncias duplicadas que quebram contextos do Radix (Popover, Dialog, etc.)
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