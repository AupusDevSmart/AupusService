import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InstalacaoEGarantia } from './InstalacaoEGarantia';

/** Instalação, garantia, fornecedor e centro de custo no sheet da UC e do componente (SN-66). */
describe('InstalacaoEGarantia', () => {
  it('os quatro campos, com o que está gravado, e editáveis', () => {
    const onChange = vi.fn();
    render(
      <InstalacaoEGarantia
        valores={{ dataInstalacao: '2026-04-01', garantiaAte: '2031-04-01', fornecedor: 'Distribuidora', centroCusto: 'CC-1' }}
        onChange={onChange}
        hoje="2026-10-19"
      />,
    );

    expect(screen.getByLabelText('Data de instalação')).toHaveValue('2026-04-01');
    expect(screen.getByLabelText('Garantia até')).toHaveValue('2031-04-01');
    expect(screen.getByLabelText('Fornecedor')).toHaveValue('Distribuidora');
    fireEvent.change(screen.getByLabelText('Centro de custo'), { target: { value: 'CC-2' } });
    expect(onChange).toHaveBeenCalledWith('centroCusto', 'CC-2');
    expect(screen.getByText('Em garantia até 01/04/2031')).toBeInTheDocument();
  });

  it('na leitura, campos travados e o aviso da garantia vencida', () => {
    render(<InstalacaoEGarantia valores={{ garantiaAte: '2026-10-01' }} onChange={vi.fn()} somenteLeitura hoje="2026-10-19" />);

    expect(screen.getByLabelText('Garantia até')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Garantia vencida em 01/10/2026');
  });

  it('avisa (sem travar) a garantia que termina antes da instalação', () => {
    render(<InstalacaoEGarantia valores={{ dataInstalacao: '2026-05-01', garantiaAte: '2026-04-30' }} onChange={vi.fn()} hoje="2026-04-01" />);
    expect(screen.getByText(/termina antes da instalação/)).toBeInTheDocument();
  });
});
