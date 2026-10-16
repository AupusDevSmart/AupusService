import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TelefoneInput } from '@/core/components/ui/telefone-input';

/**
 * O campo de telefone mostra a máscara e entrega ao formulário o número em
 * E.164 quando ele está completo (SN-46). Antes era texto livre: no dev havia
 * 12 formatos para 55 telefones.
 */
describe('TelefoneInput', () => {
  it('o telefone gravado aparece com máscara', () => {
    render(<TelefoneInput value="+5562999998888" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('(62) 99999-8888');
  });

  it('digitar o número completo entrega o E.164', async () => {
    const onChange = vi.fn();
    render(<TelefoneInput value="" onChange={onChange} />);

    await userEvent.setup({ delay: null }).type(screen.getByRole('textbox'), '62999998888');

    expect(screen.getByRole('textbox')).toHaveValue('(62) 99999-8888');
    expect(onChange).toHaveBeenLastCalledWith('+5562999998888');
  });

  it('número pela metade vai como foi digitado (a API diz o que falta)', async () => {
    const onChange = vi.fn();
    render(<TelefoneInput value="" onChange={onChange} />);

    await userEvent.setup({ delay: null }).type(screen.getByRole('textbox'), '6299');

    expect(onChange).toHaveBeenLastCalledWith('(62) 99');
  });

  it('apagar tudo deixa sem telefone', async () => {
    const onChange = vi.fn();
    render(<TelefoneInput value="+5562999998888" onChange={onChange} />);

    await userEvent.setup({ delay: null }).clear(screen.getByRole('textbox'));

    expect(onChange).toHaveBeenLastCalledWith('');
  });
});
