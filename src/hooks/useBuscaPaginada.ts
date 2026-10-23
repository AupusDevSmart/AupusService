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
 * Sempre busca de novo ao abrir (`refetchOnMount: 'always'`): o app desliga o
 * refetch ao montar, e a origem programada há pouco continuaria oferecida — a
 * pessoa só descobria no 409 do salvar. As páginas juntam sem repetir o id: o
 * backend desempata a ordem, e isto é a defesa se um dia não desempatar.
 */
export function useBuscaPaginada<T extends { id: string }>({ chave, buscarPagina, ativa }: Opcoes<T>) {
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
    refetchOnMount: 'always',
    retry: soRepeteFalhaDeRede,
  });

  const itens = useMemo(() => {
    const vistos = new Set<string>();
    return (consulta.data?.pages ?? [])
      .flatMap((p) => p.itens)
      .filter((item) => {
        if (vistos.has(item.id)) return false;
        vistos.add(item.id);
        return true;
      });
  }, [consulta.data]);

  const paginacao: PaginacaoDoCombobox = {
    onBuscar: setTexto,
    carregarMais: () => void consulta.fetchNextPage(),
    temMais: consulta.hasNextPage,
    // Só a próxima página: a busca de fundo da primeira não pode barrar o "carregar mais"
    carregando: consulta.isFetchingNextPage,
  };

  return {
    itens,
    paginacao,
    /** A primeira página ainda não chegou */
    carregando: ativa && consulta.isPending,
    erro: consulta.isError,
  };
}
