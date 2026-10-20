import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import { dashboardManutencaoApi } from './dashboard-manutencao.services';

/** O painel manda só os filtros escolhidos: "all" é como os combos dizem "todas" (SN-79). */
describe('dashboardManutencaoApi.carregar', () => {
  it('manda o período e os filtros escolhidos; "all" e vazio ficam de fora', async () => {
    const pedidos: URLSearchParams[] = [];
    server.use(
      http.get('*/dashboard/manutencao', ({ request }) => {
        pedidos.push(new URL(request.url).searchParams);
        return HttpResponse.json({ success: true, data: { meses: ['out'], kpis: [] } });
      }),
    );

    const painel = await dashboardManutencaoApi.carregar({ periodo: 'mes', plantaId: 'P1', unidadeId: 'all', criticidade: '', equipe: 'Equipe Alfa' });

    expect(Object.fromEntries(pedidos[0])).toEqual({ periodo: 'mes', plantaId: 'P1', equipe: 'Equipe Alfa' });
    expect(painel.meses).toEqual(['out']);
  });
});
