import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import { usePlantasDoFiltro } from './usePlantasDoFiltro';

// O retry do próprio hook (o padrão do teste desliga, aqui ele tem de valer)
const comQueryClient = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;

/** SN-56: as plantas do filtro, todas as páginas, e a falha com o motivo da API. */
describe('usePlantasDoFiltro', () => {
  it('junta todas as páginas, aparadas e em ordem de nome, depois do "todas"', async () => {
    server.use(
      http.get('*/plantas', ({ request }) => {
        const pagina = Number(new URL(request.url).searchParams.get('page'));
        const data = pagina === 1 ? [{ id: 'P2 ', nome: 'Usina B' }] : [{ id: 'P1', nome: 'Usina A' }];
        return HttpResponse.json({ success: true, data: { data, pagination: { page: pagina, limit: 100, total: 2, totalPages: 2 } } });
      }),
    );

    const { result } = renderHook(() => usePlantasDoFiltro(), { wrapper: comQueryClient });

    await waitFor(() => expect(result.current.opcoes).toHaveLength(3));
    expect(result.current.opcoes).toEqual([
      { value: 'all', label: 'Todas as plantas' },
      { value: 'P1', label: 'Usina A' },
      { value: 'P2', label: 'Usina B' },
    ]);
  });

  // O service trocava o erro do axios por outro sem a resposta: o aviso dizia
  // "a API não respondeu" para um 403 e repetia o pedido como se fosse a rede
  it('a falha da API traz o motivo e não repete', async () => {
    let pedidos = 0;
    server.use(
      http.get('*/plantas', () => {
        pedidos++;
        return HttpResponse.json({ success: false, error: { message: 'Sem permissão para ver plantas' } }, { status: 403 });
      }),
    );

    const { result } = renderHook(() => usePlantasDoFiltro(), { wrapper: comQueryClient });

    await waitFor(() => expect(result.current.erro).toBe('Sem permissão para ver plantas'));
    expect(pedidos).toBe(1);
  });
});
