import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import type { Comentario } from '@/services/comentarios.services';

const api = {
  listar: vi.fn(),
  comentar: vi.fn(),
  editar: vi.fn(),
  excluir: vi.fn(),
};
vi.mock('@/services/comentarios.services', () => ({ comentariosApi: api }));

const { ComentariosDoRegistro } = await import('./ComentariosDoRegistro');

const daqui = (minutos: number) => new Date(Date.now() + minutos * 60_000).toISOString();
const comentario = (dados: Partial<Comentario>): Comentario => ({
  id: 'C1',
  comentario: 'Peça chega amanhã',
  autor: 'Técnico Fulano',
  autor_id: 'U1',
  interno: false,
  created_at: daqui(-2),
  updated_at: daqui(-2),
  editado: false,
  editavel_ate: null,
  editavel_por_ms: null,
  ...dados,
});

const montar = (props: Partial<{ podeComentar: boolean; ehCliente: boolean }> = {}) =>
  renderWithProviders(<ComentariosDoRegistro alvo="ordem_servico" registroId="OS1" podeComentar ehCliente={false} {...props} />, { withRouter: false });

/** A OS e a solicitação não tinham conversa nenhuma na tela (SN-48). */
describe('ComentariosDoRegistro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listar.mockResolvedValue([comentario({}), comentario({ id: 'C2', comentario: 'Só a equipe', interno: true, autor: 'Gerente' })]);
    api.comentar.mockResolvedValue(comentario({ id: 'C3' }));
    api.editar.mockResolvedValue(comentario({}));
    api.excluir.mockResolvedValue(undefined);
  });

  it('lista os comentários com autor, e marca o interno', async () => {
    montar();

    expect(await screen.findByText('Peça chega amanhã')).toBeInTheDocument();
    expect(screen.getByText('Técnico Fulano')).toBeInTheDocument();
    expect(screen.getByText('interno')).toBeInTheDocument();
    expect(screen.getByText('Comentários (2)')).toBeInTheDocument();
  });

  it('comentar manda o texto aparado e limpa a caixa; interno marcado vai junto', async () => {
    montar();
    await screen.findByText('Peça chega amanhã');

    fireEvent.change(screen.getByLabelText('Novo comentário'), { target: { value: '  Acesso liberado  ' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Comentário interno' }));
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));

    await waitFor(() => expect(api.comentar).toHaveBeenCalledWith('ordem_servico', 'OS1', 'Acesso liberado', true));
    await waitFor(() => expect(screen.getByLabelText('Novo comentário')).toHaveValue(''));
  });

  // Fica dentro do <form> do sheet: comentar enviava o formulário e fechava o sheet
  it('dentro de um formulário, nenhum botão envia o formulário', async () => {
    const enviou = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    api.listar.mockResolvedValue([comentario({ id: 'MEU', editavel_ate: daqui(10), editavel_por_ms: 10 * 60_000 })]);
    renderWithProviders(
      <form onSubmit={enviou}>
        <ComentariosDoRegistro alvo="ordem_servico" registroId="OS1" podeComentar ehCliente={false} />
      </form>,
      { withRouter: false },
    );
    await screen.findByText('Peça chega amanhã');

    fireEvent.change(screen.getByLabelText('Novo comentário'), { target: { value: 'oi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(api.comentar).toHaveBeenCalled());
    expect(enviou).not.toHaveBeenCalled();
  });

  it('falha ao comentar deixa o texto na caixa', async () => {
    api.comentar.mockRejectedValue(new Error('rede'));
    montar();
    await screen.findByText('Peça chega amanhã');

    fireEvent.change(screen.getByLabelText('Novo comentário'), { target: { value: 'Não posso perder isto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));

    await waitFor(() => expect(api.comentar).toHaveBeenCalled());
    expect(screen.getByLabelText('Novo comentário')).toHaveValue('Não posso perder isto');
  });

  it('o cliente não tem a opção de comentário interno', async () => {
    montar({ ehCliente: true });
    await screen.findByText('Peça chega amanhã');

    expect(screen.queryByRole('checkbox', { name: 'Comentário interno' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Novo comentário'), { target: { value: 'Pode vir na terça?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));
    await waitFor(() => expect(api.comentar).toHaveBeenCalledWith('ordem_servico', 'OS1', 'Pode vir na terça?', false));
  });

  it('sem permissão de atuar, só lê', async () => {
    montar({ podeComentar: false });
    await screen.findByText('Peça chega amanhã');

    expect(screen.queryByLabelText('Novo comentário')).not.toBeInTheDocument();
  });

  it('editar e excluir só aparecem no comentário que ainda está no prazo', async () => {
    api.listar.mockResolvedValue([
      comentario({ id: 'MEU', comentario: 'meu, no prazo', editavel_ate: daqui(10), editavel_por_ms: 10 * 60_000 }),
      comentario({ id: 'VENCIDO', comentario: 'meu, vencido', editavel_ate: daqui(-1), editavel_por_ms: null }),
      comentario({ id: 'OUTRO', comentario: 'de outro', editavel_ate: null }),
    ]);
    montar();
    await screen.findByText('meu, no prazo');

    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Excluir' })).toHaveLength(1);
  });

  // O prazo vem como "quanto falta" medido no servidor: aparelho com o relógio
  // 20 min adiantado ainda mostra os botões de quem está no prazo
  it('relógio do aparelho errado não some com editar e excluir', async () => {
    api.listar.mockResolvedValue([comentario({ id: 'MEU', comentario: 'meu', editavel_ate: daqui(-20), editavel_por_ms: 10 * 60_000 })]);
    montar();

    expect(await screen.findByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it('texto acima de 5000 caracteres não é cortado: avisa e trava o envio', async () => {
    montar();
    await screen.findByText('Peça chega amanhã');

    fireEvent.change(screen.getByLabelText('Novo comentário'), { target: { value: 'x'.repeat(5_001) } });

    expect(screen.getByLabelText('Novo comentário')).toHaveValue('x'.repeat(5_001));
    expect(screen.getByRole('alert')).toHaveTextContent('Passou do limite');
    expect(screen.getByRole('button', { name: 'Comentar' })).toBeDisabled();
  });

  it('Esc com rascunho na caixa não chega ao sheet (não fecha nem perde o texto)', async () => {
    const chegou = vi.fn();
    document.addEventListener('keydown', chegou);
    try {
      montar();
      await screen.findByText('Peça chega amanhã');
      const caixa = screen.getByLabelText('Novo comentário');

      fireEvent.keyDown(caixa, { key: 'Escape' });
      expect(chegou).toHaveBeenCalledTimes(1);
      fireEvent.change(caixa, { target: { value: 'rascunho' } });
      fireEvent.keyDown(caixa, { key: 'Escape' });
      expect(chegou).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener('keydown', chegou);
    }
  });

  it('avisa quem monta o sheet que há rascunho, e quando deixa de haver', async () => {
    const onRascunho = vi.fn();
    renderWithProviders(<ComentariosDoRegistro alvo="ordem_servico" registroId="OS1" podeComentar ehCliente={false} onRascunho={onRascunho} />, { withRouter: false });
    await screen.findByText('Peça chega amanhã');

    fireEvent.change(screen.getByLabelText('Novo comentário'), { target: { value: 'meio escrito' } });
    expect(onRascunho).toHaveBeenLastCalledWith(true);
    fireEvent.change(screen.getByLabelText('Novo comentário'), { target: { value: '' } });
    expect(onRascunho).toHaveBeenLastCalledWith(false);
  });

  it('editar troca o texto e salva', async () => {
    api.listar.mockResolvedValue([comentario({ id: 'MEU', comentario: 'primeira versão', editavel_ate: daqui(10), editavel_por_ms: 10 * 60_000 })]);
    montar();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText('Editar comentário'), { target: { value: 'segunda versão' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(api.editar).toHaveBeenCalledWith('ordem_servico', 'OS1', 'MEU', 'segunda versão'));
  });

  it('excluir pede confirmação', async () => {
    api.listar.mockResolvedValue([comentario({ id: 'MEU', editavel_ate: daqui(10), editavel_por_ms: 10 * 60_000 })]);
    const original = window.confirm;
    window.confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    try {
      montar();
      const excluir = await screen.findByRole('button', { name: 'Excluir' });

      fireEvent.click(excluir);
      expect(api.excluir).not.toHaveBeenCalled();
      fireEvent.click(excluir);
      await waitFor(() => expect(api.excluir).toHaveBeenCalledWith('ordem_servico', 'OS1', 'MEU'));
    } finally {
      window.confirm = original;
    }
  });

  it('lista que falha diz que falhou e deixa tentar de novo', async () => {
    // Erro HTTP (403/404/500) não repete sozinho: aparece logo, com o botão
    api.listar.mockRejectedValueOnce({ response: { status: 500 } });
    montar();

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Peça chega amanhã')).toBeInTheDocument();
  });
});
