import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BaseTable } from './BaseTable';

/**
 * Marcar linhas (30/out/2026, a exclusão em lote dos recursos): só aparece com
 * `onSelecionadosChange`; o cabeçalho marca e desmarca a página; os ids vão aparados.
 */
const linhas = [
  { id: 'a1                       ', nome: 'Cabo' },
  { id: 'b2', nome: 'Fita' },
];
const pagina = { page: 1, limit: 10, total: 2, totalPages: 1 };
const tabela = (selecionados?: string[], onSelecionadosChange?: (ids: string[]) => void) =>
  render(
    <BaseTable
      data={linhas}
      columns={[{ key: 'nome', label: 'Nome' }]}
      pagination={pagina}
      onPageChange={vi.fn()}
      {...(onSelecionadosChange && { selecionados, onSelecionadosChange })}
    />,
  );
// A tabela do desktop (o cartão do celular repete as caixas)
const desktop = () => within(screen.getByRole('table'));

describe('BaseTable: marcar linhas', () => {
  it('sem pedir, nenhuma caixa', () => {
    tabela();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('marca a linha pelo id aparado e desmarca de novo', () => {
    const onChange = vi.fn();
    tabela([], onChange);
    fireEvent.click(desktop().getAllByRole('checkbox', { name: 'Marcar' })[0]);
    expect(onChange).toHaveBeenLastCalledWith(['a1']);
  });

  it('o cabeçalho marca a página inteira; com tudo marcado, desmarca', () => {
    const onChange = vi.fn();
    const { unmount } = tabela(['x9'], onChange);
    fireEvent.click(desktop().getByRole('checkbox', { name: 'Marcar a página' }));
    expect(onChange).toHaveBeenLastCalledWith(['x9', 'a1', 'b2']);
    unmount();
    tabela(['a1', 'b2', 'x9'], onChange);
    expect(desktop().getByRole('checkbox', { name: 'Marcar a página' })).toBeChecked();
    fireEvent.click(desktop().getByRole('checkbox', { name: 'Marcar a página' }));
    expect(onChange).toHaveBeenLastCalledWith(['x9']);
  });
});
