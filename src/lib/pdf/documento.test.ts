import { describe, expect, it } from 'vitest';
import { textoDoPdf, textosDoPdf } from './documento';

/**
 * O react-pdf apaga calado o caractere que a fonte não tem: com a Helvetica,
 * "1,5 MΩ" saía "1,5 M" (achado no SN-62). A Lexend (SN-92) tem o ômega e os
 * símbolos de comparação; o resto ainda vira texto que se lê, ou "?".
 */
describe('texto do PDF', () => {
  it('o latim de sempre passa como está', () => {
    expect(textoDoPdf('Ação: 25 °C, 2 m², 5 µA ± 0,1 — “ok” • 3€')).toBe('Ação: 25 °C, 2 m², 5 µA ± 0,1 — “ok” • 3€');
  });

  it('o símbolo que a fonte tem passa; o que ela não tem vira texto que se lê', () => {
    expect(textoDoPdf('no mínimo 1,5 MΩ')).toBe('no mínimo 1,5 MΩ');
    // O sinal de ohm (U+2126) vira o ômega pelo NFC, e a fonte tem o ômega
    expect(textoDoPdf('10 \u2126')).toBe('10 Ω');
    expect(textoDoPdf('ΔT ≥ 5 → ok')).toBe('ΔT ≥ 5 -> ok');
    expect(textoDoPdf('α ≈ 0,5 e Σ')).toBe('alfa ≈ 0,5 e soma ');
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
    expect(textosDoPdf({ a: '1 MΩ', b: [{ c: '≤ 3 → 4' }], n: 2, nulo: null, src: 'data:image/png;base64,AAAA' })).toEqual({
      a: '1 MΩ',
      b: [{ c: '≤ 3 -> 4' }],
      n: 2,
      nulo: null,
      src: 'data:image/png;base64,AAAA',
    });
  });
});
