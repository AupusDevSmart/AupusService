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
const lista = () => ({
  itens: [] as unknown[],
  paginacao: { onBuscar: vi.fn(), carregarMais: vi.fn(), temMais: false, carregando: false },
  carregando: false,
  erro: false,
});
const hook = {
  anomalias: lista(),
  planos: lista(),
  solicitacoes: lista(),
  guardar: vi.fn(),
  gerarTarefasDoPlano: vi.fn().mockResolvedValue([]),
  resolverOrigem: vi.fn(),
};
const usado = vi.fn();

vi.mock('../hooks/useOrigemDados', () => ({
  useOrigemDados: (tipo: string) => {
    usado(tipo);
    return hook;
  },
}));

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
    hook.anomalias = lista();
    hook.planos = lista();
    hook.solicitacoes = lista();
  });

  // SN-69: toda OS tem origem — não há "manual" para escolher
  it('oferece só anomalia, plano e solicitação', () => {
    renderWithProviders(<ComEstado inicial={{ tipo: 'ANOMALIA' }} onValor={vi.fn()} onLocal={vi.fn()} />);

    for (const rotulo of ['Anomalia', 'Plano', 'Solicitação']) expect(screen.getAllByRole('button', { name: new RegExp(`^${rotulo}`) }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Manual/i })).toBeNull();
  });

  it('anomalia pré-selecionada é escolhida como no clique: planta, unidade, local e ativo', async () => {
    hook.resolverOrigem.mockImplementation(async () => {
      hook.anomalias.itens = [anomalia];
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
    // Fica guardada para o resumo, mesmo fora das páginas carregadas (SN-77)
    expect(hook.guardar).toHaveBeenCalledWith('ANOMALIA', anomalia);
    // Só a lista do tipo escolhido busca
    expect(usado).toHaveBeenLastCalledWith('ANOMALIA');
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
      hook.planos.itens = [plano];
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
