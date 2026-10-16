import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlantasService } from '@/services/plantas.services';
import { soRepeteFalhaDeRede } from '@/utils/api-error';

const POR_PAGINA = 100;
/** Trava de segurança do laço: mais que isto não cabe num filtro. */
const PAGINAS_NO_MAXIMO = 50;

export const TODAS_AS_PLANTAS = { value: 'all', label: 'Todas as plantas' };

/**
 * As plantas que quem está vendo enxerga (a API já filtra pelo escopo), para os
 * filtros das listas. Todas, página a página: são dezenas, e o filtro mostra
 * todas para escolher.
 */
export function usePlantasDoFiltro() {
  const consulta = useQuery({
    queryKey: ['plantas', 'opcoes-do-filtro'],
    queryFn: async () => {
      const plantas: { value: string; label: string }[] = [];
      for (let pagina = 1; pagina <= PAGINAS_NO_MAXIMO; pagina++) {
        const resposta = await PlantasService.getAllPlantas({ page: pagina, limit: POR_PAGINA });
        plantas.push(...(resposta.data ?? []).map((p) => ({ value: String(p.id).trim(), label: p.nome })));
        if (!resposta.pagination || pagina >= resposta.pagination.totalPages) break;
      }
      return plantas.sort((a, b) => a.label.localeCompare(b.label));
    },
    staleTime: 5 * 60_000,
    retry: soRepeteFalhaDeRede,
  });

  const opcoes = useMemo(() => [TODAS_AS_PLANTAS, ...(consulta.data ?? [])], [consulta.data]);
  return { opcoes, carregando: consulta.isLoading };
}
