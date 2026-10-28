import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { recursosFilterConfig } from './filter-config';

/**
 * O filtro de categoria da lista de recursos, como o do AupusProject (28/out/2026):
 * botões com todas as categorias à vista, "Todos" primeiro, e o vazio como "Todos".
 */
describe('filtros da lista de recursos', () => {
  const categoria = recursosFilterConfig.find((f) => f.key === 'categoria')!;
  const desenhar = (value: unknown, onChange = vi.fn()) => {
    render(<>{categoria.render!({ value, onChange, disabled: false })}</>);
    return onChange;
  };

  it('a categoria vem antes da busca, as duas na linha inteira', () => {
    expect(recursosFilterConfig.map((f) => [f.key, f.className])).toEqual([
      ['categoria', 'col-span-full'],
      ['search', 'col-span-full'],
    ]);
  });

  it('um botão por categoria, no plural, depois de "Todos"', () => {
    desenhar('');
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Todos',
      'Mão de obra',
      'Materiais',
      'Instrumentos',
      'Veículos',
      'Terceiros',
      'Despesas de campo',
    ]);
    expect(screen.getByRole('group', { name: 'Filtrar por categoria' })).toBeTruthy();
  });

  it('sem categoria (ou o "all" de antes) marca "Todos"; a escolhida fica marcada', () => {
    desenhar('all');
    expect(screen.getByRole('button', { name: 'Todos' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('clicar manda o valor da categoria; "Todos" manda vazio', () => {
    const onChange = desenhar('MATERIAL');
    expect(screen.getByRole('button', { name: 'Materiais' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Instrumentos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    expect(onChange.mock.calls).toEqual([['INSTRUMENTO'], ['']]);
  });
});
