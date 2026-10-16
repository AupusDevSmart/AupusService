import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import { programacaoOSApi } from './programacao-os.service';

/** SN-55: o "todos" dos filtros de id e o vazio não vão para a API ('all' casaria como id e não traria nada). */
describe('programacaoOSApi.listar', () => {
  it('manda planta, equipamento e período pedidos; deixa de fora "todos" e vazio', async () => {
    const pedidos: URLSearchParams[] = [];
    server.use(
      http.get('*/programacao-os', ({ request }) => {
        pedidos.push(new URL(request.url).searchParams);
        return HttpResponse.json({ success: true, data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } });
      }),
    );

    await programacaoOSApi.listar({ page: 1, status: 'all', planta_id: 'P1', equipamento_id: 'EQ1', data_inicio: '2026-11-01', data_fim: '' });
    await programacaoOSApi.listar({ page: 1, planta_id: 'all', equipamento_id: 'all', data_inicio: '', data_fim: '' });

    expect(Object.fromEntries(pedidos[0])).toEqual({ page: '1', status: 'all', planta_id: 'P1', equipamento_id: 'EQ1', data_inicio: '2026-11-01' });
    expect(Object.fromEntries(pedidos[1])).toEqual({ page: '1' });
  });
});
