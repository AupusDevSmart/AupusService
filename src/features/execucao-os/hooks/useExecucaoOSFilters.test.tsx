import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test-mocks/server';
import { useExecucaoOSFilters } from './useExecucaoOSFilters';

const comQueryClient = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

/** SN-55: só vai para a API o que ela declara (o resto dá 400 pelo forbidNonWhitelisted). */
describe('useExecucaoOSFilters', () => {
  beforeEach(() => server.use(http.get('*/plantas', () => HttpResponse.json({ success: true, data: { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } } }))));

  it('planta, equipamento e período viram os parâmetros da API; o responsável vai como texto', () => {
    const { result } = renderHook(
      () => useExecucaoOSFilters({ page: 1, limit: 10, planta: 'P1', equipamento: 'EQ1', dataInicio: '2026-11-01', dataFim: '2026-11-30', responsavel: 'Ana' }),
      { wrapper: comQueryClient },
    );

    expect(result.current.toApiParams).toEqual({
      page: 1,
      limit: 10,
      planta_id: 'P1',
      equipamento_id: 'EQ1',
      data_inicio: '2026-11-01',
      data_fim: '2026-11-30',
      responsavel: 'Ana',
    });
  });

  it('"todos" e vazio não vão', () => {
    const { result } = renderHook(() => useExecucaoOSFilters({ page: 1, limit: 10, planta: 'all', equipamento: 'all', dataInicio: '', dataFim: '' }), {
      wrapper: comQueryClient,
    });

    expect(result.current.toApiParams).toEqual({ page: 1, limit: 10 });
  });

  it('os filtros da tela trazem planta, equipamento e o período "de / até"', () => {
    const { result } = renderHook(() => useExecucaoOSFilters({ page: 1, limit: 10 }), { wrapper: comQueryClient });

    expect(result.current.filterConfigs.map((f) => f.key)).toEqual(expect.arrayContaining(['planta', 'equipamento', 'dataInicio', 'dataFim']));
  });
});
