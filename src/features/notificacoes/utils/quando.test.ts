import { describe, expect, it } from 'vitest';
import { quandoFoi } from './quando';

/** As contas são no fuso do navegador: o "agora" dos testes é montado nele. */
const agora = new Date(2026, 9, 16, 15, 30, 0);
const antes = (ms: number) => new Date(agora.getTime() - ms).toISOString();

describe('quandoFoi', () => {
  it.each([
    [antes(20_000), 'agora'],
    [antes(5 * 60_000), 'há 5 min'],
    [antes(59 * 60_000), 'há 59 min'],
    [antes(3 * 3_600_000), 'há 3 h'],
  ])('%s → %s', (iso, esperado) => {
    expect(quandoFoi(iso, agora)).toBe(esperado);
  });

  it('do dia anterior mostra "ontem" com a hora', () => {
    expect(quandoFoi(new Date(2026, 9, 15, 22, 5).toISOString(), agora)).toBe('ontem 22:05');
  });

  it('mais antigo mostra dia e hora', () => {
    expect(quandoFoi(new Date(2026, 9, 2, 9, 7).toISOString(), agora)).toBe('02/10 09:07');
  });

  it('o ISO do servidor vem em UTC (com Z) e é lido no fuso local', () => {
    const local = new Date(2026, 9, 16, 15, 0);
    expect(quandoFoi(local.toISOString(), agora)).toBe('há 30 min');
  });

  it('relógio do aparelho atrás do servidor não dá tempo negativo', () => {
    expect(quandoFoi(new Date(agora.getTime() + 90_000).toISOString(), agora)).toBe('agora');
  });

  it('data inválida não vira "agora"', () => {
    expect(quandoFoi('nao-e-data', agora)).toBe('data desconhecida');
  });
});
