import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CardLinha, CardLista, larguraDaGrade, type ColunaCard } from './card-lista';

/**
 * A lista em cartão (técnicos, materiais, ferramentas, orçamento da OS) não
 * rola para o lado (SN-68): mais estreita que a grade, cada linha vira um
 * cartão com o rótulo em cima de cada campo.
 */
const colunas: ColunaCard[] = [
  { label: 'Técnico', largura: 'minmax(9rem, 1fr)' },
  { label: 'Horas', largura: '4rem' },
  { label: 'R$/h', largura: '5rem' },
  { label: 'Custo', largura: '5.5rem' },
  { label: '', largura: '2rem' },
];

const lista = () =>
  render(
    <CardLista colunas={colunas} larguraMinima="46rem">
      <CardLinha colunas={colunas}>
        <span>Ana Técnica</span>
        <span>4</span>
        <>
          <span>50</span>
          <span>R$ 200,00</span>
        </>
        {false}
        <button type="button">Remover</button>
      </CardLinha>
    </CardLista>,
  );

const comLargura = (largura: number) =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: largura } as DOMRect);

afterEach(() => vi.restoreAllMocks());

describe('CardLista', () => {
  // Um limite fixo empilhava a programação (que cabe) e deixava a execução, com mais colunas, rolar
  it('o limite é o que a grade precisa: o mínimo de cada coluna e os espaços', () => {
    // 9 + 4 + 5 + 5.5 + 2 = 25.5, quatro espaços de 0.5 e o recuo de 0.5
    expect(larguraDaGrade(colunas)).toBe('28rem');
    expect(larguraDaGrade([{ label: 'A', largura: '1fr' }, { label: 'B', largura: '80px' }])).toBe('12rem');
  });

  it.each([
    [500, false],
    [400, true],
  ])('sem limite informado, a %ipx empilha: %s', (largura, empilha) => {
    comLargura(largura);
    const { container } = render(
      <CardLista colunas={colunas}>
        <CardLinha colunas={colunas}>
          <span>Ana</span>
        </CardLinha>
      </CardLista>,
    );
    expect(container.querySelector('[data-empilhada]') !== null).toBe(empilha);
  });

  it('na largura da grade: cabeçalho em cima e a linha em grade, sem rolagem lateral', () => {
    comLargura(900);
    const { container } = lista();

    expect(screen.getByText('Técnico')).toBeInTheDocument();
    expect(container.querySelector('[data-empilhada]')).toBeNull();
    expect(container.querySelector('.overflow-x-auto')).toBeNull();
  });

  it('mais estreita (celular): cada linha é um cartão, com o rótulo em cada campo, também os do fragmento', () => {
    comLargura(360);
    const { container } = lista();

    expect(container.querySelector('[data-empilhada]')).not.toBeNull();
    const rotulo = (texto: string) => screen.getByText(texto).closest('div')!;
    expect(within(rotulo('Ana Técnica')).getByText('Técnico')).toBeInTheDocument();
    expect(within(rotulo('R$ 200,00')).getByText('Custo')).toBeInTheDocument();
    expect(within(rotulo('50')).getByText('R$/h')).toBeInTheDocument();
    // A ação, sem rótulo, fica no fim
    expect(screen.getByRole('button', { name: 'Remover' }).parentElement).toHaveClass('justify-end');
    expect(container.querySelector('.overflow-x-auto')).toBeNull();
  });
});
