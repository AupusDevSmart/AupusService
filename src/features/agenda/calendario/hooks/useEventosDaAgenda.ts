import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { eventosDaAgendaApi, type FiltroDoCalendario } from '@/services/eventos-da-agenda.services';
import { soRepeteFalhaDeRede } from '@/utils/api-error';

/**
 * Os eventos do período (SN-52). A OS anda durante o dia: busca de novo a cada
 * vez que a página abre (quem volta da OS que acabou de iniciar a vê mudada), e
 * ao trocar de mês o anterior fica na tela até o novo chegar. O erro já sai em
 * toast pelo interceptor; a página mostra o estado.
 */
export function useEventosDaAgenda(filtro: FiltroDoCalendario) {
  return useQuery({
    queryKey: ['agenda', 'eventos', filtro],
    queryFn: () => eventosDaAgendaApi.listar(filtro),
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
    retry: soRepeteFalhaDeRede,
  });
}
