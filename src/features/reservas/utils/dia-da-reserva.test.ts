import { describe, expect, it } from 'vitest';
import { diaDaReserva, formatarDiaDaReserva } from './dia-da-reserva';

describe('dia da reserva', () => {
  it('meia-noite UTC é o próprio dia, não o anterior (Brasília é UTC-3)', () => {
    expect(formatarDiaDaReserva('2027-03-10T00:00:00.000Z')).toBe('10/03/2027');
  });

  it('aceita o dia puro e devolve vazio sem valor', () => {
    expect(diaDaReserva('2027-03-10')).toBe('2027-03-10');
    expect(formatarDiaDaReserva(null)).toBe('');
  });
});
