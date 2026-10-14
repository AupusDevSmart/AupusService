import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '@/test-utils';
import type { AnexoOS } from '@/features/execucao-os/types';

const api = {
  getAnexos: vi.fn(),
  uploadAnexo: vi.fn().mockResolvedValue({}),
  deleteAnexo: vi.fn().mockResolvedValue(undefined),
  downloadAnexo: vi.fn().mockResolvedValue(new Blob(['x'], { type: 'image/jpeg' })),
};
vi.mock('@/services/execucao-os.service', () => ({ execucaoOSApi: api }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

const { AnexosDaOS } = await import('./AnexosDaOS');

const anexo = (dados: Partial<AnexoOS>): AnexoOS => ({
  id: 'A1',
  os_id: 'OS1',
  nome: 'f.pdf',
  nome_original: 'laudo-termografia.pdf',
  tipo: 'LAUDO',
  mime_type: 'application/pdf',
  tamanho: 10,
  caminho_s3: '',
  uploaded_at: '2026-10-14T13:05:00.000Z',
  uploaded_by: 'Técnico Fulano',
  ...dados,
});

const montar = (status: string, podeEditar = true) =>
  renderWithProviders(
    <TooltipProvider>
      <AnexosDaOS osId="OS1" status={status} podeEditar={podeEditar} />
    </TooltipProvider>,
    { withRouter: false },
  );

/**
 * Os anexos são a prova do que foi feito. Antes a tela nem tinha onde anexar:
 * o serviço postava numa rota que não existe e nenhum componente o chamava.
 */
describe('AnexosDaOS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAnexos.mockResolvedValue([
      anexo({}),
      anexo({ id: 'A2', tipo: 'FOTO_ANTES', mime_type: 'image/heic', nome_original: 'IMG_0001.HEIC', descricao: 'Mancal antes' }),
    ]);
  });

  it('mostra cada anexo no grupo dele, com quem enviou', async () => {
    montar('EM_EXECUCAO');

    expect(await screen.findByText('laudo-termografia.pdf')).toBeInTheDocument();
    expect(screen.getByText('Antes')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Mancal antes')).toBeInTheDocument();
    expect(screen.getAllByText(/Técnico Fulano/)).toHaveLength(2);
  });

  it('anexa com o tipo que acompanha o momento da OS (em execução: foto de durante)', async () => {
    montar('EM_EXECUCAO');
    await screen.findByText('laudo-termografia.pdf');

    const arquivo = new File(['x'], 'mancal.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByTestId('entrada-arquivo'), { target: { files: [arquivo] } });

    await waitFor(() => expect(api.uploadAnexo).toHaveBeenCalledWith('OS1', arquivo, 'FOTO_DURANTE'));
  });

  it('a câmera do celular é a traseira', () => {
    montar('PENDENTE');
    expect(screen.getByTestId('entrada-camera')).toHaveAttribute('capture', 'environment');
  });

  it('excluir pede confirmação antes', async () => {
    montar('EM_EXECUCAO');
    await screen.findByText('laudo-termografia.pdf');

    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir anexo' })[0]);
    expect(api.deleteAnexo).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(api.deleteAnexo).toHaveBeenCalled());
  });

  it('OS finalizada é só leitura: sem anexar e sem excluir, mas dá para baixar', async () => {
    montar('FINALIZADA');
    await screen.findByText('laudo-termografia.pdf');

    expect(screen.queryByRole('button', { name: /Anexar arquivo/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir anexo' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Baixar' })).toHaveLength(2);
  });

  it('quem só vê a OS não anexa', async () => {
    montar('EM_EXECUCAO', false);
    await screen.findByText('laudo-termografia.pdf');

    expect(screen.queryByRole('button', { name: /Tirar foto/ })).not.toBeInTheDocument();
  });
});
