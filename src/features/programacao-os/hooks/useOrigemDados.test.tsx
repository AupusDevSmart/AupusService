import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import { useOrigemDados } from './useOrigemDados';

const comQueryClient = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

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
    // Guardada no começo da lista: o resumo a acha mesmo fora das páginas carregadas
    expect(result.current.anomalias.itens.map((a) => a.descricao)).toEqual(['Anomalia 500', 'Anomalia 1']);

    await act(async () => {
      resolvida = await result.current.resolverOrigem('ANOMALIA', anomalia(600).id);
    });
    expect(resolvida).toEqual({ motivo: 'A anomalia está programada e não pode ser programada agora.' });
  });
});
