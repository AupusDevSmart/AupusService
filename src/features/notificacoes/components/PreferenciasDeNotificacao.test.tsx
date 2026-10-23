import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import type { PreferenciaDeNotificacao } from '@/services/notificacoes.services';

const api = {
  preferencias: vi.fn(),
  salvarPreferencias: vi.fn(),
};
vi.mock('@/services/notificacoes.services', () => ({ notificacoesApi: api }));

const { PreferenciasDeNotificacao } = await import('./PreferenciasDeNotificacao');

const PREFERENCIAS: PreferenciaDeNotificacao[] = [
  { evento: 'programacao.criada', grupo: 'Programações', nome: 'Programação para aprovar', acao: true, email: true },
  { evento: 'programacao.cancelada', grupo: 'Programações', nome: 'Programação cancelada', acao: false, email: false },
  { evento: 'os.executada', grupo: 'Ordens de serviço', nome: 'OS executada (para auditar)', acao: true, email: true },
];

describe('PreferenciasDeNotificacao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.preferencias.mockResolvedValue(PREFERENCIAS);
  });

  it('mostra os eventos por grupo, com o e-mail de cada um', async () => {
    renderWithProviders(<PreferenciasDeNotificacao />, { withRouter: false });

    expect(await screen.findByRole('heading', { name: 'Programações' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ordens de serviço' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Programação para aprovar/ })).toBeChecked();
    expect(screen.getByRole('switch', { name: /Programação cancelada/ })).not.toBeChecked();
  });

  it('a chave grava só aquele evento, e a tela fica com o que o servidor devolveu', async () => {
    api.salvarPreferencias.mockResolvedValue(
      PREFERENCIAS.map((p) => (p.evento === 'programacao.cancelada' ? { ...p, email: true } : p)),
    );
    renderWithProviders(<PreferenciasDeNotificacao />, { withRouter: false });

    fireEvent.click(await screen.findByRole('switch', { name: /Programação cancelada/ }));

    await waitFor(() => expect(api.salvarPreferencias).toHaveBeenCalledWith([{ evento: 'programacao.cancelada', email: true }]));
    await waitFor(() => expect(screen.getByRole('switch', { name: /Programação cancelada/ })).toBeChecked());
  });

  it('gravação que falha deixa a chave como estava', async () => {
    api.salvarPreferencias.mockRejectedValue(new Error('rede'));
    renderWithProviders(<PreferenciasDeNotificacao />, { withRouter: false });

    const chave = await screen.findByRole('switch', { name: /Programação cancelada/ });
    fireEvent.click(chave);

    await waitFor(() => expect(api.salvarPreferencias).toHaveBeenCalled());
    await waitFor(() => expect(chave).not.toBeDisabled());
    expect(chave).not.toBeChecked();
  });

  it('falha ao carregar diz que falhou e deixa tentar de novo', async () => {
    api.preferencias.mockRejectedValueOnce(new Error('rede'));
    renderWithProviders(<PreferenciasDeNotificacao />, { withRouter: false });

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByRole('switch', { name: /Programação para aprovar/ })).toBeInTheDocument();
  });
});
