import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExcluirEquipamentoDialog } from '@/core/features/equipamentos/components/ExcluirEquipamentoDialog';

/**
 * Excluir UC com componentes (SN-12). O diálogo dizia que os componentes
 * "também serão removidos", mas a API recusa (400) excluir UC com filhos: a
 * pessoa confirmava e via um erro. Agora ele explica o que fazer antes.
 */
describe('ExcluirEquipamentoDialog', () => {
  const uc = (totalComponentes: number) => ({ id: 'uc1', nome: 'Inversor 1', classificacao: 'UC' as const, totalComponentes });

  it('UC com componentes explica e não deixa remover', () => {
    render(<ExcluirEquipamentoDialog equipamento={uc(2)} onCancelar={vi.fn()} onConfirmar={vi.fn()} />);

    expect(screen.getByText(/exclua ou transfira os 2 componentes/i)).toBeInTheDocument();
    expect(screen.queryByText(/também serão removidos/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument();
  });

  it('UC sem componentes remove', async () => {
    const onConfirmar = vi.fn();
    render(<ExcluirEquipamentoDialog equipamento={uc(0)} onCancelar={vi.fn()} onConfirmar={onConfirmar} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remover' }));

    expect(onConfirmar).toHaveBeenCalled();
  });

  it('fechado quando não há equipamento', () => {
    render(<ExcluirEquipamentoDialog equipamento={null} onCancelar={vi.fn()} onConfirmar={vi.fn()} />);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
