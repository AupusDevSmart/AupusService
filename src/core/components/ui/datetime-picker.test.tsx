import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateTimePicker } from './datetime-picker';

/**
 * O picker servia todos os campos `datetime-local` e era so de data: zerava a
 * hora, e toda programacao nascia para 00:00.
 */
function ComEstado({ inicial }: { inicial?: Date }) {
  const [valor, setValor] = useState<Date | undefined>(inicial);
  return (
    <>
      <DateTimePicker date={valor} setDate={setValor} />
      <output data-testid="valor">{valor ? valor.toString() : ''}</output>
    </>
  );
}

const valor = () => screen.getByTestId('valor').textContent ?? '';

describe('DateTimePicker', () => {
  it('mostra a hora do valor, e nao so a data', () => {
    render(<ComEstado inicial={new Date(2026, 8, 29, 9, 30)} />);

    expect(screen.getByLabelText('Hora')).toHaveValue('09:30');
    expect(screen.getByPlaceholderText('dd/mm/aaaa')).toHaveValue('29/09/2026');
  });

  it('trocar a hora mantem o dia', () => {
    render(<ComEstado inicial={new Date(2026, 8, 29, 9, 30)} />);

    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '14:15' } });

    expect(valor()).toBe(new Date(2026, 8, 29, 14, 15).toString());
  });

  it('trocar o dia mantem a hora ja escolhida', () => {
    render(<ComEstado inicial={new Date(2026, 8, 29, 14, 15)} />);

    fireEvent.change(screen.getByPlaceholderText('dd/mm/aaaa'), { target: { value: '30/09/2026' } });

    expect(valor()).toBe(new Date(2026, 8, 30, 14, 15).toString());
  });

  it('hora escolhida antes do dia entra quando o dia chega', () => {
    render(<ComEstado />);

    fireEvent.change(screen.getByLabelText('Hora'), { target: { value: '10:45' } });
    expect(valor()).toBe('');

    fireEvent.change(screen.getByPlaceholderText('dd/mm/aaaa'), { target: { value: '01/10/2026' } });

    expect(valor()).toBe(new Date(2026, 9, 1, 10, 45).toString());
  });

  it('escolher so o dia nao cai em meia-noite', () => {
    render(<ComEstado />);

    fireEvent.change(screen.getByPlaceholderText('dd/mm/aaaa'), { target: { value: '01/10/2026' } });

    // Proxima meia hora a partir de agora; nunca o 00:00 que o picker forcava
    // (a nao ser que o teste rode entre 23:30 e 00:00).
    const hora = (screen.getByLabelText('Hora') as HTMLInputElement).value;
    expect(hora).toMatch(/^\d{2}:(00|30)$/);
    expect(valor()).not.toBe('');
  });
});
