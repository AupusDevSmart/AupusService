import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LinhaDeLogistica } from '@/services/proposta.services';
import { ListaDaLogistica } from './TabelaDaLogistica';

/**
 * A logística numa lista só (30/out/2026): as linhas automáticas não se removem
 * (voltariam no próximo cálculo), só se desmarcam; mexer na quantidade as deixa
 * ajustadas, no preço não; "ajustada" volta ao automático; a automática zerada
 * não aparece. A mudança sobe por tabela (a API grava por tabela).
 */
const almoco: LinhaDeLogistica = { tabela: 'DIARIA', ativo: true, descricao: 'Almoço', quantidade: 6, valor_unitario: 20, total: 120, automatica: 'ALMOCO', ajustada: false };
const lanche: LinhaDeLogistica = { tabela: 'DIARIA', ativo: true, descricao: 'Lanche', quantidade: 2, valor_unitario: 8, total: 16 };
const veiculo: LinhaDeLogistica = { tabela: 'DESLOCAMENTO', ativo: true, descricao: 'Veículo da equipe', quantidade: 1, km: 200, valor_km: 2.5, total: 500, automatica: 'KM', ajustada: false };
const pernoiteZerado: LinhaDeLogistica = { tabela: 'DIARIA', ativo: true, descricao: 'Pernoite', quantidade: 0, valor_unitario: 100, total: 0, automatica: 'PERNOITE', ajustada: false };
const planejamento = { distancia_km: null, dias_previstos: null, pessoas_previstas: null, noites_fora: null, planejamento_calculado: null };

const lista = (linhas: LinhaDeLogistica[], onChange = vi.fn()) => {
  render(<ListaDaLogistica linhas={linhas} editavel planejamento={planejamento} onChange={onChange} />);
  return onChange;
};
const digitar = (rotulo: string, indice: number, valor: string) => {
  const campo = screen.getAllByRole('textbox', { name: rotulo })[indice];
  fireEvent.change(campo, { target: { value: valor } });
  fireEvent.blur(campo);
};

describe('ListaDaLogistica', () => {
  it('uma lista com o tipo em cada linha; a automática não tem o botão de remover; a zerada não aparece', () => {
    lista([veiculo, almoco, lanche, pernoiteZerado]);
    expect(screen.getAllByRole('button', { name: 'Remover linha' })).toHaveLength(1);
    expect(screen.getAllByLabelText('Linha automática')).toHaveLength(2);
    expect(screen.queryByDisplayValue('Pernoite')).toBeNull();
    expect(screen.getByText('Deslocamento')).toBeInTheDocument();
    expect(screen.getAllByText('Diária')).toHaveLength(2);
  });

  it('mexer na quantidade deixa a automática ajustada; no preço, não; a mudança sobe com a tabela inteira', () => {
    const onChange = lista([veiculo, almoco, lanche]);
    digitar('Quantidade (diária)', 0, '9');
    expect(onChange).toHaveBeenLastCalledWith('DIARIA', [{ ...almoco, quantidade: 9, ajustada: true }, lanche]);
    digitar('Valor (diária)', 0, '25');
    expect(onChange).toHaveBeenLastCalledWith('DIARIA', [{ ...almoco, valor_unitario: 25 }, lanche]);
  });

  it('"ajustada" volta ao cálculo automático', () => {
    const onChange = lista([{ ...almoco, ajustada: true }]);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao cálculo automático' }));
    expect(onChange).toHaveBeenLastCalledWith('DIARIA', [{ ...almoco, ajustada: false }]);
  });

  it('sem linha, diz de onde elas vêm', () => {
    lista([]);
    expect(screen.getByText(/entram sozinhos pelo planejamento/)).toBeInTheDocument();
  });
});
