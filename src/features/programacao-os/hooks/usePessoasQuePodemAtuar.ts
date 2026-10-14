import { useQuery } from '@tanstack/react-query';
import { programacaoOSApi } from '@/services/programacao-os.service';

/**
 * Responsável e técnicos possíveis para uma planta (SN-31). Sem planta, só o
 * apoio (planejador, gerente, administrador) — técnico de campo só enxerga OS
 * das plantas em que está, então só é escalado com a planta definida.
 */
export function usePessoasQuePodemAtuar(plantaId?: string | null, ativo = true) {
  const planta = plantaId?.trim() || null;
  return useQuery({
    queryKey: ['programacao-os', 'pessoas', planta],
    queryFn: () => programacaoOSApi.pessoas(planta),
    enabled: ativo,
    staleTime: 60_000,
  });
}
