import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { useUserStore } from '@/store/useUserStore';
import type { Permissao } from '@/types/dtos/usuarios-dto';
import { FeatureWrapper } from './FeatureWrapper';

const comPermissoes = (...permissoes: Permissao[]) =>
  useUserStore.setState({
    user: { id: 'u1', nome: 'Técnico', role: 'operador', all_permissions: permissoes } as never,
    acessivel: permissoes,
  });

/**
 * A rota protegida por permissão. Antes, quem não podia era jogado de volta ao
 * painel sem explicação; agora vê que a tela existe e por que não abre.
 */
describe('FeatureWrapper', () => {
  beforeEach(() => comPermissoes('dashboard.view'));

  it('com a permissão, mostra a tela', () => {
    comPermissoes('manutencao.view');
    renderWithProviders(
      <FeatureWrapper feature="manutencao.view">
        <p>Instruções</p>
      </FeatureWrapper>,
    );
    expect(screen.getByText('Instruções')).toBeInTheDocument();
  });

  it('qualquer uma das permissões basta (ver ou gerenciar)', () => {
    comPermissoes('manutencao.manage');
    renderWithProviders(
      <FeatureWrapper feature={['manutencao.view', 'manutencao.manage']}>
        <p>Instruções</p>
      </FeatureWrapper>,
    );
    expect(screen.getByText('Instruções')).toBeInTheDocument();
  });

  it('sem a permissão, diz que não tem acesso em vez de sumir com a pessoa', () => {
    renderWithProviders(
      <FeatureWrapper feature="usuarios.view">
        <p>Usuários</p>
      </FeatureWrapper>,
    );
    expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sem acesso a esta tela' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao painel' })).toHaveAttribute('href', '/dashboard');
  });
});
