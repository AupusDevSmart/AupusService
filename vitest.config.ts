import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * Config do Vitest — herda o `resolve` do vite.config em vez de duplicar.
 *
 * Isso NAO e detalhe de estilo. O vite.config deste projeto tem um bloco
 * `dedupe` com 30 entradas (react, react-dom, os pacotes do Radix, zustand,
 * react-router-dom...) que existe porque o @aupus/shared-pages declara essas
 * libs como peerDependencies. Sem o dedupe, o app e o pacote shared carregam
 * instancias diferentes de React, e qualquer teste que renderize componente do
 * shared-pages quebra com "invalid hook call" — erro cuja mensagem nao aponta
 * para a causa.
 *
 * Herdando via mergeConfig, alias e dedupe tem uma fonte so: quem mexer no
 * vite.config nao precisa lembrar de espelhar aqui.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './src/test-setup.ts',
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'e2e'],
      css: false,
    },
  }),
);
