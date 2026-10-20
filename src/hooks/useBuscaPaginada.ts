import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { PaginacaoDoCombobox } from '@/core';
import { soRepeteFalhaDeRede } from '@/utils/api-error';

export const POR_PAGINA = 50;
const ESPERA_DA_BUSCA_MS = 300;

export interface PaginaDaBusca<T> {
  itens: T[];
  temMais: boolean;
}

interface Opcoes<T> {
  /** O começo da chave do React Query; a busca entra no fim */
  chave: readonly unknown[];
  buscarPagina: (pagina: number, busca: string) => Promise<PaginaDaBusca<T>>;
  /** Só busca enquanto a lista está em uso (o seletor de origem tem três) */
  ativa: boolean;
}

/**
 * Uma lista de cadastro que cresce: TODAS as opções por rolagem infinita, com a
 * busca no servidor (SN-77; a regra da casa para seletor de registro). Carregar
 * 100 e filtrar no navegador escondia o 101º sem aviso.
 *
 * Sem cache entre aberturas (`staleTime: 0`): a origem programada há pouco
 * deixa de ser programável e não pode continuar na lista.
 */
export function useBuscaPaginada<T>({ chave, buscarPagina, ativa }: Opcoes<T>) {
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const espera = setTimeout(() => setBusca(texto.trim()), ESPERA_DA_BUSCA_MS);
    return () => clearTimeout(espera);
  }, [texto]);

  const consulta = useInfiniteQuery({
    queryKey: [...chave, busca],
    queryFn: ({ pageParam }) => buscarPagina(pageParam, busca),
    initialPageParam: 1,
    getNextPageParam: (ultima, todas) => (ultima.temMais ? todas.length + 1 : undefined),
    enabled: ativa,
    staleTime: 0,
    retry: soRepeteFalhaDeRede,
  });

  const itens = useMemo(() => (consulta.data?.pages ?? []).flatMap((p) => p.itens), [consulta.data]);

  const paginacao: PaginacaoDoCombobox = {
    onBuscar: setTexto,
    carregarMais: () => void consulta.fetchNextPage(),
    temMais: consulta.hasNextPage,
    carregando: consulta.isFetching,
  };

  return {
    itens,
    paginacao,
    /** A primeira página ainda não chegou */
    carregando: ativa && consulta.isPending,
    erro: consulta.isError,
  };
}
