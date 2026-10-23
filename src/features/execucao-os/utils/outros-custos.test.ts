import { describe, expect, it } from 'vitest';
import { linhaNaoPrevista, linhasDosOutrosCustos, outrosCustosDoPedido, pendenciaDosOutrosCustos } from './outros-custos';

/** Os outros custos no Executar e na correção (SN-93, D2) */
describe('outros custos da OS', () => {
  const itens = [
    { id: 'I1 ', descricao: 'Veículo: Picape', valor: 1316, natureza: 'VEICULO' as const },
    { id: 'I2', descricao: 'Hospedagem', valor: 1380, natureza: 'DESPESA_CAMPO' as const, valor_real: 1200 },
    { id: 'I3', descricao: 'Pedágio', valor: 0, natureza: 'VEICULO' as const, valor_real: 85, nao_previsto: true },
  ];

  it('o previsto vem preenchido com o conferido, ou com o previsto; o não previsto, com o que foi lançado', () => {
    expect(linhasDosOutrosCustos(itens).map((l) => [l.id, l.previsto, l.valor, l.naoPrevisto])).toEqual([
      ['I1', 1316, 1316, false],
      ['I2', 1380, 1200, false],
      ['I3', null, 85, true],
    ]);
  });

  // Revisão de falha silenciosa: em R$ 0, confirmar gravava "conferido R$ 0" e a picape usada saía do custo
  it('o previsto zero ("sem preço no cadastro") começa vazio, e a pendência pede o valor', () => {
    const [semPreco] = linhasDosOutrosCustos([{ id: 'I9', descricao: 'Veículo: Picape (sem preço no cadastro)', valor: 0, natureza: 'VEICULO' }]);
    expect([semPreco.previsto, semPreco.valor]).toEqual([0, null]);
    expect(pendenciaDosOutrosCustos([semPreco])).toBe('Informe quanto custou Veículo: Picape (sem preço no cadastro) (0 se não houve).');
    // Já conferido em zero, fica zero
    expect(linhasDosOutrosCustos([{ id: 'I9', descricao: 'x', valor: 0, natureza: 'VEICULO', valor_real: 0 }])[0].valor).toBe(0);
  });

  it('o pedido: o previsto só com o valor; o não previsto com descrição e natureza; em centavos', () => {
    const linhas = [...linhasDosOutrosCustos(itens), { ...linhaNaoPrevista(), descricao: ' Estacionamento ', valor: 12.3456 }];
    expect(outrosCustosDoPedido(linhas)).toEqual([
      { id: 'I1', valor_real: 1316 },
      { id: 'I2', valor_real: 1200 },
      { id: 'I3', descricao: 'Pedágio', natureza: 'VEICULO', valor_real: 85 },
      { descricao: 'Estacionamento', natureza: 'OUTRO', valor_real: 12.35 },
    ]);
  });

  it('a pendência: texto ilegível, não previsto sem descrição, custo sem valor', () => {
    const [i1] = linhasDosOutrosCustos(itens);
    expect(pendenciaDosOutrosCustos([{ ...i1, ilegivel: true }])).toMatch(/^Corrija o valor de Veículo: Picape/);
    expect(pendenciaDosOutrosCustos([linhaNaoPrevista()])).toBe('Diga o que é cada custo não previsto.');
    expect(pendenciaDosOutrosCustos([{ ...i1, valor: null }])).toBe('Informe quanto custou Veículo: Picape (0 se não houve).');
    expect(pendenciaDosOutrosCustos(linhasDosOutrosCustos(itens))).toBeNull();
  });
});
