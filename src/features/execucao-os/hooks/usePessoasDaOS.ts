import { useQuery } from '@tanstack/react-query';
import { execucaoOSApi } from '@/services/execucao-os.service';

/**
 * Quem pode registrar horas sem estar escalado (SN-61): a equipe da planta da
 * OS e o apoio. Pela rota da OS — o técnico de campo, que executa, não tem a
 * rota de pessoas da programação.
 */
export function usePessoasDaOS(osId?: string | null, ativo = true) {
  const id = osId?.trim() || null;
  return useQuery({
    queryKey: ['execucao-os', id, 'pessoas'],
    queryFn: () => execucaoOSApi.pessoas(id!),
    enabled: ativo && !!id,
    staleTime: 60_000,
  });
}
