import { afterEach, describe, expect, it, vi } from 'vitest';
import { diaDaquiA, diaDeCalendario, formatarDiaDeCalendario, hojeNaTela } from './dia-de-calendario';

/** O dia de um campo @db.Date (feriado, reserva): o gravado, não o anterior (SN-56). */
describe('diaDeCalendario', () => {
  it('meia-noite UTC é o dia gravado, em qualquer fuso (o Natal aparecia em 24/12)', () => {
    expect(diaDeCalendario('2024-12-25T00:00:00.000Z')).toBe('2024-12-25');
    expect(formatarDiaDeCalendario('2024-12-25T00:00:00.000Z')).toBe('25/12/2024');
  });

  it('AAAA-MM-DD passa como veio (é o que o campo de data aceita)', () => {
    expect(diaDeCalendario('2026-11-02')).toBe('2026-11-02');
  });

  it('vazio e inválido não viram data', () => {
    expect(diaDeCalendario(null)).toBe('');
    expect(diaDeCalendario('não é data')).toBe('');
    expect(formatarDiaDeCalendario(undefined)).toBe('');
  });
});

// SN-78: o padrão "hoje", "+90 dias", "+1 ano" saía do dia UTC (toISOString)
describe('hojeNaTela e diaDaquiA (os testes rodam em America/Sao_Paulo)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('às 22h de Brasília ainda é hoje (em UTC já é amanhã)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T22:30:00-03:00'));
    expect(hojeNaTela()).toBe('2026-10-20');
    expect(diaDaquiA({ dias: 90 })).toBe('2027-01-18');
    expect(diaDaquiA({ anos: 1 })).toBe('2027-10-20');
  });

  it('a virada do mês e o 29 de fevereiro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2028-02-29T10:00:00-03:00'));
    expect(diaDaquiA({ dias: 1 })).toBe('2028-03-01');
    expect(diaDaquiA({ anos: 1 })).toBe('2029-03-01');
  });
});
