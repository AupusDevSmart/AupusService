import { describe, expect, it } from 'vitest';
import { quantidadeDaFerramenta } from './quantidade-da-ferramenta';

describe('quantidadeDaFerramenta', () => {
  it('mantém a quantidade decimal (o backend guarda Decimal)', () => {
    expect(quantidadeDaFerramenta(2.5)).toBe(2.5);
    expect(quantidadeDaFerramenta('2.5')).toBe(2.5);
  });

  it('mantém a quantidade inteira', () => {
    expect(quantidadeDaFerramenta(3)).toBe(3);
    expect(quantidadeDaFerramenta('3')).toBe(3);
  });

  it('vazio ou zero vira 1, como antes', () => {
    expect(quantidadeDaFerramenta(undefined)).toBe(1);
    expect(quantidadeDaFerramenta(null)).toBe(1);
    expect(quantidadeDaFerramenta('')).toBe(1);
    expect(quantidadeDaFerramenta(0)).toBe(1);
  });

  it('texto que não é número vira 1, e não NaN', () => {
    expect(quantidadeDaFerramenta('abc')).toBe(1);
  });
});
