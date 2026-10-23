import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '@/test-utils';
import type { Notificacao, PaginaDeNotificacoes } from '@/services/notificacoes.services';

const api = {
  listar: vi.fn(),
  contarNaoLidas: vi.fn(),
  marcarLida: vi.fn().mockResolvedValue(undefined),
  marcarTodasLidas: vi.fn().mockResolvedValue(2),
  preferencias: vi.fn(),
  salvarPreferencias: vi.fn(),
};
vi.mock('@/services/notificacoes.services', () => ({ notificacoesApi: api }));

const { NotificacoesSheet } = await import('./NotificacoesSheet');

const notificacao = (dados: Partial<Notificacao>): Notificacao => ({
  id: 'N1',
  titulo: 'Programação PRG-2026-001 aguarda aprovação',
  descricao: 'Troca do disjuntor',
  tipo: 'acao',
  link: '/programacao-os?programacaoId=P1',
  lida: false,
  evento: 'programacao.criada',
  created_at: new Date().toISOString(),
  ...dados,
});

const pagina = (data: Notificacao[], total = data.length): PaginaDeNotificacoes => ({
  data,
  pagination: { page: 1, limit: 20, total },
  naoLidas: data.filter((n) => !n.lida).length,
});

function OndeEstou() {
  const local = useLocation();
  return <p data-testid="local">{local.pathname + local.search}</p>;
}

const montar = () =>
  renderWithProviders(
    <TooltipProvider>
      <NotificacoesSheet />
      <OndeEstou />
    </TooltipProvider>,
    { initialRoute: '/dashboard' },
  );

const abrirSheet = async () => fireEvent.click(await screen.findByRole('button', { name: /Notificações/ }));

/**
 * O sino ficou desligado desde o começo do projeto (SN-47): o gatilho estava
 * comentado e nada buscava. Agora mostra quantas não lidas e leva ao registro.
 */
describe('NotificacoesSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.contarNaoLidas.mockResolvedValue(2);
    api.listar.mockResolvedValue(
      pagina([notificacao({}), notificacao({ id: 'N2', titulo: 'OS OSP-2026-0003 executada', link: '/execucao-os?execucaoId=O1' })]),
    );
  });

  it('o sino mostra quantas não lidas', async () => {
    montar();

    expect(await screen.findByRole('button', { name: 'Notificações: 2 não lidas' })).toHaveTextContent('2');
  });

  it('uma só fica no singular', async () => {
    api.contarNaoLidas.mockResolvedValue(1);
    montar();

    expect(await screen.findByRole('button', { name: 'Notificações: 1 não lida' })).toHaveTextContent('1');
  });

  it('sem não lidas, o sino fica sem número', async () => {
    api.contarNaoLidas.mockResolvedValue(0);
    montar();

    await waitFor(() => expect(api.contarNaoLidas).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Notificações' })).toHaveTextContent('');
  });

  it('a partir de 100, mostra 99+', async () => {
    api.contarNaoLidas.mockResolvedValue(140);
    montar();

    expect(await screen.findByRole('button', { name: /140 não lidas/ })).toHaveTextContent('99+');
  });

  it('só busca a lista quando o sheet abre, e abre nas não lidas', async () => {
    montar();
    await waitFor(() => expect(api.contarNaoLidas).toHaveBeenCalled());
    expect(api.listar).not.toHaveBeenCalled();

    await abrirSheet();

    expect(await screen.findByText('OS OSP-2026-0003 executada')).toBeInTheDocument();
    expect(api.listar).toHaveBeenCalledWith({ somenteNaoLidas: true, page: 1, limit: 20 });
    expect(screen.getAllByText('Pede uma ação sua')).toHaveLength(2);
  });

  it('clicar marca como lida e leva ao registro', async () => {
    montar();
    await abrirSheet();

    fireEvent.click(await screen.findByText('OS OSP-2026-0003 executada'));

    await waitFor(() => expect(api.marcarLida).toHaveBeenCalledWith('N2'));
    expect(screen.getByTestId('local')).toHaveTextContent('/execucao-os?execucaoId=O1');
  });

  it('notificação já lida não é marcada de novo', async () => {
    api.listar.mockResolvedValue(pagina([notificacao({ lida: true })]));
    montar();
    await abrirSheet();

    fireEvent.click(await screen.findByText(/aguarda aprovação/));

    expect(api.marcarLida).not.toHaveBeenCalled();
    expect(screen.getByTestId('local')).toHaveTextContent('/programacao-os?programacaoId=P1');
  });

  it('marcar todas chama o servidor e recarrega o número', async () => {
    montar();
    await abrirSheet();
    await screen.findByText('OS OSP-2026-0003 executada');
    api.contarNaoLidas.mockResolvedValue(0);

    fireEvent.click(screen.getByRole('button', { name: /Marcar todas/ }));

    await waitFor(() => expect(api.marcarTodasLidas).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('button', { name: /Marcar todas/ })).not.toBeInTheDocument());
  });

  it('a aba Todas busca sem o filtro', async () => {
    montar();
    await abrirSheet();
    await screen.findByText('OS OSP-2026-0003 executada');

    const todas = screen.getByRole('tab', { name: 'Todas' });
    fireEvent.mouseDown(todas);
    fireEvent.click(todas);

    await waitFor(() => expect(api.listar).toHaveBeenCalledWith({ somenteNaoLidas: false, page: 1, limit: 20 }));
  });

  it('mais de uma página: "Carregar mais" pede a seguinte', async () => {
    api.listar.mockResolvedValueOnce(pagina([notificacao({})], 25));
    api.listar.mockResolvedValueOnce({ ...pagina([notificacao({ id: 'N9', titulo: 'Da segunda página' })], 25), pagination: { page: 2, limit: 20, total: 25 } });
    montar();
    await abrirSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Carregar mais' }));

    expect(await screen.findByText('Da segunda página')).toBeInTheDocument();
    expect(api.listar).toHaveBeenLastCalledWith({ somenteNaoLidas: true, page: 2, limit: 20 });
  });

  it('lista que falha diz que falhou e deixa tentar de novo', async () => {
    api.listar.mockRejectedValueOnce(new Error('rede'));
    montar();
    await abrirSheet();

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('OS OSP-2026-0003 executada')).toBeInTheDocument();
  });

  it('contador que falha não some calado: o sino diz que não atualizou', async () => {
    api.contarNaoLidas.mockRejectedValue(new Error('rede'));
    montar();

    const sino = await screen.findByRole('button', { name: /não foi possível atualizar o número/ });
    fireEvent.focus(sino);

    expect(await screen.findAllByText(/não foi possível atualizar o número/)).not.toHaveLength(0);
  });

  it('com o contador fora do ar, o número da lista vale para o "Marcar todas"', async () => {
    api.contarNaoLidas.mockRejectedValue(new Error('rede'));
    montar();
    await abrirSheet();

    expect(await screen.findByRole('button', { name: /Marcar todas/ })).toBeInTheDocument();
  });

  it('link que não é desta aplicação não navega (só marca como lida)', async () => {
    api.listar.mockResolvedValue(pagina([notificacao({ id: 'N7', titulo: 'Link de fora', link: '//golpe.com/x' })]));
    montar();
    await abrirSheet();

    fireEvent.click(await screen.findByText('Link de fora'));

    await waitFor(() => expect(api.marcarLida).toHaveBeenCalledWith('N7'));
    expect(screen.getByTestId('local')).toHaveTextContent('/dashboard');
  });
});
