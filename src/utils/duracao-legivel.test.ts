import { describe, expect, it } from 'vitest';
import { duracaoLegivel } from './horas';

/** O tempo parado da OS (SN-60): 4320 min não diz nada a quem lê; "3 d" diz. */
describe('duracaoLegivel', () => {
  it.each([
    [0, '0 min'],
    [45, '45 min'],
    [60, '1 h'],
    [105, '1 h 45 min'],
    [4320, '3 d'],
    [4570, '3 d 4 h'],
    [4330, '3 d 10 min'],
    [525600, '365 d'],
  ])('%i min -> "%s"', (minutos, texto) => {
    expect(duracaoLegivel(minutos)).toBe(texto);
  });

  it('sem valor (ou negativo), vazio', () => {
    expect(duracaoLegivel(null)).toBe('');
    expect(duracaoLegivel(undefined)).toBe('');
    expect(duracaoLegivel(-5)).toBe('');
  });
});
