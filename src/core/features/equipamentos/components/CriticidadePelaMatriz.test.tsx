import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CriticidadePelaMatriz } from './CriticidadePelaMatriz';
import type { AvaliacaoDaCriticidade } from '@/core/features/equipamentos/utils/criticidade-pela-matriz';

/** A criticidade pela matriz no sheet da UC e do componente (SN-64). */
describe('CriticidadePelaMatriz', () => {
  function Formulario({ inicial, aoMudar }: { inicial: AvaliacaoDaCriticidade; aoMudar?: (v: AvaliacaoDaCriticidade) => void }) {
    const [valores, setValores] = useState(inicial);
    return (
      <CriticidadePelaMatriz
        valores={valores}
        onChange={(v) => {
          setValores(v);
          aoMudar?.(v);
        }}
      />
    );
  }
  const grupo = (nome: string) => screen.getByRole('radiogroup', { name: new RegExp(`^${nome}`) });
  const marcado = (nome: string) => within(grupo(nome)).getByRole('radio', { checked: true });

  it('as duas notas sugerem o nível e já o escolhem', () => {
    render(<Formulario inicial={{ criticidade: '3' }} />);
    expect(screen.getByText('Sem avaliação pela matriz: o nível vale como está.')).toBeInTheDocument();

    fireEvent.click(within(grupo('Impacto da falha')).getByRole('radio', { name: /^5 · Crítico/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Dê as duas notas');
    fireEvent.click(within(grupo('Probabilidade de falha')).getByRole('radio', { name: /^1 · Rara/ }));

    expect(marcado('Criticidade')).toHaveAccessibleName('4 · Alta (sugerida pela matriz)');
    expect(screen.getByText('Sugerida pela matriz: 4 · Alta')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Motivo da diferença/)).not.toBeInTheDocument();
  });

  it('outro nível pede o motivo, e a sugestão fica marcada', () => {
    const aoMudar = vi.fn();
    render(<Formulario inicial={{ criticidade: '4', criticidadeImpacto: 5, criticidadeProbabilidade: 1 }} aoMudar={aoMudar} />);

    fireEvent.click(within(grupo('Criticidade')).getByRole('radio', { name: /^5 · Muito alta/ }));
    expect(screen.getByText('Sugerida pela matriz: 4 · Alta. O nível escolhido é outro.')).toBeInTheDocument();
    expect(within(grupo('Criticidade')).getByRole('radio', { name: '4 · Alta (sugerida pela matriz)' })).not.toBeChecked();

    fireEvent.change(screen.getByLabelText(/Motivo da diferença/), { target: { value: 'Único da usina' } });
    expect(aoMudar).toHaveBeenLastCalledWith({ criticidade: '5', criticidadeImpacto: 5, criticidadeProbabilidade: 1, criticidadeMotivo: 'Único da usina' });
  });

  it('setas do teclado andam na escala', () => {
    render(<Formulario inicial={{ criticidade: '3' }} />);
    fireEvent.keyDown(grupo('Criticidade'), { key: 'ArrowRight' });
    expect(marcado('Criticidade')).toHaveAccessibleName('4 · Alta');
  });

  it('na leitura: as notas, o nível e o motivo; sem botões que mudem nada', () => {
    const onChange = vi.fn();
    render(
      <CriticidadePelaMatriz
        valores={{ criticidade: '5', criticidadeImpacto: 5, criticidadeProbabilidade: 1, criticidadeMotivo: 'Único da usina' }}
        onChange={onChange}
        somenteLeitura
      />,
    );

    expect(screen.getByText('Crítico: para a instalação, ou põe pessoas ou o ambiente em risco')).toBeInTheDocument();
    expect(screen.getByText('Único da usina')).toBeInTheDocument();
    fireEvent.click(within(grupo('Criticidade')).getByRole('radio', { name: /^3 · Média/ }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('a matriz aberta marca a célula da avaliação', () => {
    render(<CriticidadePelaMatriz valores={{ criticidade: '4', criticidadeImpacto: 4, criticidadeProbabilidade: 3 }} onChange={vi.fn()} />);
    const celula = screen.getByRole('table').querySelector('[aria-current="true"]');
    expect(celula).toHaveTextContent('4');
    expect(celula?.closest('tr')).toHaveTextContent('4 · Grave');
  });
});
