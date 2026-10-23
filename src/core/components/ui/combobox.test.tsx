import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { Combobox, type PaginacaoDoCombobox } from './combobox';

// Radix e cmdk usam APIs que o ambiente de teste não tem
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

const OPCOES = [
  { value: 'a', label: 'Inversor 1' },
  { value: 'b', label: 'Inversor 2' },
];

const paginacao = (dados: Partial<PaginacaoDoCombobox> = {}): PaginacaoDoCombobox => ({
  onBuscar: vi.fn(),
  carregarMais: vi.fn(),
  temMais: true,
  carregando: false,
  onAbrir: vi.fn(),
  ...dados,
});

const montar = (props: Partial<Parameters<typeof Combobox>[0]> = {}) =>
  renderWithProviders(<Combobox options={OPCOES} value="" onValueChange={vi.fn()} placeholder="Todos" {...props} />, { withRouter: false, withQueryClient: false });

/** Cadastro que cresce: todas as opções por rolagem infinita, com a busca no servidor (SN-52). */
describe('Combobox paginado', () => {
  it('abre avisando quem chama, e a busca vai para o servidor sem filtrar de novo na tela', async () => {
    const pagina = paginacao();
    const usuario = userEvent.setup();
    montar({ paginacao: pagina });

    await usuario.click(screen.getByRole('combobox'));
    await usuario.type(screen.getByPlaceholderText('Buscar...'), 'zz');

    expect(pagina.onAbrir).toHaveBeenCalled();
    expect(pagina.onBuscar).toHaveBeenLastCalledWith('zz');
    // O servidor é quem filtra: o que veio fica na lista
    expect(screen.getByRole('option', { name: 'Inversor 1' })).toBeInTheDocument();
  });

  it('ao rolar até o fim, pede a próxima página; sem mais páginas, não pede', async () => {
    const comMais = paginacao();
    const usuario = userEvent.setup();
    const { unmount } = montar({ paginacao: comMais });
    await usuario.click(screen.getByRole('combobox'));
    fireEvent.scroll(screen.getByRole('listbox'));
    expect(comMais.carregarMais).toHaveBeenCalled();
    unmount();

    const semMais = paginacao({ temMais: false });
    montar({ paginacao: semMais });
    await usuario.click(screen.getByRole('combobox'));
    fireEvent.scroll(screen.getByRole('listbox'));
    expect(semMais.carregarMais).not.toHaveBeenCalled();
  });

  it('o escolhido fora das páginas carregadas mostra o rótulo guardado', () => {
    montar({ value: 'x', paginacao: paginacao({ rotuloDoValor: 'Inversor 37 · UFV Sul' }) });

    expect(screen.getByRole('combobox')).toHaveTextContent('Inversor 37 · UFV Sul');
  });

  it('sem paginação, filtra na tela como sempre', async () => {
    const usuario = userEvent.setup();
    montar();

    await usuario.click(screen.getByRole('combobox'));
    await usuario.type(screen.getByPlaceholderText('Buscar...'), '2');

    expect(screen.queryByRole('option', { name: 'Inversor 1' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inversor 2' })).toBeInTheDocument();
  });
});
