import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isDateInPast, isEndDateAfterStartDate } from './date-utils';

/**
 * SN-78: o dia da reserva comparado com o hoje de quem está na tela. O
 * `new Date("2026-10-20")` era a meia-noite UTC (21h do dia 19 em Brasília):
 * a reserva para hoje dava "não pode ser no passado".
 */
describe('date-utils das reservas (em America/Sao_Paulo)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T09:00:00-03:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hoje não é passado; ontem é', () => {
    expect(isDateInPast('2026-10-20')).toBe(false);
    expect(isDateInPast('2026-10-19')).toBe(true);
    expect(isDateInPast('2026-10-20', false)).toBe(true);
  });

  it('às 22h ainda é hoje (em UTC já seria amanhã)', () => {
    vi.setSystemTime(new Date('2026-10-20T22:30:00-03:00'));
    expect(isDateInPast('2026-10-20')).toBe(false);
  });

  it('fim depois do início: pelo dia e, no mesmo dia, pela hora', () => {
    expect(isEndDateAfterStartDate('2026-10-20', '2026-10-21')).toBe(true);
    expect(isEndDateAfterStartDate('2026-10-21', '2026-10-20')).toBe(false);
    expect(isEndDateAfterStartDate('2026-10-20', '2026-10-20', '08:00', '18:00')).toBe(true);
    expect(isEndDateAfterStartDate('2026-10-20', '2026-10-20', '18:00', '08:00')).toBe(false);
  });
});
