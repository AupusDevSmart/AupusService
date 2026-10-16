import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ComboboxOption, PaginacaoDoCombobox } from '@/core';
import { equipamentosApi, type EquipamentoApiResponse, type EquipamentosListApiResponse } from '@/services/equipamentos.services';
import { soRepeteFalhaDeRede } from '@/utils/api-error';

const POR_PAGINA = 50;
const ESPERA_DA_BUSCA_MS = 300;

/** A listagem vem como { data, pagination } ou com um embrulho a mais. */
function lerPagina(resposta: EquipamentosListApiResponse) {
  const corpo = Array.isArray(resposta.data) ? { data: resposta.data, pagination: resposta.pagination } : resposta.data;
  return { itens: corpo.data ?? [], pagina: corpo.pagination?.page ?? 1, paginas: corpo.pagination?.pages ?? 1 };
}

const rotulo = (e: EquipamentoApiResponse) => [e.nome, e.unidade?.nome].filter(Boolean).join(' · ');

/**
 * As UCs para o filtro do calendário (o componente vem junto com a UC): todas,
 * por rolagem infinita, com busca no servidor — o cadastro cresce.
 */
export function useEquipamentosDoFiltro(plantaId: string | undefined, escolhido?: { id: string; rotulo: string }) {
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  // Só busca quando alguém abre o filtro: o calendário abre muito mais vezes do que se filtra
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const espera = setTimeout(() => setBusca(texto.trim()), ESPERA_DA_BUSCA_MS);
    return () => clearTimeout(espera);
  }, [texto]);

  const consulta = useInfiniteQuery({
    queryKey: ['agenda', 'equipamentos-do-filtro', plantaId ?? null, busca],
    queryFn: async ({ pageParam }) =>
      lerPagina(
        await equipamentosApi.findAll({
          page: pageParam,
          limit: POR_PAGINA,
          classificacao: 'UC',
          planta_id: plantaId,
          search: busca || undefined,
          // Em ordem de nome: a lista é para achar, não para ver o que entrou por último
          orderBy: 'nome',
          orderDirection: 'asc',
        }),
      ),
    initialPageParam: 1,
    getNextPageParam: (ultima) => (ultima.pagina < ultima.paginas ? ultima.pagina + 1 : undefined),
    staleTime: 5 * 60_000,
    enabled: aberto,
    retry: soRepeteFalhaDeRede,
  });

  const opcoes: ComboboxOption[] = useMemo(
    () => (consulta.data?.pages ?? []).flatMap((p) => p.itens).map((e) => ({ value: String(e.id).trim(), label: rotulo(e) })),
    [consulta.data],
  );

  const paginacao: PaginacaoDoCombobox = {
    onBuscar: setTexto,
    carregarMais: () => void consulta.fetchNextPage(),
    temMais: consulta.hasNextPage,
    carregando: consulta.isFetching,
    rotuloDoValor: escolhido?.rotulo,
    onAbrir: () => setAberto(true),
  };

  return { opcoes, paginacao };
}
