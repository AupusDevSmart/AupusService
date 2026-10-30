import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LinhaDeLogistica } from '@/services/proposta.services';
import { TabelaDaLogistica } from './TabelaDaLogistica';

/**
 * As linhas automáticas na tabela (30/out/2026): mexer na quantidade as deixa
 * ajustadas (param de acompanhar o planejamento), mexer no preço não; elas não
 * se removem (voltariam no próximo cálculo), só se desmarcam; "ajustada" volta
 * ao automático.
 */
const almoco: LinhaDeLogistica = { tabela: 'DIARIA', ativo: true, descricao: 'Almoço', quantidade: 6, valor_unitario: 20, total: 120, automatica: 'ALMOCO', ajustada: false };
const lanche: LinhaDeLogistica = { tabela: 'DIARIA', ativo: true, descricao: 'Lanche', quantidade: 2, valor_unitario: 8, total: 16 };
const planejamento = { distancia_km: null, dias_previstos: null, pessoas_previstas: null, noites_fora: null, planejamento_calculado: null };

const tabela = (linhas: LinhaDeLogistica[], onChange = vi.fn()) => {
  render(<TabelaDaLogistica tabela="DIARIA" linhas={linhas} editavel planejamento={planejamento} onChange={onChange} />);
  return onChange;
};
const digitar = (rotulo: string, indice: number, valor: string) => {
  const campo = screen.getAllByRole('textbox', { name: rotulo })[indice];
  fireEvent.change(campo, { target: { value: valor } });
  fireEvent.blur(campo);
};

describe('TabelaDaLogistica: linhas automáticas', () => {
  it('a automática não tem o botão de remover; a digitada tem', () => {
    tabela([almoco, lanche]);
    expect(screen.getAllByRole('button', { name: 'Remover linha' })).toHaveLength(1);
    expect(screen.getByLabelText('Linha automática')).toBeInTheDocument();
  });

  it('mexer na quantidade deixa a automática ajustada; no preço, não', () => {
    const onChange = tabela([almoco, lanche]);
    digitar('Quantidade (diárias)', 0, '9');
    expect(onChange).toHaveBeenLastCalledWith([{ ...almoco, quantidade: 9, ajustada: true }, lanche]);
    digitar('Valor (diárias)', 0, '25');
    expect(onChange).toHaveBeenLastCalledWith([{ ...almoco, valor_unitario: 25 }, lanche]);
  });

  it('"ajustada" volta ao cálculo automático', () => {
    const onChange = tabela([{ ...almoco, ajustada: true }]);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao cálculo automático' }));
    expect(onChange).toHaveBeenLastCalledWith([{ ...almoco, ajustada: false }]);
  });
});
