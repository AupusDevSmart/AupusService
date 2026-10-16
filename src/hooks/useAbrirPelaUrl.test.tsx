import { StrictMode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastErro = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastErro(...args) } }));

const { useAbrirPelaUrl } = await import('./useAbrirPelaUrl');

const ID = 'cmmmc3rto00132fu4nrdd6al9';
let irPara: (para: string) => void = () => {};

function Pagina({ abrir }: { abrir: (id: string) => Promise<unknown> }) {
  useAbrirPelaUrl('anomaliaId', abrir);
  const local = useLocation();
  irPara = useNavigate();
  return <p data-testid="local">{local.pathname + local.search}</p>;
}

const montar = (rota: string, abrir: (id: string) => Promise<unknown>) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[rota]}>
        <Pagina abrir={abrir} />
      </MemoryRouter>
    </StrictMode>,
  );

/** É por aqui que a notificação abre a anomalia e a solicitação (SN-47). */
describe('useAbrirPelaUrl', () => {
  beforeEach(() => vi.clearAllMocks());

  it('abre o id do link uma vez só (StrictMode) e tira o parâmetro da URL, mantendo os outros', async () => {
    const abrir = vi.fn().mockResolvedValue(undefined);
    montar(`/anomalias?anomaliaId=%20${ID}%20&aba=2`, abrir);

    await waitFor(() => expect(screen.getByTestId('local')).toHaveTextContent('/anomalias?aba=2'));
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(abrir).toHaveBeenCalledWith(ID);
  });

  it('o mesmo link de novo, depois, abre de novo', async () => {
    const abrir = vi.fn().mockResolvedValue(undefined);
    montar(`/anomalias?anomaliaId=${ID}`, abrir);
    await waitFor(() => expect(screen.getByTestId('local')).toHaveTextContent(/^\/anomalias$/));

    act(() => irPara(`/anomalias?anomaliaId=${ID}`));

    await waitFor(() => expect(abrir).toHaveBeenCalledTimes(2));
  });

  it('sem o parâmetro não abre nada', () => {
    const abrir = vi.fn().mockResolvedValue(undefined);
    montar('/anomalias', abrir);

    expect(abrir).not.toHaveBeenCalled();
  });

  // O id vai para o caminho da API: "../usuarios/<id>" buscaria outra coisa com o token de quem clicou
  it('id fora do formato não vira chamada e avisa que o link é inválido', async () => {
    const abrir = vi.fn().mockResolvedValue(undefined);
    montar('/anomalias?anomaliaId=..%2Fusuarios%2Fk6g72ojagrl415bsak6y68qi96', abrir);

    await waitFor(() => expect(toastErro).toHaveBeenCalledWith('Link inválido', expect.anything()));
    expect(abrir).not.toHaveBeenCalled();
  });

  it('erro da API (fora do escopo, apagado) fica com o aviso do interceptor, sem um segundo toast', async () => {
    const abrir = vi.fn().mockRejectedValue({ response: { status: 404, data: { message: 'Anomalia não encontrada' } } });
    montar(`/anomalias?anomaliaId=${ID}`, abrir);

    await waitFor(() => expect(abrir).toHaveBeenCalled());
    expect(toastErro).not.toHaveBeenCalled();
  });

  it('erro que não veio da API avisa aqui', async () => {
    const abrir = vi.fn().mockRejectedValue(new Error('quebrou ao montar o sheet'));
    montar(`/anomalias?anomaliaId=${ID}`, abrir);

    await waitFor(() =>
      expect(toastErro).toHaveBeenCalledWith('Não foi possível abrir o registro do link', { description: 'quebrou ao montar o sheet' }),
    );
  });
});
