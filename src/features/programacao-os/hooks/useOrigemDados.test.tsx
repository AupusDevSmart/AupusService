import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import { useOrigemDados } from './useOrigemDados';

// Os padrões do App.tsx: sem refetch ao montar e 15 min de dado fresco — a lista tem de buscar mesmo assim
const clienteDoApp = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false, refetchOnWindowFocus: false, staleTime: 15 * 60_000 } } });
const com = (cliente: QueryClient) => ({ children }: { children: ReactNode }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
const comQueryClient = ({ children }: { children: ReactNode }) => com(clienteDoApp())({ children });

const anomalia = (n: number, status = 'REGISTRADA') => ({
  id: `ANOM${String(n).padStart(22, '0')}`,
  descricao: `Anomalia ${n}`,
  local: 'Casa de máquinas',
  ativo: 'Motor',
  prioridade: 'MEDIA',
  status,
  planta: { nome: 'Usina A' },
});

/**
 * As origens da programação (SN-77): eram 100 de cada, filtradas no
 * navegador, e a 101ª não aparecia. Agora todas, por página, com a busca no
 * servidor — e só a lista do tipo escolhido busca.
 */
describe('useOrigemDados', () => {
  it('anomalias: a próxima página vem ao pedir mais, e a busca vai para o servidor', async () => {
    const pedidos: URLSearchParams[] = [];
    let solicitacoesPedidas = 0;
    server.use(
      http.get('*/anomalias', ({ request }) => {
        const params = new URL(request.url).searchParams;
        pedidos.push(params);
        const pagina = Number(params.get('page'));
        const inicio = (pagina - 1) * 50;
        const data = params.get('search') ? [anomalia(77)] : Array.from({ length: 50 }, (_, i) => anomalia(inicio + i + 1));
        return HttpResponse.json({ success: true, data: { data, pagination: { page: pagina, limit: 50, total: 120, totalPages: params.get('search') ? 1 : 3 } } });
      }),
      http.get('*/solicitacoes-servico', () => {
        solicitacoesPedidas++;
        return HttpResponse.json({ success: true, data: { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } } });
      }),
    );

    const { result } = renderHook(() => useOrigemDados('ANOMALIA'), { wrapper: comQueryClient });

    await waitFor(() => expect(result.current.anomalias.itens).toHaveLength(50));
    expect(Object.fromEntries(pedidos[0])).toMatchObject({ page: '1', limit: '50', status: 'REGISTRADA' });
    expect(result.current.anomalias.paginacao.temMais).toBe(true);

    act(() => result.current.anomalias.paginacao.carregarMais());
    await waitFor(() => expect(result.current.anomalias.itens).toHaveLength(100));
    expect(result.current.anomalias.itens[99].descricao).toBe('Anomalia 100');

    act(() => result.current.anomalias.paginacao.onBuscar('  motor 77 '));
    await waitFor(() => expect(result.current.anomalias.itens.map((a) => a.descricao)).toEqual(['Anomalia 77']));
    expect(pedidos.at(-1)?.get('search')).toBe('motor 77');
    expect(result.current.anomalias.paginacao.temMais).toBe(false);
    expect(solicitacoesPedidas).toBe(0);
  });

  it('planos: os vinculados a equipamento, em ordem de nome', async () => {
    const pedidos: URLSearchParams[] = [];
    server.use(
      http.get('*/planos-manutencao', ({ request }) => {
        pedidos.push(new URL(request.url).searchParams);
        const data = [{ id: 'PL1 ', nome: 'Plano do Inversor', total_tarefas: 2, equipamento: { id: 'E1', nome: 'Inversor 3', unidade: { nome: 'UFV', planta: { id: 'P1', nome: 'Usina A' } } } }];
        return HttpResponse.json({ success: true, data: { data, total: 1, page: 1, limit: 50, totalPages: 1 } });
      }),
    );

    const { result } = renderHook(() => useOrigemDados('PLANO_MANUTENCAO'), { wrapper: comQueryClient });

    await waitFor(() => expect(result.current.planos.itens).toHaveLength(1));
    expect(Object.fromEntries(pedidos[0])).toMatchObject({ vinculados: 'true', sort_by: 'nome', sort_order: 'asc', limit: '50' });
    expect(result.current.planos.itens[0]).toMatchObject({ id: 'PL1', equipamentoNome: 'Inversor 3', unidadeNome: 'UFV', plantaNome: 'Usina A', plantaId: 'P1' });
  });

  it('a pré-seleção busca pelo id, fora das páginas, e só se ainda for programável', async () => {
    server.use(
      http.get('*/anomalias', () => HttpResponse.json({ success: true, data: { data: [anomalia(1)], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } } })),
      http.get('*/anomalias/:id', ({ params }) =>
        HttpResponse.json({ success: true, data: params.id === anomalia(500).id ? anomalia(500) : anomalia(600, 'PROGRAMADA') }),
      ),
    );

    const { result } = renderHook(() => useOrigemDados('ANOMALIA'), { wrapper: comQueryClient });
    await waitFor(() => expect(result.current.anomalias.itens).toHaveLength(1));

    let resolvida: Awaited<ReturnType<typeof result.current.resolverOrigem>> | undefined;
    await act(async () => {
      resolvida = await result.current.resolverOrigem('ANOMALIA', ` ${anomalia(500).id} `);
    });
    expect(resolvida).toMatchObject({ item: { id: anomalia(500).id, descricao: 'Anomalia 500' } });
    // Guardada à parte: o resumo a acha pelo id, e a lista continua a do servidor
    expect(result.current.anomalias.porId(anomalia(500).id)?.descricao).toBe('Anomalia 500');
    expect(result.current.anomalias.itens.map((a) => a.descricao)).toEqual(['Anomalia 1']);

    await act(async () => {
      resolvida = await result.current.resolverOrigem('ANOMALIA', anomalia(600).id);
    });
    expect(resolvida).toEqual({ motivo: 'A anomalia está programada e não pode ser programada agora.' });
  });

  // A anomalia programada há pouco não pode continuar oferecida ao reabrir
  it('reabrir o seletor busca a lista de novo, mesmo com o cache do app', async () => {
    let pedidos = 0;
    server.use(
      http.get('*/anomalias', () => {
        pedidos++;
        return HttpResponse.json({ success: true, data: { data: [anomalia(1)], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } } });
      }),
    );
    const cliente = clienteDoApp();

    const primeira = renderHook(() => useOrigemDados('ANOMALIA'), { wrapper: com(cliente) });
    await waitFor(() => expect(primeira.result.current.anomalias.itens).toHaveLength(1));
    primeira.unmount();

    renderHook(() => useOrigemDados('ANOMALIA'), { wrapper: com(cliente) });
    await waitFor(() => expect(pedidos).toBe(2));
  });

  it('a página que repete um item não o duplica na lista', async () => {
    server.use(
      http.get('*/anomalias', ({ request }) => {
        const pagina = Number(new URL(request.url).searchParams.get('page'));
        const data = pagina === 1 ? [anomalia(1), anomalia(2)] : [anomalia(2), anomalia(3)];
        return HttpResponse.json({ success: true, data: { data, pagination: { page: pagina, limit: 50, total: 4, totalPages: 2 } } });
      }),
    );
    const { result } = renderHook(() => useOrigemDados('ANOMALIA'), { wrapper: comQueryClient });
    await waitFor(() => expect(result.current.anomalias.itens).toHaveLength(2));

    act(() => result.current.anomalias.paginacao.carregarMais());
    await waitFor(() => expect(result.current.anomalias.itens.map((a) => a.descricao)).toEqual(['Anomalia 1', 'Anomalia 2', 'Anomalia 3']));
  });

  // 500 ou rede não é "não existe": a pessoa concluía que a origem sumiu
  it('a pré-seleção que falha por erro da API diz que não carregou', async () => {
    server.use(
      http.get('*/anomalias', () => HttpResponse.json({ success: true, data: { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } } })),
      http.get('*/anomalias/:id', ({ params }) =>
        params.id === 'sumiu'
          ? HttpResponse.json({ success: false, error: { message: 'Anomalia não encontrada' } }, { status: 404 })
          : HttpResponse.json({ success: false, error: { message: 'Erro interno' } }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useOrigemDados('ANOMALIA'), { wrapper: comQueryClient });

    let motivo: unknown;
    await act(async () => {
      motivo = await result.current.resolverOrigem('ANOMALIA', 'sumiu');
    });
    expect(motivo).toEqual({ motivo: 'A anomalia não foi encontrada ou está fora do seu escopo.' });
    await act(async () => {
      motivo = await result.current.resolverOrigem('ANOMALIA', 'quebrou');
    });
    expect(motivo).toEqual({ motivo: 'Não foi possível carregar a anomalia agora. Tente de novo.' });
  });

  it('o plano do componente mostra a instalação do UC pai', async () => {
    server.use(
      http.get('*/planos-manutencao', () =>
        HttpResponse.json({
          success: true,
          data: { data: [{ id: 'PL2', nome: 'Plano da ventoinha', total_tarefas: 1, equipamento: { id: 'E2', nome: 'Ventoinha', unidade: null, equipamento_pai: { id: 'E1', nome: 'Inversor', unidade: { id: 'U1', nome: 'UFV Norte', planta: { id: 'P1', nome: 'Usina A' } } } } }], total: 1, page: 1, limit: 50, totalPages: 1 },
        }),
      ),
    );
    const { result } = renderHook(() => useOrigemDados('PLANO_MANUTENCAO'), { wrapper: comQueryClient });
    await waitFor(() => expect(result.current.planos.itens).toHaveLength(1));
    expect(result.current.planos.itens[0]).toMatchObject({ unidadeNome: 'UFV Norte', plantaNome: 'Usina A', plantaId: 'P1' });
  });
});
