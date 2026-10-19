import { StrictMode } from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { useUserStore } from '@/store/useUserStore';
import { reiniciarSessaoAtualizada, useSessaoAtualizada } from './useSessaoAtualizada';

/**
 * As permissões do login ficavam congeladas no navegador: a permissão que
 * nasceu depois (manutencao.view, no sync-rbac do SN-32) deixava a tela de
 * instruções em "Sem acesso" até sair e entrar de novo.
 */
function Sessao({ logado }: { logado: boolean }) {
  useSessaoAtualizada(logado);
  return null;
}

const montar = (logado = true) =>
  render(
    <StrictMode>
      <Sessao logado={logado} />
    </StrictMode>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
  reiniciarSessaoAtualizada();
  useUserStore.setState({ user: { id: 'u1', nome: 'Admin' } as never, acessivel: ['dashboard.view'], plantasVinculadas: [] });
});

describe('useSessaoAtualizada', () => {
  it('relê o usuário uma vez por carga e troca as permissões guardadas pelas de agora', async () => {
    const me = vi.spyOn(AuthService, 'getCurrentUser').mockResolvedValue({ id: 'u1', nome: 'Admin', all_permissions: ['manutencao.view'] } as never);

    montar();

    await waitFor(() => expect(useUserStore.getState().hasPermission('manutencao.view')).toBe(true));
    expect(useUserStore.getState().hasPermission('dashboard.view')).toBe(false);
    // StrictMode monta duas vezes; a carga relê uma só
    expect(me).toHaveBeenCalledTimes(1);
  });

  it('sem sessão, não pede', () => {
    const me = vi.spyOn(AuthService, 'getCurrentUser');
    montar(false);
    expect(me).not.toHaveBeenCalled();
  });

  it('falhou (rede): mantém o que havia e tenta de novo na próxima montagem', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const me = vi.spyOn(AuthService, 'getCurrentUser').mockRejectedValueOnce(new Error('rede'));

    const { unmount } = montar();
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(useUserStore.getState().hasPermission('dashboard.view')).toBe(true);
    unmount();

    me.mockResolvedValue({ id: 'u1', all_permissions: ['manutencao.view'] } as never);
    montar();
    await waitFor(() => expect(useUserStore.getState().hasPermission('manutencao.view')).toBe(true));
  });
});
