import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExcluirEmLoteDialog } from './ExcluirEmLoteDialog';

const { excluirEmLote } = vi.hoisted(() => ({ excluirEmLote: vi.fn() }));
vi.mock('@/services/recursos.services', () => ({ recursosApi: { excluirEmLote } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/**
 * A janela de excluir vários (30/out/2026): primeiro a prévia do servidor (o que
 * sai e o que fica em uso); só depois o excluir, com o mesmo pedido.
 */
describe('ExcluirEmLoteDialog', () => {
  beforeEach(() => excluirEmLote.mockReset());

  it('mostra o que sai e o que fica, e exclui com o mesmo pedido', async () => {
    excluirEmLote
      .mockResolvedValueOnce({ previa: true, excluidos: 2, nomes: ['Cabo velho', 'Fita velha'], em_uso: [{ id: 'z', nome: 'Alicate', instrucoes: 3 }] })
      .mockResolvedValueOnce({ previa: false, excluidos: 2, nomes: [], em_uso: [{ id: 'z', nome: 'Alicate', instrucoes: 3 }] });
    const onExcluidos = vi.fn();
    const onClose = vi.fn();
    render(<ExcluirEmLoteDialog pedido={{ inativos: true }} descricao="todos os recursos inativos" onClose={onClose} onExcluidos={onExcluidos} />);

    expect(await screen.findByText(/Cabo velho, Fita velha/)).toBeInTheDocument();
    expect(screen.getByText('Alicate (3 instruções)')).toBeInTheDocument();
    expect(excluirEmLote).toHaveBeenLastCalledWith({ inativos: true, previa: true });

    fireEvent.click(screen.getByRole('button', { name: 'Excluir 2 recursos' }));
    await waitFor(() => expect(onExcluidos).toHaveBeenCalled());
    // Com o número que a prévia mostrou: se a lista mudou no meio, a API recusa
    expect(excluirEmLote).toHaveBeenLastCalledWith({ inativos: true, previa: false, esperados: 2 });
    expect(onClose).toHaveBeenCalled();
  });

  it('sem nada a excluir, o botão fica desligado', async () => {
    excluirEmLote.mockResolvedValueOnce({ previa: true, excluidos: 0, nomes: [], em_uso: [] });
    render(<ExcluirEmLoteDialog pedido={{ ids: ['a'] }} descricao="o recurso marcado" onClose={vi.fn()} onExcluidos={vi.fn()} />);
    expect(await screen.findByText('Nenhum recurso a excluir.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeDisabled();
  });
});
