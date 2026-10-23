import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const baixarEtiquetas = vi.fn();
vi.mock('@/lib/pdf/etiqueta-de-equipamento', () => ({ baixarEtiquetas: (...args: unknown[]) => baixarEtiquetas(...args) }));
const toastInfo = vi.fn();
const toastErro = vi.fn();
vi.mock('sonner', () => ({ toast: { info: (...a: unknown[]) => toastInfo(...a), error: (...a: unknown[]) => toastErro(...a) } }));

import { EtiquetasDosEquipamentos } from './EtiquetasDosEquipamentos';

/** O botão da etiqueta com QR (SN-67): os dois formatos, a lista vazia e a falha. */
describe('EtiquetasDosEquipamentos', () => {
  beforeEach(() => {
    baixarEtiquetas.mockReset().mockResolvedValue(undefined);
    toastInfo.mockReset();
    toastErro.mockReset();
  });

  const abrirMenu = () => {
    // O Radix abre o menu no pointerdown
    fireEvent.pointerDown(screen.getByRole('button', { name: /Etiqueta/ }), { button: 0, ctrlKey: false });
  };

  it('gera no formato escolhido, com o endereço que abre o cadastro', async () => {
    const carregar = vi.fn().mockResolvedValue([{ id: 'e1  ', nome: 'Inversor 1', tag: 'INV-01', criticidade: '4', planta: 'UFV', unidade: 'U1' }]);
    render(<EtiquetasDosEquipamentos carregar={carregar} nomeDoArquivo="etiqueta-INV-01" />);

    abrirMenu();
    fireEvent.click(await screen.findByText('Folha A4'));

    await waitFor(() => expect(baixarEtiquetas).toHaveBeenCalled());
    const [etiquetas, formato, nome] = baixarEtiquetas.mock.calls[0];
    expect(formato).toBe('a4');
    expect(nome).toBe('etiqueta-INV-01');
    expect(etiquetas).toEqual([
      { url: `${window.location.origin}/cadastros/equipamentos?equipamento=e1`, nome: 'Inversor 1', tag: 'INV-01', lugar: 'UFV · U1', criticidade: '4 · Alta' },
    ]);
  });

  it('lista vazia: avisa e não gera', async () => {
    render(<EtiquetasDosEquipamentos carregar={vi.fn().mockResolvedValue([])} nomeDoArquivo="x" />);
    abrirMenu();
    fireEvent.click(await screen.findByText('Etiqueta 100 × 65 mm'));

    await waitFor(() => expect(toastInfo).toHaveBeenCalledWith('Nenhum equipamento para etiquetar com estes filtros.'));
    expect(baixarEtiquetas).not.toHaveBeenCalled();
  });

  it('falha do PDF aparece; a da API o interceptor já mostrou', async () => {
    baixarEtiquetas.mockRejectedValueOnce(new Error('fonte'));
    const { unmount } = render(<EtiquetasDosEquipamentos carregar={vi.fn().mockResolvedValue([{ id: 'e1', nome: 'X' }])} nomeDoArquivo="x" />);
    abrirMenu();
    fireEvent.click(await screen.findByText('Folha A4'));
    await waitFor(() => expect(toastErro).toHaveBeenCalledWith('Não foi possível gerar a etiqueta', { description: 'fonte' }));
    unmount();

    render(<EtiquetasDosEquipamentos carregar={vi.fn().mockRejectedValue({ isAxiosError: true })} nomeDoArquivo="x" />);
    abrirMenu();
    fireEvent.click(await screen.findByText('Folha A4'));
    await waitFor(() => expect(screen.getByRole('button', { name: /Etiqueta/ })).not.toBeDisabled());
    expect(toastErro).toHaveBeenCalledTimes(1);
  });
});
