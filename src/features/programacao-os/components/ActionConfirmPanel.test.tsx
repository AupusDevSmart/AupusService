import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionConfirmPanel } from './ActionConfirmPanel';

/**
 * O painel de aprovar e cancelar a programação. Os textos estavam sem acento ("Confirmar acao",
 * "Observacoes da aprovacao"), e é o painel que aparece no meio da aprovação.
 */
describe('ActionConfirmPanel da programação', () => {
  it('aprovar: observação opcional, com os textos acentuados', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="aprovar" onConfirm={onConfirm} />);

    expect(screen.getByText('Confirmar ação')).toBeInTheDocument();
    expect(screen.getByText('Observações da aprovação')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aprovação' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(undefined));
  });

  it('cancelar: só confirma com o motivo escrito', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="cancelar" onConfirm={onConfirm} />);

    const confirmar = screen.getByRole('button', { name: 'Confirmar cancelamento' });
    expect(confirmar).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Descreva o motivo do cancelamento'), { target: { value: '  Equipamento trocado  ' } });
    fireEvent.click(confirmar);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Equipamento trocado'));
  });
});
