import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { CampoDeDataDoFiltro } from './FiltrosDaLista';

/** SN-55: o campo de data emite cada passo do ano; só a data inteira vira busca. */
describe('CampoDeDataDoFiltro', () => {
  const montar = (props: Partial<Parameters<typeof CampoDeDataDoFiltro>[0]> = {}) =>
    renderWithProviders(<CampoDeDataDoFiltro rotulo="De" value="" onChange={vi.fn()} {...props} />, { withRouter: false, withQueryClient: false });

  it('os passos do ano (0002, 0202) não avisam; o ano inteiro e o apagar avisam', () => {
    const mudou = vi.fn();
    montar({ onChange: mudou });
    const campo = screen.getByLabelText('Período: de');

    fireEvent.change(campo, { target: { value: '0002-11-10' } });
    fireEvent.change(campo, { target: { value: '0202-11-10' } });
    expect(mudou).not.toHaveBeenCalled();

    fireEvent.change(campo, { target: { value: '2026-11-10' } });
    fireEvent.change(campo, { target: { value: '' } });
    expect(mudou.mock.calls).toEqual([['2026-11-10'], ['']]);
  });

  it('o valor de fora (limpar filtros) zera o campo', () => {
    const { rerender } = montar({ value: '2026-11-10' });
    expect(screen.getByLabelText('Período: de')).toHaveValue('2026-11-10');

    rerender(<CampoDeDataDoFiltro rotulo="De" value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Período: de')).toHaveValue('');
  });
});
