import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import type { OrigemOSValue } from './origem-selector';

/**
 * O atalho "Programar" (anomalia, solicitação, plano do equipamento) abre a
 * programação com `value.preSelecao`. A escolha tem de passar pela MESMA função
 * do clique — é ela que preenche planta, unidade, local e ativo —, e origem que
 * não pode ser usada tem de dizer por quê.
 */
const hook = {
  loading: false,
  anomaliasDisponiveis: [] as unknown[],
  planosDisponiveis: [] as unknown[],
  solicitacoesDisponiveis: [] as unknown[],
  carregarAnomalias: vi.fn().mockResolvedValue([]),
  carregarPlanos: vi.fn().mockResolvedValue([]),
  carregarSolicitacoes: vi.fn().mockResolvedValue([]),
  gerarTarefasDoPlano: vi.fn().mockResolvedValue([]),
  resolverOrigem: vi.fn(),
};

vi.mock('../hooks/useOrigemDados', () => ({ useOrigemDados: () => hook }));

// importado depois do mock
const { OrigemOSSelector } = await import('./OrigemOSSelector');

const anomalia = {
  id: 'ANOM0000000000000000000001',
  descricao: 'Vazamento no mancal',
  local: 'Casa de máquinas',
  ativo: 'Motor 3',
  prioridade: 'ALTA',
  status: 'REGISTRADA',
  plantaId: 'PLANTA00000000000000000001',
  unidadeId: 'UNIDADE0000000000000000001',
};

const plano = {
  id: 'PLANO000000000000000000001',
  nome: 'Plano do Motor 3',
  categoria: 'Motor',
  totalTarefas: 4,
  plantaId: 'PLANTA00000000000000000001',
  equipamentoNome: 'Motor 3',
};

function ComEstado({ inicial, onValor, onLocal }: {
  inicial: OrigemOSValue;
  onValor: (v: OrigemOSValue) => void;
  onLocal: (local: string, ativo: string) => void;
}) {
  const [valor, setValor] = useState<OrigemOSValue>(inicial);
  return (
    <OrigemOSSelector
      value={valor}
      onChange={(v) => { setValor(v); onValor(v); }}
      onLocalAtivoChange={onLocal}
    />
  );
}

describe('OrigemOSSelector — pré-seleção do atalho', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.anomaliasDisponiveis = [];
    hook.planosDisponiveis = [];
  });

  it('anomalia pré-selecionada é escolhida como no clique: planta, unidade, local e ativo', async () => {
    hook.resolverOrigem.mockImplementation(async () => {
      hook.anomaliasDisponiveis = [anomalia];
      return { item: anomalia };
    });
    const onValor = vi.fn();
    const onLocal = vi.fn();

    renderWithProviders(
      <ComEstado
        inicial={{ tipo: 'ANOMALIA', preSelecao: { tipo: 'ANOMALIA', id: anomalia.id } }}
        onValor={onValor}
        onLocal={onLocal}
      />,
    );

    await waitFor(() => expect(onValor).toHaveBeenCalled());
    const ultimo = onValor.mock.calls.at(-1)![0] as OrigemOSValue;
    expect(ultimo).toMatchObject({
      tipo: 'ANOMALIA',
      anomaliaId: anomalia.id,
      plantaId: anomalia.plantaId,
      unidadeId: anomalia.unidadeId,
    });
    expect(ultimo.preSelecao).toBeUndefined();
    expect(onLocal).toHaveBeenCalledWith('Casa de máquinas', 'Motor 3');
    expect(hook.resolverOrigem).toHaveBeenCalledWith('ANOMALIA', anomalia.id);
  });

  it('origem que não pode ser usada mostra o motivo e não seleciona nada', async () => {
    hook.resolverOrigem.mockResolvedValue({ motivo: 'A anomalia está programada e não pode ser programada agora.' });
    const onValor = vi.fn();

    renderWithProviders(
      <ComEstado
        inicial={{ tipo: 'ANOMALIA', preSelecao: { tipo: 'ANOMALIA', id: anomalia.id } }}
        onValor={onValor}
        onLocal={vi.fn()}
      />,
    );

    expect(await screen.findByText(/está programada e não pode ser programada agora/)).toBeInTheDocument();
    const ultimo = onValor.mock.calls.at(-1)?.[0] as OrigemOSValue | undefined;
    expect(ultimo?.anomaliaId).toBeUndefined();
    expect(ultimo?.preSelecao).toBeUndefined();
  });

  it('plano pré-selecionado abre direto na escolha das tarefas', async () => {
    hook.resolverOrigem.mockImplementation(async () => {
      hook.planosDisponiveis = [plano];
      return { item: plano };
    });
    const onValor = vi.fn();

    renderWithProviders(
      <ComEstado
        inicial={{ tipo: 'PLANO_MANUTENCAO', preSelecao: { tipo: 'PLANO_MANUTENCAO', id: plano.id } }}
        onValor={onValor}
        onLocal={vi.fn()}
      />,
    );

    await waitFor(() => expect(hook.gerarTarefasDoPlano).toHaveBeenCalledWith(plano.id));
    const ultimo = onValor.mock.calls.at(-1)![0] as OrigemOSValue;
    expect(ultimo).toMatchObject({ tipo: 'PLANO_MANUTENCAO', planoId: plano.id, tarefasSelecionadas: [] });
  });
});
