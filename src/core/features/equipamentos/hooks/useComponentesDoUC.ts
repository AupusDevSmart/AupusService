import { useQuery } from '@tanstack/react-query';
import { equipamentosApi } from '@/services/equipamentos.services';
import { transformApiToFrontend } from '@/features/equipamentos/hooks/useEquipamentos';
import type { Equipamento } from '@/core/features/equipamentos/types';

/** Prefixo da chave: invalidar por ele recarrega os componentes de qualquer UC aberta. */
export const CHAVE_COMPONENTES_DO_UC = 'componentes-do-uc';

/** Teto da rota de listagem (`@Max(100)` no DTO). Acima disso a linha avisa. */
export const LIMITE_DE_COMPONENTES_NA_LINHA = 100;

/**
 * Componentes (UAR) do UC aberto na linha expandida da lista de equipamentos.
 *
 * Usa a MESMA rota da listagem, e nao `/:id/componentes`: ela devolve o formato
 * que `transformApiToFrontend` ja conhece (tipo, unidade e pai embutidos), aplica
 * o escopo por planta e esconde PONTO e BARRAMENTO, que nao sao cadastro. Nao
 * passa pelo `useEquipamentos` porque ele liga o `loading` da pagina inteira, e
 * abrir uma linha nao pode travar a tabela.
 */
export function useComponentesDoUC(ucId: string | null) {
  const id = ucId?.trim() || null;

  const consulta = useQuery({
    queryKey: [CHAVE_COMPONENTES_DO_UC, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const resposta = await equipamentosApi.findAll({
        classificacao: 'UAR',
        equipamento_pai_id: id as string,
        ocultarVirtuais: true,
        orderBy: 'nome',
        orderDirection: 'asc',
        page: 1,
        limit: LIMITE_DE_COMPONENTES_NA_LINHA,
      });

      // Depois do interceptor a lista vem em `data`; um embrulho a mais, em `data.data`
      const lista = Array.isArray(resposta.data) ? resposta.data : (resposta.data?.data ?? []);
      const paginacao =
        resposta.pagination ?? (Array.isArray(resposta.data) ? undefined : resposta.data?.pagination);

      return {
        componentes: lista.map(transformApiToFrontend) as Equipamento[],
        total: paginacao?.total ?? lista.length,
      };
    },
  });

  return {
    componentes: consulta.data?.componentes ?? [],
    total: consulta.data?.total ?? 0,
    carregando: consulta.isLoading,
    falhou: consulta.isError,
    tentarNovamente: () => void consulta.refetch(),
  };
}
