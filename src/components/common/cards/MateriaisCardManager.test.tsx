import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MateriaisCardManager } from './MateriaisCardManager';

/**
 * O cartão de materiais (SN-93): na execução ("Materiais Consumidos") o custo é
 * o do consumido. Antes ele mostrava o `custo_total` da linha, que é o planejado:
 * 10 m planejados e 4 consumidos apareciam custando os 10.
 */
const cabo = { id: 'M1', descricao: 'Cabo 6 mm²', quantidade_planejada: 10, quantidade_consumida: 4, unidade: 'm', custo_unitario: 5, custo_total: 50 };

describe('MateriaisCardManager', () => {
  it('na execução, o custo é o do consumido', () => {
    render(<MateriaisCardManager value={[cabo]} onChange={vi.fn()} mode="execucao" showCustos />);
    expect(screen.getByText('R$ 20,00')).toBeInTheDocument();
    expect(screen.getByText('Custo do consumido: R$ 20,00')).toBeInTheDocument();
  });

  it('no planejamento, o planejado', () => {
    render(<MateriaisCardManager value={[cabo]} onChange={vi.fn()} mode="planejamento" showCustos />);
    expect(screen.getByText('R$ 50,00')).toBeInTheDocument();
    expect(screen.getByText('Custo total: R$ 50,00')).toBeInTheDocument();
  });

  // SN-58: era type="number", que perdia a vírgula num navegador em inglês e mostrava "5" no lugar de "5,00"
  it('quantidade e custo com vírgula: lê e mostra no formato da casa', () => {
    const onChange = vi.fn();
    render(<MateriaisCardManager value={[cabo]} onChange={onChange} mode="planejamento" showCustos />);
    expect(screen.getByLabelText('Custo unitário de Cabo 6 mm²')).toHaveValue('5,00');
    const quantidade = screen.getByLabelText('Quantidade planejada de Cabo 6 mm²');
    fireEvent.change(quantidade, { target: { value: '12,375' } });
    fireEvent.blur(quantidade);
    expect(onChange.mock.lastCall?.[0][0]).toMatchObject({ quantidade_planejada: 12.375 });
    // Mais de 3 casas fica marcado: o formulário não salva com ele
    fireEvent.change(quantidade, { target: { value: '1,0005' } });
    fireEvent.blur(quantidade);
    expect(quantidade).toHaveAttribute('data-ilegivel', 'true');
  });

  it('na execução, o consumido com vírgula', () => {
    const onChange = vi.fn();
    render(<MateriaisCardManager value={[cabo]} onChange={onChange} mode="execucao" showCustos />);
    const consumido = screen.getByLabelText('Quantidade consumida de Cabo 6 mm²');
    expect(consumido).toHaveValue('4');
    fireEvent.change(consumido, { target: { value: '0,3' } });
    fireEvent.blur(consumido);
    expect(onChange.mock.lastCall?.[0][0]).toMatchObject({ quantidade_consumida: 0.3 });
  });
});
