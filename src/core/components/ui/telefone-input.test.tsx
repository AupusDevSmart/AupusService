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

  // A máscara cortava em 11 dígitos antes de tirar o prefixo: "0 62 99999-8888"
  // virava "+556299999888" (um dígito a menos, aceito como fixo) sem aviso
  // (revisão de falha silenciosa).
  it.each([
    ['com o 0 da operadora', '062999998888', '(62) 99999-8888', '+5562999998888'],
    ['com o 55 do país (wa.me)', '5562999998888', '(62) 99999-8888', '+5562999998888'],
    ['de outro país com 00', '0012025550123', '+12025550123', '+12025550123'],
  ])('%s: o número fica inteiro', async (_caso, digitado, exibido, entregue) => {
    const onChange = vi.fn();
    render(<TelefoneInput value="" onChange={onChange} />);

    await userEvent.setup({ delay: null }).type(screen.getByRole('textbox'), digitado);

    expect(screen.getByRole('textbox')).toHaveValue(exibido);
    expect(onChange).toHaveBeenLastCalledWith(entregue);
  });

  it('colar o número com prefixo também fica inteiro', async () => {
    const onChange = vi.fn();
    render(<TelefoneInput value="" onChange={onChange} />);

    const usuario = userEvent.setup({ delay: null });
    await usuario.click(screen.getByRole('textbox'));
    await usuario.paste('0 62 99999-8888');

    expect(onChange).toHaveBeenLastCalledWith('+5562999998888');
  });
});
