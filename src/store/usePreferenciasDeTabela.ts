// src/store/usePreferenciasDeTabela.ts
import { useCallback } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  OPCOES_LINHAS_POR_PAGINA,
  LINHAS_POR_PAGINA_PADRAO,
} from '@/core/components/common/base-table/linhas-por-pagina';

export { OPCOES_LINHAS_POR_PAGINA, LINHAS_POR_PAGINA_PADRAO };

interface PreferenciasDeTabelaState {
  /** Por tabela: cada lista lembra o proprio tamanho. */
  linhasPorPagina: Record<string, number>;
  definirLinhasPorPagina: (tabela: string, linhas: number) => void;
}

/**
 * Preferencias de exibicao das tabelas, guardadas no navegador.
 *
 * Por tabela e nao global: quem aumenta equipamentos para 100 porque tem muitos
 * nao espera ver a tabela de planos — que tem linhas expansiveis — mudar junto.
 */
export const usePreferenciasDeTabela = create(
  persist<PreferenciasDeTabelaState>(
    (set) => ({
      linhasPorPagina: {},
      definirLinhasPorPagina: (tabela, linhas) =>
        set((estado) => ({
          linhasPorPagina: { ...estado.linhasPorPagina, [tabela]: linhas },
        })),
    }),
    {
      name: 'aupus-service:preferencias-de-tabela',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Valor guardado so vale se for uma das opcoes. Um numero que saiu da lista
 * (ou lixo no localStorage) viraria um `limit` que o backend recusa.
 */
const valido = (linhas: unknown): linhas is number =>
  typeof linhas === 'number' &&
  (OPCOES_LINHAS_POR_PAGINA as readonly number[]).includes(linhas);

/**
 * Leitura fora de componente, para estado inicial montado antes do primeiro
 * render (hooks de listagem com `useState` inicial).
 *
 * O persist com localStorage hidrata de forma sincrona na criacao do store,
 * entao isto ja devolve o valor salvo — nao ha um render com o padrao antes.
 */
export function lerLinhasPorPagina(tabela: string): number {
  const salvo = usePreferenciasDeTabela.getState().linhasPorPagina[tabela];
  return valido(salvo) ? salvo : LINHAS_POR_PAGINA_PADRAO;
}

/**
 * Linhas por pagina de UMA tabela, lembradas entre visitas.
 *
 * `tabela` e so a chave de armazenamento — use o nome da tela ("instrucoes",
 * "equipamentos"), estavel entre versoes, senao a preferencia salva se perde.
 */
export function useLinhasPorPagina(tabela: string) {
  const salvo = usePreferenciasDeTabela((estado) => estado.linhasPorPagina[tabela]);
  const definir = usePreferenciasDeTabela((estado) => estado.definirLinhasPorPagina);

  const linhas = valido(salvo) ? salvo : LINHAS_POR_PAGINA_PADRAO;
  const mudarLinhas = useCallback((novo: number) => definir(tabela, novo), [definir, tabela]);

  return [linhas, mudarLinhas] as const;
}
