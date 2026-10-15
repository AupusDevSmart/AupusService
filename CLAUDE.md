# AupusService (front)

SPA do Aupus Service: React 18 + TypeScript + Vite, Tailwind + Radix/shadcn (`components.json`), Vitest.
Consome a API `aupus-service-api` (`VITE_API_URL`). Em produção o nginx serve `dist/`.

## Estrutura

- `src/features/<dominio>/`: telas e lógica por funcionalidade (planos-manutencao, programacao-os, execucao-os,
  anomalias, equipamentos, plantas, usuarios...).
- `src/services/*.service(s).ts`: chamadas à API, uma por domínio.
- `src/core/`: o antigo pacote `@aupus/shared-pages`, incorporado aqui.
- `src/pages/`, `AppRoutes.tsx`, `store/` (zustand), `components/`, `lib/`, `utils/`.

## Comandos

- Gerenciador: **pnpm** (`pnpm install --frozen-lockfile`).
- `pnpm dev`, `pnpm lint`, `npx tsc -b`, `pnpm test` (Vitest).
- `vitest.config.ts` herda o `resolve` do `vite.config.ts` (alias + `dedupe`). Ao mexer no `dedupe`, lembre que ele
  evita duas cópias de React ("invalid hook call" nos testes).

## Cuidados

- Tudo em `VITE_*` vai para o bundle público: nunca coloque segredo ali.
- Tela nova ou endpoint novo: a API vem primeiro (PR próprio no `aupus-service-api`).
- Produção publica com `./deploy.sh` (working tree limpo, `main` alinhada).
- Commits: Conventional Commits em português, corpo com o porquê.
