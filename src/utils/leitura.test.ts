import { describe, expect, it } from 'vitest';
import { descreverFaixa, foraDaFaixa, formatarLeitura, lerDinheiroDigitado, lerNumeroDigitado, numeroNoCampo, numeroOuNulo } from './leitura';

describe('leitura (SN-58)', () => {
  it.each([
    [600, 580, 620, false],
    [580, 580, 620, false],
    [620, 580, 620, false],
    [579.9, 580, 620, true],
    [620.1, 580, 620, true],
    [-5, null, 0, false],
    [5, null, 0, true],
    [0.5, 1, null, true],
    [null, 580, 620, false],
  ])('%s na faixa [%s, %s] -> fora: %s', (valor, minimo, maximo, fora) => {
    expect(foraDaFaixa(valor, { minimo, maximo })).toBe(fora);
  });

  it.each([
    [{ minimo: 580, maximo: 620, unidade: 'V' }, '580 a 620 V'],
    [{ minimo: 1.5, maximo: null, unidade: 'MΩ' }, 'no mínimo 1,5 MΩ'],
    [{ minimo: null, maximo: 70.5, unidade: ' °C ' }, 'no máximo 70,5 °C'],
    [{ minimo: 1000, maximo: 2500.25, unidade: null }, '1.000 a 2.500,25'],
    [{ minimo: null, maximo: null, unidade: 'h' }, ''],
  ])('descreve %j como "%s"', (faixa, texto) => {
    expect(descreverFaixa(faixa)).toBe(texto);
  });

  it('formata o valor com a unidade', () => {
    expect(formatarLeitura(601.25, 'V')).toBe('601,25 V');
    expect(formatarLeitura(12, null)).toBe('12');
  });

  it.each([
    ['601,25', 601.25],
    ['601.25', 601.25],
    ['1.234,5', 1234.5],
    ['1234,5', 1234.5],
    ['13.800,0001', 13800.0001],
    ['1.5', 1.5],
    ['1.2345', 1.2345],
    [' -3 ', -3],
    ['', null],
    ['  ', null],
    ['abc', undefined],
    ['1,2,3', undefined],
    ['12V', undefined],
    // Sem vírgula, o ponto de milhar é ambíguo (mil e quinhentos ou um e meio?)
    ['1.500', undefined],
    ['1.234.567', undefined],
    // Ponto fora de grupo de três não é milhar
    ['1.23,5', undefined],
    // A coluna é Decimal(14, 4)
    ['0,12345', undefined],
  ])('lê "%s" como %s', (texto, valor) => {
    expect(lerNumeroDigitado(texto)).toBe(valor);
  });

  // Revisão do SN-58: o campo mostrava "1.234", sair dele sem mexer regravava 1,234
  it.each([[1234], [13800], [-1500], [1000000], [601.25], [0.0001], [0], [-0.5]])(
    'o que o campo mostra volta igual: %s',
    (valor) => {
      expect(lerNumeroDigitado(numeroNoCampo(valor))).toBe(valor);
    },
  );

  it('o Decimal em texto vira número; vazio e lixo viram null', () => {
    expect(numeroOuNulo('70.5000')).toBe(70.5);
    expect(numeroOuNulo('')).toBeNull();
    expect(numeroOuNulo(undefined)).toBeNull();
    expect(numeroOuNulo('x')).toBeNull();
  });
});

/** O dinheiro (SN-93): "1,005" virava 1,00 na tela e 1,01 na API */
describe('lerDinheiroDigitado', () => {
  it('até 2 casas; mais que isso é ilegível, e vazio apaga', () => {
    expect(lerDinheiroDigitado('1.402,50')).toBe(1402.5);
    expect(lerDinheiroDigitado('0,29')).toBe(0.29);
    expect(lerDinheiroDigitado('85')).toBe(85);
    expect(lerDinheiroDigitado('1,005')).toBeUndefined();
    expect(lerDinheiroDigitado('1.500')).toBeUndefined();
    expect(lerDinheiroDigitado('')).toBeNull();
  });
});
