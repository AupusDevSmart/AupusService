import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListaSelecionavel, type OpcaoDaLista } from './ListaSelecionavel';

const opcoes: OpcaoDaLista[] = Array.from({ length: 3 }, (_, i) => ({ id: `o${i}`, titulo: `Opção ${i}` }));

const paginacao = (extra: Partial<{ temMais: boolean; carregando: boolean }> = {}) => ({
  onBuscar: vi.fn(),
  carregarMais: vi.fn(),
  temMais: true,
  carregando: false,
  ...extra,
});

/** A lista paginada da origem da programação (SN-77): busca no servidor e rolagem infinita. */
describe('ListaSelecionavel com paginação', () => {
  it('a busca vai para quem pagina; a lista não filtra de novo', () => {
    const pag = paginacao();
    render(<ListaSelecionavel opcoes={opcoes} onChange={vi.fn()} placeholder="Buscar" vazio="Nada" paginacao={pag} />);

    fireEvent.change(screen.getByPlaceholderText('Buscar'), { target: { value: 'xyz' } });

    expect(pag.onBuscar).toHaveBeenCalledWith('xyz');
    // O servidor ainda não respondeu: o que veio continua (quem filtra é ele)
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('rolar até perto do fim pede a próxima página; sem mais páginas, não', () => {
    const semMais = paginacao({ temMais: false });
    const { rerender } = render(<ListaSelecionavel opcoes={opcoes} onChange={vi.fn()} placeholder="Buscar" vazio="Nada" paginacao={semMais} />);
    const lista = screen.getByTestId('lista-de-origem');
    Object.defineProperties(lista, { scrollHeight: { value: 1000 }, clientHeight: { value: 288 }, scrollTop: { value: 0, writable: true } });
    fireEvent.scroll(lista, { target: { scrollTop: 700 } });
    expect(semMais.carregarMais).not.toHaveBeenCalled();

    // Longe do fim: não pede; perto: pede
    lista.scrollTop = 0;
    const pag = paginacao();
    rerender(<ListaSelecionavel opcoes={opcoes} onChange={vi.fn()} placeholder="Buscar" vazio="Nada" paginacao={pag} />);
    expect(pag.carregarMais).not.toHaveBeenCalled();
    lista.scrollTop = 700;
    fireEvent.scroll(lista);
    expect(pag.carregarMais).toHaveBeenCalledTimes(1);
  });

  // Sem rolagem não há evento de rolagem: a página que não enche a lista pedia a seguinte nunca
  it('lista curta, que não rola, pede a próxima página sozinha', () => {
    const pag = paginacao();
    render(<ListaSelecionavel opcoes={opcoes} onChange={vi.fn()} placeholder="Buscar" vazio="Nada" paginacao={pag} />);
    expect(pag.carregarMais).toHaveBeenCalledTimes(1);
  });

  it('enquanto a próxima página vem, não pede de novo', () => {
    const pag = paginacao({ carregando: true });
    render(<ListaSelecionavel opcoes={opcoes} onChange={vi.fn()} placeholder="Buscar" vazio="Nada" paginacao={pag} />);
    fireEvent.scroll(screen.getByTestId('lista-de-origem'));
    expect(pag.carregarMais).not.toHaveBeenCalled();
    expect(screen.getByText('Carregando mais...')).toBeInTheDocument();
  });

  // Antes o carregando tomava o lugar do campo: a cada letra ele sumia e perdia o foco
  it('o campo de busca fica enquanto carrega', () => {
    render(<ListaSelecionavel opcoes={[]} onChange={vi.fn()} placeholder="Buscar" vazio="Nada" loading paginacao={paginacao({ carregando: true })} />);

    expect(screen.getByPlaceholderText('Buscar')).toBeInTheDocument();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('busca sem resultado diz o que foi buscado; falha diz que não carregou', () => {
    const { rerender } = render(<ListaSelecionavel opcoes={[]} onChange={vi.fn()} placeholder="Buscar" vazio="Nenhuma anomalia" paginacao={paginacao()} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar'), { target: { value: 'bomba' } });
    expect(screen.getByText('Nada encontrado para "bomba".')).toBeInTheDocument();

    rerender(<ListaSelecionavel opcoes={[]} onChange={vi.fn()} placeholder="Buscar" vazio="Nenhuma anomalia" erro paginacao={paginacao()} />);
    expect(screen.getByText('Não foi possível carregar a lista.')).toBeInTheDocument();
  });

  it('sair do passo volta a busca do servidor a vazia, junto com o campo', () => {
    const pag = paginacao();
    const { unmount } = render(<ListaSelecionavel opcoes={opcoes} onChange={vi.fn()} placeholder="Buscar" vazio="Nada" paginacao={pag} />);
    unmount();
    expect(pag.onBuscar).toHaveBeenLastCalledWith('');
  });
});
