import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BotaoPdfDaOS } from './BotaoPdfDaOS';

/** O botão do PDF da OS (SN-62). */
const api = vi.hoisted(() => ({ relatorio: vi.fn(), downloadAnexo: vi.fn() }));
const pdf = vi.hoisted(() => ({ gerarPdfDaOS: vi.fn() }));
const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('@/services/execucao-os.service', () => ({ execucaoOSApi: api }));
vi.mock('@/lib/pdf/ordem-de-servico', () => pdf);
vi.mock('sonner', () => ({ toast }));

const CODIGO = 'ab12cd34'.repeat(8);
const conteudoVazio = {
  versao: 1,
  os: { numero_os: 'OS-1', tipo: 'PREVENTIVA', prioridade: 'MEDIA', descricao: 'Limpeza', finalizada_em: '2026-10-17T12:00:00.000Z' },
  tarefas: [],
  checklist: [],
  anexos: [],
  equipe: [],
  materiais: [],
  ferramentas: [],
};

describe('BotaoPdfDaOS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('só a partir de executada; prévia antes de finalizar', () => {
    const { rerender } = render(<BotaoPdfDaOS os={{ id: 'OS1', statusExecucao: 'EM_EXECUCAO' }} />);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<BotaoPdfDaOS os={{ id: 'OS1', statusExecucao: 'AUDITADA' }} />);
    expect(screen.getByRole('button', { name: 'PDF (prévia)' })).toBeInTheDocument();

    rerender(<BotaoPdfDaOS os={{ id: 'OS1', statusExecucao: 'FINALIZADA' }} />);
    expect(screen.getByRole('button', { name: 'Baixar PDF' })).toBeInTheDocument();
  });

  it('finalizada: monta o PDF do conteúdo gravado, com o código e onde conferir', async () => {
    api.relatorio.mockResolvedValue({ os_id: 'OS1', numero_os: 'OS-1', status: 'FINALIZADA', codigo: CODIGO, finalizada_em: null, previa: false, conteudo: conteudoVazio });
    render(<BotaoPdfDaOS os={{ id: 'OS1', statusExecucao: 'FINALIZADA', planta: { nome: 'Planta Norte' } }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF' }));

    await waitFor(() => expect(pdf.gerarPdfDaOS).toHaveBeenCalled());
    const documento = pdf.gerarPdfDaOS.mock.calls[0][0];
    expect(documento.verificacao).toMatchObject({ codigo: CODIGO, url: `${window.location.origin}/execucao-os?conferir=${CODIGO}` });
    expect(documento.cadastro).toContainEqual(['Planta', 'Planta Norte']);
  });

  it('erro ao desenhar o PDF avisa; erro da API fica com o interceptor', async () => {
    api.relatorio.mockResolvedValue({ os_id: 'OS1', numero_os: 'OS-1', status: 'FINALIZADA', codigo: CODIGO, finalizada_em: null, previa: false, conteudo: conteudoVazio });
    pdf.gerarPdfDaOS.mockRejectedValueOnce(new Error('fonte'));
    const { rerender } = render(<BotaoPdfDaOS os={{ id: 'OS1', statusExecucao: 'FINALIZADA' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível gerar o PDF', { description: 'fonte' }));

    toast.error.mockClear();
    api.relatorio.mockRejectedValueOnce(Object.assign(new Error('500'), { isAxiosError: true }));
    rerender(<BotaoPdfDaOS os={{ id: 'OS2', statusExecucao: 'FINALIZADA' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Baixar PDF' })).toBeEnabled());
    expect(toast.error).not.toHaveBeenCalled();
  });
});
