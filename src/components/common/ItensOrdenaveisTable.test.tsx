import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ItensOrdenaveisTable, type ColunaItemOrdenavel } from './ItensOrdenaveisTable';

/**
 * Os passos da instrução (e os recursos) no sheet. No celular a tabela rolava
 * para o lado e espremia a descrição (SN-68): estreito, cada passo vira um
 * cartão, e a ordem muda por subir e descer (arrastar não funciona com o dedo).
 */
interface Passo {
  descricao: string;
  tempo: number;
}

const colunas: ColunaItemOrdenavel<Passo>[] = [
  { key: 'descricao', header: 'Descrição', render: (p) => <span>{p.descricao}</span> },
  { key: 'tempo', header: 'Tempo (h)', width: 'w-24', align: 'center', render: (p) => <span>{p.tempo}</span> },
];

const itens: Passo[] = [
  { descricao: 'Desligar o disjuntor', tempo: 0.5 },
  { descricao: 'Medir a tensão de saída', tempo: 1 },
];

const montar = () => {
  const onReordenar = vi.fn();
  const onRemover = vi.fn();
  render(
    <ItensOrdenaveisTable
      itens={itens}
      colunas={colunas}
      onReordenar={onReordenar}
      onRemover={onRemover}
      onAdicionar={() => {}}
      textoAdicionar="Adicionar passo"
    />,
  );
  return { onReordenar, onRemover };
};

const comLargura = (largura: number) =>
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: largura } as DOMRect);

afterEach(() => vi.restoreAllMocks());

describe('ItensOrdenaveisTable', () => {
  it('largo: a tabela, com a alça de arrastar', () => {
    comLargura(800);
    montar();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByTitle('Arraste para reordenar')).toHaveLength(2);
  });

  it('estreito: um cartão por passo, com o rótulo em cada campo, e sem tabela', () => {
    comLargura(360);
    montar();
    expect(screen.queryByRole('table')).toBeNull();
    const passo = screen.getByText('Medir a tensão de saída').closest('div')!;
    expect(within(passo).getByText('Descrição')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('estreito: subir e descer reordenam; o primeiro não sobe, o último não desce', () => {
    comLargura(360);
    const { onReordenar, onRemover } = montar();
    const [subir1, subir2] = screen.getAllByRole('button', { name: 'Subir' });
    const [descer1, descer2] = screen.getAllByRole('button', { name: 'Descer' });

    expect(subir1).toBeDisabled();
    expect(descer2).toBeDisabled();
    fireEvent.click(subir2);
    fireEvent.click(descer1);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover' })[1]);

    expect(onReordenar.mock.calls).toEqual([[1, 0], [0, 1]]);
    expect(onRemover).toHaveBeenCalledWith(1);
  });
});
