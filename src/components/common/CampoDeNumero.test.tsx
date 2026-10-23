import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CampoDeNumero } from './CampoDeNumero';

/**
 * Campo de número com vírgula (SN-58). O `type="number"` devolvia "" para
 * "12,5" num navegador em inglês, e a faixa da instrução salvava sem o limite.
 */
describe('CampoDeNumero', () => {
  function ComEstado({ inicial = null as number | null, onChange = vi.fn() }) {
    const [valor, setValor] = useState<number | null>(inicial);
    return (
      <CampoDeNumero
        aria-label="Máximo"
        value={valor}
        onChange={(v) => {
          setValor(v);
          onChange(v);
        }}
      />
    );
  }

  const campo = () => screen.getByRole('textbox', { name: 'Máximo' });

  it('aceita vírgula e entrega o número ao sair', () => {
    const onChange = vi.fn();
    render(<ComEstado onChange={onChange} />);

    fireEvent.change(campo(), { target: { value: '12,5' } });
    fireEvent.blur(campo());

    expect(onChange).toHaveBeenCalledWith(12.5);
    expect(campo()).toHaveValue('12,5');
  });

  it('o que não dá para ler fica no campo, avisa e não entrega nada', () => {
    const onChange = vi.fn();
    render(<ComEstado inicial={10} onChange={onChange} />);

    fireEvent.change(campo(), { target: { value: '1.500' } });
    fireEvent.blur(campo());

    expect(onChange).not.toHaveBeenCalled();
    expect(campo()).toHaveValue('1.500');
    expect(campo()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('apagar entrega null (o campo se deixa apagar)', () => {
    const onChange = vi.fn();
    render(<ComEstado inicial={620} onChange={onChange} />);

    fireEvent.change(campo(), { target: { value: '' } });
    fireEvent.blur(campo());

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('sair sem mudar não entrega nada', () => {
    const onChange = vi.fn();
    render(<ComEstado inicial={13800} onChange={onChange} />);

    expect(campo()).toHaveValue('13800');
    fireEvent.blur(campo());

    expect(onChange).not.toHaveBeenCalled();
  });
});
