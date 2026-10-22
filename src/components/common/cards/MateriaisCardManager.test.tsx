import { render, screen } from '@testing-library/react';
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
});
