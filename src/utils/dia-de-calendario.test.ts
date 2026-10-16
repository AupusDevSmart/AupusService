import { describe, expect, it } from 'vitest';
import { diaDeCalendario, formatarDiaDeCalendario } from './dia-de-calendario';

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
