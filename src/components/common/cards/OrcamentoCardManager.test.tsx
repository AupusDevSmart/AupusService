import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrcamentoCardManager, type ItemOrcamento } from './OrcamentoCardManager';

/**
 * Os outros custos da programação. O valor era `type="number"` (fora da regra do
 * SN-58): mostrava "1081" em vez de "1.081,00", e o campo do navegador perdia
 * o "1.402,50" escrito com vírgula.
 */
const itens: ItemOrcamento[] = [
  { id: 'I1', descricao: 'Veículo: Picape 4x4', valor: 1081, natureza: 'VEICULO' },
  { id: 'I2', descricao: 'Despesa de campo: Diária de alimentação', valor: 78, natureza: 'DESPESA_CAMPO' },
];

describe('OrcamentoCardManager', () => {
  it('o valor com as 2 casas, também na leitura', () => {
    render(<OrcamentoCardManager value={itens} onChange={vi.fn()} disabled />);
    expect(screen.getByLabelText('Valor de Veículo: Picape 4x4')).toHaveValue('1.081,00');
    expect(screen.getByLabelText('Valor de Despesa de campo: Diária de alimentação')).toHaveValue('78,00');
  });

  it('escrito com vírgula, grava o número', () => {
    const onChange = vi.fn();
    render(<OrcamentoCardManager value={itens} onChange={onChange} />);
    const campo = screen.getByLabelText('Valor de Veículo: Picape 4x4');
    fireEvent.change(campo, { target: { value: '1.402,50' } });
    fireEvent.blur(campo);
    expect(onChange).toHaveBeenLastCalledWith([{ ...itens[0], valor: 1402.5 }, itens[1]]);
  });

  it('o valor ilegível trava o Salvar; corrigido ou tirada a linha, libera', () => {
    const onIlegivel = vi.fn();
    const onChange = vi.fn();
    render(<OrcamentoCardManager value={itens} onChange={onChange} onIlegivel={onIlegivel} />);
    const campo = screen.getByLabelText('Valor de Veículo: Picape 4x4');
    fireEvent.change(campo, { target: { value: '1,005' } });
    fireEvent.blur(campo);
    expect(onIlegivel).toHaveBeenLastCalledWith(true);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(campo, { target: { value: '1,05' } });
    fireEvent.blur(campo);
    expect(onIlegivel).toHaveBeenLastCalledWith(false);

    fireEvent.change(campo, { target: { value: 'mil' } });
    fireEvent.blur(campo);
    expect(onIlegivel).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getAllByTitle('Remover')[0]);
    expect(onIlegivel).toHaveBeenLastCalledWith(false);
  });
});
