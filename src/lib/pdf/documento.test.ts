import { describe, expect, it } from 'vitest';
import { textoDoPdf, textosDoPdf } from './documento';

/**
 * A Helvetica do PDF só tem o Windows-1252, e o react-pdf apagava calado o
 * resto: "1,5 MΩ" saía "1,5 M" (achado no SN-62).
 */
describe('texto do PDF', () => {
  it('o latim de sempre passa como está', () => {
    expect(textoDoPdf('Ação: 25 °C, 2 m², 5 µA ± 0,1 — “ok” • 3€')).toBe('Ação: 25 °C, 2 m², 5 µA ± 0,1 — “ok” • 3€');
  });

  it('símbolo técnico vira texto que se lê', () => {
    expect(textoDoPdf('no mínimo 1,5 MΩ')).toBe('no mínimo 1,5 Mohm');
    // O sinal de ohm (U+2126) também: o NFC o troca pelo ômega
    expect(textoDoPdf('10 Ω')).toBe('10 ohm');
    expect(textoDoPdf('ΔT ≥ 5 → ok')).toBe('delta T >= 5 -> ok');
  });

  it('o resto vira "?", que se vê — inclusive texto corrompido e emoji', () => {
    expect(textoDoPdf('Chimarr├úo')).toBe('Chimarr?úo');
    expect(textoDoPdf('feito 👍')).toBe('feito ?');
  });

  // Revisão do SN-62: texto colado de planilha (tab), de Windows (CRLF) e o mi grego
  it('tab vira espaço, CR some, μ e ℃ viram o que a fonte tem', () => {
    expect(textoDoPdf('Item\tValor\r\nok')).toBe('Item Valor\nok');
    expect(textoDoPdf('10 μF a 40 ℃')).toBe('10 µF a 40 °C');
  });

  it('quebra de linha fica; acento decomposto é recomposto (não vira "?")', () => {
    expect(textoDoPdf('linha 1\nlinha 2')).toBe('linha 1\nlinha 2');
    expect(textoDoPdf('ão')).toBe('ão');
  });

  it('no documento inteiro: todo texto, nada mais', () => {
    expect(textosDoPdf({ a: '1 MΩ', b: [{ c: '≤ 3' }], n: 2, nulo: null, src: 'data:image/png;base64,AAAA' })).toEqual({
      a: '1 Mohm',
      b: [{ c: '<= 3' }],
      n: 2,
      nulo: null,
      src: 'data:image/png;base64,AAAA',
    });
  });
});
