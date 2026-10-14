import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test-utils';
import { useUserStore } from '@/store/useUserStore';
import { profileService } from '@/services/profile.service';
import { AuthService } from '@/services/auth.service';
import { TrocarSenhaForm } from './TrocarSenhaForm';

vi.mock('@/services/profile.service', () => ({ profileService: { changePassword: vi.fn() } }));
vi.mock('@/services/auth.service', () => ({ AuthService: { getCurrentUser: vi.fn(), logout: vi.fn() } }));

const tela = () =>
  renderWithProviders(
    <Routes>
      <Route path="/trocar-senha" element={<TrocarSenhaForm />} />
      <Route path="/dashboard" element={<p>Painel</p>} />
      <Route path="/login" element={<p>Entrar</p>} />
    </Routes>,
    { initialRoute: '/trocar-senha' },
  );

const preencher = async (atual: string, nova: string, confirmar = nova) => {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText('Senha provisória'), atual);
  await usuario.type(screen.getByLabelText('Nova senha'), nova);
  await usuario.type(screen.getByLabelText('Confirmar nova senha'), confirmar);
  await usuario.click(screen.getByRole('button', { name: 'Salvar e entrar' }));
};

/**
 * SN-34: quem entra com a senha provisória só usa o sistema depois de trocá-la.
 * A tela é a única porta: troca e segue para o painel, ou sai.
 */
describe('TrocarSenhaForm', () => {
  beforeEach(() => {
    vi.mocked(profileService.changePassword).mockReset().mockResolvedValue(undefined as never);
    vi.mocked(AuthService.getCurrentUser)
      .mockReset()
      .mockResolvedValue({ id: 'u1', nome: 'Técnico', deve_trocar_senha: false } as never);
    vi.mocked(AuthService.logout).mockReset().mockResolvedValue(undefined as never);
    useUserStore.setState({ user: { id: 'u1', nome: 'Técnico', deve_trocar_senha: true } as never });
  });

  it('troca a senha, atualiza o usuário e entra no painel', async () => {
    tela();
    await preencher('SenhaDoTeste1', 'MinhaSenha9');

    await waitFor(() => expect(screen.getByText('Painel')).toBeInTheDocument());
    expect(profileService.changePassword).toHaveBeenCalledWith('u1', {
      senhaAtual: 'SenhaDoTeste1',
      novaSenha: 'MinhaSenha9',
    });
    expect(useUserStore.getState().user?.deve_trocar_senha).toBe(false);
  });

  it('não aceita repetir a senha provisória', async () => {
    tela();
    await preencher('SenhaDoTeste1', 'SenhaDoTeste1');

    expect(await screen.findByText('A nova senha precisa ser diferente da provisória')).toBeInTheDocument();
    expect(profileService.changePassword).not.toHaveBeenCalled();
  });

  it('a confirmação tem de bater com a nova senha', async () => {
    tela();
    await preencher('SenhaDoTeste1', 'MinhaSenha9', 'OutraSenha9');

    expect(await screen.findByText('As senhas não conferem')).toBeInTheDocument();
    expect(profileService.changePassword).not.toHaveBeenCalled();
  });

  it('senha provisória errada: mostra o motivo e continua na tela', async () => {
    vi.mocked(profileService.changePassword).mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { success: false, error: { message: 'Senha atual incorreta' } } },
    });
    tela();
    await preencher('errada', 'MinhaSenha9');

    expect(await screen.findByText(/Senha atual incorreta/)).toBeInTheDocument();
    expect(screen.queryByText('Painel')).not.toBeInTheDocument();
  });

  it('Sair encerra a sessão e volta para o login', async () => {
    tela();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }));

    await waitFor(() => expect(screen.getByText('Entrar')).toBeInTheDocument());
    expect(AuthService.logout).toHaveBeenCalled();
    expect(useUserStore.getState().user).toBeFalsy();
  });
});
