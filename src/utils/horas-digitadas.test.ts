import { describe, expect, it } from 'vitest';
import { formatarHoras, horasNoCampo, lerHorasDigitadas } from './horas';

/** As horas trabalhadas no Executar (SN-61): em campo se pensa em "3h30", não em 3,5. */
describe('lerHorasDigitadas', () => {
  it.each([
    ['3h30', 3.5],
    ['3h', 3],
    ['3 h 30 min', 3.5],
    ['3h05', 3.08],
    ['45min', 0.75],
    ['20min', 0.33],
    ['90min', 1.5],
    ['3:30', 3.5],
    ['3,5', 3.5],
    ['3.5', 3.5],
    ['0', 0],
    ['999,99', 999.99],
  ])('"%s" = %s h', (texto, horas) => {
    expect(lerHorasDigitadas(texto)).toBe(horas);
  });

  it('vazio é null (apaga)', () => {
    expect(lerHorasDigitadas('  ')).toBeNull();
  });

  it.each([['abc'], ['3h75'], ['3:5'], ['1000'], ['-2'], ['1.500'], ['3,333'], ['2h30h']])('"%s" não dá para ler', (texto) => {
    expect(lerHorasDigitadas(texto)).toBeUndefined();
  });

  it('o que volta para a tela relê no mesmo número (20 min não vira 19)', () => {
    for (const horas of [0.33, 3.33, 3.08, 7.5, 0.75]) {
      expect(lerHorasDigitadas(formatarHoras(horas))).toBe(horas);
    }
  });
});

/**
 * As horas no campo (SN-85): em horas e minutos quando a volta dá o mesmo
 * número; senão em decimal, para só passar pelo campo não regravar outro valor.
 */
describe('horasNoCampo', () => {
  it('em horas e minutos quando volta igual (0,33 h = 0h20, que volta 0,33)', () => {
    expect(horasNoCampo(1.5)).toBe('1h30');
    expect(horasNoCampo(0.33)).toBe('20min');
    expect(lerHorasDigitadas(horasNoCampo(3.33))).toBe(3.33);
  });

  it('em decimal quando o minuto não volta o mesmo número (1,11 h viraria 1,12)', () => {
    expect(horasNoCampo(1.11)).toBe('1,11');
    expect(lerHorasDigitadas(horasNoCampo(1.11))).toBe(1.11);
    expect(horasNoCampo(null)).toBe('');
  });
});
