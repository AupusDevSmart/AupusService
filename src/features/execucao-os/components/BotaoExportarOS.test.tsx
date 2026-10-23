import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BotaoExportarOS } from './BotaoExportarOS';

/** O botão Exportar da Execução de OS (SN-63): antes, "Funcionalidade em breve". */
const api = vi.hoisted(() => ({ findAll: vi.fn() }));
const planilha = vi.hoisted(() => ({ baixar: vi.fn() }));
const toast = vi.hoisted(() => ({ info: vi.fn(), warning: vi.fn(), error: vi.fn() }));
vi.mock('@/services/execucao-os.service', () => ({ execucaoOSApi: api }));
vi.mock('@/lib/planilha/estilo', async (original) => ({ ...(await original<typeof import('@/lib/planilha/estilo')>()), baixar: planilha.baixar }));
vi.mock('sonner', () => ({ toast }));

const umaOS = { id: 'OS1', numero_os: 'OS-1', tipo: 'PREVENTIVA', prioridade: 'MEDIA', status: 'FINALIZADA', origem: 'MANUAL' };

// O exceljs carrega na exportação: com a suíte inteira em paralelo passava dos 5 s
describe('BotaoExportarOS', { timeout: 120_000 }, () => {
  beforeEach(() => vi.clearAllMocks());

  it('exporta todas as OS do filtro e baixa a planilha', async () => {
    api.findAll.mockResolvedValue({ data: [umaOS], pagination: { page: 1, limit: 100, total: 1, totalPages: 1 } });
    render(<BotaoExportarOS filtro={{ status: 'FINALIZADA', page: 3, limit: 10 }} valores={{}} filtros={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));

    await waitFor(() => expect(planilha.baixar).toHaveBeenCalled(), { timeout: 25_000 });
    expect(api.findAll).toHaveBeenCalledWith({ status: 'FINALIZADA', page: 1, limit: 100 });
    expect(planilha.baixar.mock.calls[0][1]).toMatch(/^ordens-de-servico-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('filtro acima do teto: pede para refinar e não baixa', async () => {
    api.findAll.mockResolvedValue({ data: [umaOS], pagination: { page: 1, limit: 100, total: 20_000, totalPages: 200 } });
    render(<BotaoExportarOS filtro={{}} valores={{}} filtros={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));

    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('O filtro tem 20000 OS; a exportação vai até 10000.', expect.anything()));
    expect(planilha.baixar).not.toHaveBeenCalled();
    expect(api.findAll).toHaveBeenCalledTimes(1);
  });

  it('filtro vazio avisa em vez de baixar uma planilha vazia', async () => {
    api.findAll.mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } });
    render(<BotaoExportarOS filtro={{}} valores={{}} filtros={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));

    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Nenhuma OS no filtro para exportar'));
    expect(planilha.baixar).not.toHaveBeenCalled();
  });

  it('erro da API fica com o interceptor; o da planilha avisa', async () => {
    api.findAll.mockRejectedValueOnce(Object.assign(new Error('500'), { isAxiosError: true }));
    render(<BotaoExportarOS filtro={{}} valores={{}} filtros={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Exportar' })).toBeEnabled());
    expect(toast.error).not.toHaveBeenCalled();

    api.findAll.mockResolvedValue({ data: [umaOS], pagination: { page: 1, limit: 100, total: 1, totalPages: 1 } });
    planilha.baixar.mockRejectedValueOnce(new Error('disco cheio'));
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível exportar', { description: 'disco cheio' }), { timeout: 25_000 });
  });
});
