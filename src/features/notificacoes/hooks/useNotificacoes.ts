import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacoesApi, type PreferenciaDeNotificacao } from '@/services/notificacoes.services';

const POR_PAGINA = 20;
const CHAVE = ['notificacoes'] as const;
const chaveDaContagem = [...CHAVE, 'contagem'] as const;
const chaveDaLista = (somenteNaoLidas: boolean) => [...CHAVE, 'lista', somenteNaoLidas] as const;
const chaveDasPreferencias = [...CHAVE, 'preferencias'] as const;

/** O número do sininho. Atualiza a cada minuto e quando a janela volta ao foco. */
export function useContagemDeNaoLidas() {
  return useQuery({
    queryKey: chaveDaContagem,
    queryFn: () => notificacoesApi.contarNaoLidas(),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * A lista do sheet, de 20 em 20. Só busca com o sheet aberto, e sempre fresca
 * ao abrir: o padrão do app (15 min de cache, sem refetch ao montar) mostraria
 * a lista velha. Aberto, acompanha o contador (a cada minuto).
 */
export function useListaDeNotificacoes(somenteNaoLidas: boolean, aberto: boolean) {
  return useInfiniteQuery({
    queryKey: chaveDaLista(somenteNaoLidas),
    queryFn: ({ pageParam }) => notificacoesApi.listar({ somenteNaoLidas, page: pageParam, limit: POR_PAGINA }),
    initialPageParam: 1,
    getNextPageParam: (ultima) =>
      ultima.pagination.page * ultima.pagination.limit < ultima.pagination.total ? ultima.pagination.page + 1 : undefined,
    enabled: aberto,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: aberto ? 60_000 : false,
  });
}

/** Marcar uma ou todas: a contagem e as listas recarregam juntas, do servidor. */
export function useMarcarNotificacoes() {
  const queryClient = useQueryClient();
  const recarregar = () => queryClient.invalidateQueries({ queryKey: CHAVE });
  const umaLida = useMutation({ mutationFn: (id: string) => notificacoesApi.marcarLida(id), onSettled: recarregar });
  const todasLidas = useMutation({ mutationFn: () => notificacoesApi.marcarTodasLidas(), onSettled: recarregar });
  return { umaLida, todasLidas };
}

export function usePreferenciasDeNotificacao() {
  return useQuery({ queryKey: chaveDasPreferencias, queryFn: () => notificacoesApi.preferencias() });
}

export function useSalvarPreferenciasDeNotificacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (escolhas: Pick<PreferenciaDeNotificacao, 'evento' | 'email'>[]) => notificacoesApi.salvarPreferencias(escolhas),
    onSuccess: (salvas) => queryClient.setQueryData(chaveDasPreferencias, salvas),
  });
}
