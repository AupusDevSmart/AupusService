import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DADOS_DEMO } from './dadosDemo';
import { BotaoExportarPainel } from './BotaoExportarPainel';

/** O botão Exportar do painel (SN-82): os números da tela, as fórmulas e as OS da conta. */
const api = vi.hoisted(() => ({ carregar: vi.fn(), ordensDaConta: vi.fn() }));
const planilha = vi.hoisted(() => ({ baixar: vi.fn() }));
const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('@/services/dashboard-manutencao.services', () => ({ dashboardManutencaoApi: api }));
vi.mock('@/lib/planilha/estilo', async (original) => ({ ...(await original<typeof import('@/lib/planilha/estilo')>()), baixar: planilha.baixar }));
vi.mock('sonner', () => ({ toast }));

const filtros = { periodo: 'mes' as const, plantaId: 'P1' };
const periodo = { desde: '2026-10-01T03:00:00.000Z', ate: '2026-11-01T03:00:00.000Z' };
const renderizar = (desabilitado = false) =>
  render(<BotaoExportarPainel filtros={filtros} filtrosEmPalavras={[['Período', 'Mês atual']]} graficosAVista={['custo']} desabilitado={desabilitado} />);

// O exceljs carrega na exportação: com a suíte inteira em paralelo passava dos 5 s
describe('BotaoExportarPainel', { timeout: 120_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.carregar.mockResolvedValue({ ...DADOS_DEMO, periodo });
    api.ordensDaConta.mockResolvedValue({ periodo, ordens: [] });
  });

  // Juntos, no clique: com o que a tela tinha em memória, os números podiam ser de outro filtro
  it('lê o painel e as OS da conta juntos, com os filtros da tela, e baixa a planilha', async () => {
    renderizar();

    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));

    await waitFor(() => expect(planilha.baixar).toHaveBeenCalled(), { timeout: 25_000 });
    expect(api.carregar).toHaveBeenCalledWith(filtros);
    expect(api.ordensDaConta).toHaveBeenCalledWith(filtros);
    expect(planilha.baixar.mock.calls[0][1]).toMatch(/^painel-de-manutencao-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  it('o período mudou entre as duas leituras (virada do mês): avisa e não baixa', async () => {
    api.ordensDaConta.mockResolvedValue({ periodo: { desde: periodo.ate, ate: '2026-12-01T03:00:00.000Z' }, ordens: [] });
    renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não foi possível exportar', { description: 'O período mudou durante a exportação (virada do mês): exporte de novo.' }),
    );
    expect(planilha.baixar).not.toHaveBeenCalled();
  });

  it('com dados de exemplo, não exporta: seriam lidos como reais fora da tela', () => {
    renderizar(true);
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeDisabled();
  });

  it('erro da API fica com o interceptor; o da planilha avisa', async () => {
    api.ordensDaConta.mockRejectedValueOnce(Object.assign(new Error('500'), { isAxiosError: true }));
    renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar' })).toBeEnabled());
    expect(toast.error).not.toHaveBeenCalled();

    planilha.baixar.mockRejectedValueOnce(new Error('disco cheio'));
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível exportar', { description: 'disco cheio' }), { timeout: 25_000 });
  });
});
