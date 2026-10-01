import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionConfirmPanel } from './ActionConfirmPanel';

/**
 * Painéis de Executar e Auditar (docs/SPEC-EXECUCAO-DA-OS.md).
 * Executar tinha 11 campos; agora resultado e problemas, o motivo de cada
 * tarefa não feita e o resto recolhido. Auditar deixa o select por estrelas.
 */
describe('ActionConfirmPanel — executar', () => {
  it('pede só resultado e problemas; recomendações e incidente ficam em "Mais detalhes"', () => {
    render(<ActionConfirmPanel action="executar" entity={{}} onConfirm={vi.fn()} />);

    expect(screen.getByText('Resultado do serviço')).toBeInTheDocument();
    expect(screen.getByText('Problemas encontrados')).toBeInTheDocument();
    for (const saiu of ['Atividades realizadas', 'Procedimentos seguidos', 'EPIs utilizados', 'Custos adicionais (R$)', 'Próxima manutenção']) {
      expect(screen.queryByText(saiu)).toBeNull();
    }
    const detalhes = screen.getByText('Mais detalhes').closest('details')!;
    expect(detalhes).not.toHaveAttribute('open');
    expect(detalhes).toHaveTextContent('Recomendações');
    expect(detalhes).toHaveTextContent('Incidente de segurança');
  });

  it('com tarefa pendente, exige o motivo de cada uma e manda no payload', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ActionConfirmPanel
        action="executar"
        entity={{}}
        tarefasPendentes={[{ id: 'V1', nome: 'Lubrificar mancal' }]}
        onConfirm={onConfirm}
      />,
    );
    const confirmar = screen.getByRole('button', { name: /Confirmar Execu/i });

    fireEvent.change(screen.getByLabelText(/Resultado do serviço/), { target: { value: 'Feito em parte' } });
    expect(confirmar).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Por que "Lubrificar mancal" não foi feita/), {
      target: { value: 'Faltou graxa' },
    });
    expect(confirmar).toBeEnabled();
    fireEvent.click(confirmar);

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({
      resultado_servico: 'Feito em parte',
      tarefas_nao_feitas: [{ id: 'V1', motivo: 'Faltou graxa' }],
    });
  });
});

describe('ActionConfirmPanel — auditar', () => {
  it('avalia em estrelas e só confirma com nota', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<ActionConfirmPanel action="auditar" entity={{}} onConfirm={onConfirm} />);
    const confirmar = screen.getByRole('button', { name: /Confirmar Auditoria/i });

    expect(confirmar).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: /4 estrelas/i }));
    fireEvent.click(confirmar);

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0]).toMatchObject({ avaliacao_qualidade: 4 });
  });
});
