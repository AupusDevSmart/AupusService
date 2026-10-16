import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlantasService } from '@/services/plantas.services';
import { formatApiError, soRepeteFalhaDeRede } from '@/utils/api-error';

export const TODAS_AS_PLANTAS = { value: 'all', label: 'Todas as plantas' };

/**
 * As plantas que quem está vendo enxerga (a API já filtra pelo escopo), para os
 * filtros das listas. Todas, página a página: são dezenas, e o filtro mostra
 * todas para escolher.
 */
export function usePlantasDoFiltro() {
  const consulta = useQuery({
    queryKey: ['plantas', 'opcoes-do-filtro'],
    queryFn: async () =>
      (await PlantasService.listarTodas())
        .map((p) => ({ value: String(p.id).trim(), label: p.nome }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    staleTime: 5 * 60_000,
    retry: soRepeteFalhaDeRede,
  });

  const opcoes = useMemo(() => [TODAS_AS_PLANTAS, ...(consulta.data ?? [])], [consulta.data]);
  // O motivo que a API devolveu, para a tela dizer por que o filtro não tem plantas
  const erro = consulta.isError ? formatApiError(consulta.error) : null;
  return { opcoes, carregando: consulta.isLoading, erro };
}
