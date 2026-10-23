import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import type { RecursosDaProgramacao } from '@/features/programacao-os/utils/recursos-das-instrucoes';

/**
 * As instruções da programação (SN-86): a corretiva nasce com as da anomalia,
 * o planejador acrescenta ou tira, e os recursos planejados acompanham — sem
 * apagar o que foi ajustado nem somar de novo os de uma programação já salva.
 */
const anomalia = vi.fn();
const detalhe = vi.fn();
const catalogo = vi.fn();
const tarefasDoPlano = vi.fn();
const avisos = vi.hoisted(() => ({ erro: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => avisos.erro(...a) } }));
vi.mock('@/services/anomalias.service', () => ({ anomaliasService: { findOne: (...a: unknown[]) => anomalia(...a) } }));
vi.mock('@/services/tarefas.services', () => ({ tarefasApi: { findByPlano: (...a: unknown[]) => tarefasDoPlano(...a) } }));
vi.mock('@/services/instrucoes.services', async (original) => ({
  ...(await original<typeof import('@/services/instrucoes.services')>()),
  instrucoesApi: {
    findOne: (...a: unknown[]) => detalhe(...a),
    listarTodasAtivas: (...a: unknown[]) => catalogo(...a),
  },
}));

const { InstrucoesDaProgramacao } = await import('./InstrucoesDaProgramacao');

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

/** O detalhe de cada instrução: A pede 10 m de cabo a R$ 5; B, um laudo de terceiro de R$ 300; C, 1 eletricista por 2 h */
const DETALHES: Record<string, unknown> = {
  A: { id: 'A', recursos: [{ quantidade: 10, fator_perda: 0, subtotal: 50, recurso: { nome: 'Cabo', categoria: 'MATERIAL', unidade: 'm' } }] },
  B: { id: 'B', recursos: [{ quantidade: 1, subtotal: 300, recurso: { nome: 'Laudo', categoria: 'TERCEIRO' } }] },
  C: { id: 'C', recursos: [{ quantidade: 1, duracao_horas: 2, subtotal: 100, recurso: { nome: 'Eletricista', categoria: 'MAO_DE_OBRA' } }] },
};

const nada = (): RecursosDaProgramacao => ({ materiais: [], ferramentas: [], tecnicos: [], itens_orcamento: [] });

beforeEach(() => {
  anomalia.mockReset().mockResolvedValue({
    anomalias_instrucoes: [
      { instrucao: { id: 'A ', codigo: 'I-A', nome: 'Trocar o cabo' } },
      { instrucao: { id: 'B', codigo: 'I-B', nome: 'Laudo' } },
    ],
  });
  detalhe.mockReset().mockImplementation((id: string) => Promise.resolve(DETALHES[id.trim()]));
  avisos.erro.mockReset();
  tarefasDoPlano.mockReset().mockResolvedValue([
    { id: 't1', instrucao: { id: 'C', codigo: 'I-C', nome: 'Reaperto' } },
    { id: 't2', instrucao: { id: 'C', codigo: 'I-C', nome: 'Reaperto' } },
  ]);
  catalogo.mockReset().mockResolvedValue([
    { id: 'A', codigo: 'I-A', nome: 'Trocar o cabo' },
    { id: 'B', codigo: 'I-B', nome: 'Laudo' },
    { id: 'C', codigo: 'I-C', nome: 'Reaperto' },
  ]);
});

/** O formulário: guarda a lista e os recursos, como o BaseForm */
interface PropsDoFormulario {
  inicial?: string[];
  recursosIniciais?: RecursosDaProgramacao;
  cadastro: boolean;
  /** Falso: o sheet em "Visualizar" (o BaseForm não passa o editar) */
  editavel?: boolean;
  plano?: { tarefaIds: string[] };
}

function Formulario({ inicial, recursosIniciais, cadastro, editavel = true, plano }: PropsDoFormulario) {
  const [valor, setValor] = useState<string[] | undefined>(inicial);
  const [recursos, setRecursos] = useState<RecursosDaProgramacao>(recursosIniciais ?? nada());
  return (
    <>
      <InstrucoesDaProgramacao
        tipo={plano ? 'PLANO_MANUTENCAO' : 'ANOMALIA'}
        anomaliaId={plano ? undefined : 'an1'}
        planoId={plano ? 'p1' : undefined}
        tarefaIds={plano?.tarefaIds}
        valor={valor}
        onValor={editavel ? setValor : undefined}
        semearDaOrigem={cadastro}
        gravadas={cadastro ? undefined : (inicial ?? []).map((id) => ({ id, nome: `Gravada ${id}` }))}
        recursos={recursos}
        onRecursos={editavel ? setRecursos : undefined}
      />
      <output data-testid="valor">{valor === undefined ? 'indefinido' : valor.join(',')}</output>
      <output data-testid="recursos">{JSON.stringify(recursos)}</output>
    </>
  );
}

const montar = (props: PropsDoFormulario) =>
  renderWithProviders(<Formulario {...props} />, { withRouter: false, withQueryClient: false });
const recursos = () => JSON.parse(screen.getByTestId('recursos').textContent ?? '{}') as RecursosDaProgramacao;

describe('instruções da programação', () => {
  it('no cadastro, nasce com as da anomalia e os recursos delas, com o custo', async () => {
    montar({ cadastro: true });

    await waitFor(() => expect(screen.getByTestId('valor')).toHaveTextContent('A,B'));
    await waitFor(() => expect(recursos().itens_orcamento).toEqual([{ descricao: 'Terceiro: Laudo', valor: 300, natureza: 'TERCEIRO' }]));
    expect(recursos().materiais).toEqual([{ descricao: 'Cabo', quantidade_planejada: 10, unidade: 'm', custo_unitario: 5 }]);
    expect(screen.getByText('I-A - Trocar o cabo')).toBeInTheDocument();
  });

  it('tirar uma instrução tira os recursos dela e deixa os das outras', async () => {
    const usuario = userEvent.setup();
    montar({ cadastro: true });
    await waitFor(() => expect(recursos().itens_orcamento).toHaveLength(1));

    const [, tirarB] = screen.getAllByTitle('Desvincular');
    await usuario.click(tirarB);

    await waitFor(() => expect(recursos().itens_orcamento).toEqual([]));
    expect(screen.getByTestId('valor')).toHaveTextContent(/^A$/);
    expect(recursos().materiais).toHaveLength(1);
  });

  it('acrescentar pelo catálogo soma os recursos da nova; a que já está na lista não é oferecida', async () => {
    const usuario = userEvent.setup();
    montar({ cadastro: true });
    await waitFor(() => expect(recursos().materiais).toHaveLength(1));

    await usuario.click(screen.getByRole('button', { name: 'Acrescentar instrução' }));
    await usuario.click(await screen.findByRole('combobox'));
    expect(screen.queryByRole('option', { name: 'I-A - Trocar o cabo' })).not.toBeInTheDocument();
    await usuario.click(screen.getByRole('option', { name: 'I-C - Reaperto' }));

    await waitFor(() => expect(screen.getByTestId('valor')).toHaveTextContent('A,B,C'));
    await waitFor(() => expect(recursos().tecnicos).toEqual([{ nome: '', especialidade: 'Eletricista', horas_estimadas: 2, custo_hora: 50 }]));
  });

  it('na edição, vale a lista gravada: nada se semeia nem se soma ao abrir', async () => {
    const gravados: RecursosDaProgramacao = { ...nada(), materiais: [{ descricao: 'Cabo', quantidade_planejada: 12, unidade: 'm', custo_unitario: 5 }] };
    montar({ cadastro: false, inicial: ['A'], recursosIniciais: gravados });

    expect(await screen.findByText('I-A - Trocar o cabo')).toBeInTheDocument();
    // A gravada fica: a da anomalia (B) não volta, e o cabo ajustado para 12 não vira 22
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByTestId('valor')).toHaveTextContent(/^A$/);
    expect(recursos()).toEqual(gravados);
    expect(detalhe).not.toHaveBeenCalled();
  });

  it('a anomalia que não se lê não vira lista vazia: avisa, trava a lista, e sem ela o servidor põe as da origem', async () => {
    anomalia.mockReset().mockRejectedValue(Object.assign(new Error('Erro interno'), { response: { status: 500 } }));
    montar({ cadastro: true, inicial: ['X'] });

    await waitFor(() => expect(screen.getByTestId('valor')).toHaveTextContent('indefinido'));
    expect(avisos.erro).toHaveBeenCalledWith('Não foi possível ler as instruções da origem', expect.anything());
    expect(screen.getByText(/Não foi possível ler as instruções da origem/)).toBeInTheDocument();
    // Acrescentar trocaria, calado, as da origem pela acrescentada
    expect(screen.queryByRole('button', { name: 'Acrescentar instrução' })).not.toBeInTheDocument();
  });

  it('a origem excluída (404) fica calada', async () => {
    anomalia.mockReset().mockRejectedValue(Object.assign(new Error('Não encontrada'), { response: { status: 404 } }));
    montar({ cadastro: false, inicial: [] });
    await waitFor(() => expect(anomalia).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(avisos.erro).not.toHaveBeenCalled();
  });

  it('aberta em Visualizar e passada a Editar sem remontar: a primeira troca soma os recursos', async () => {
    const gravados: RecursosDaProgramacao = { ...nada(), materiais: [{ descricao: 'Cabo', quantidade_planejada: 10, unidade: 'm', custo_unitario: 5 }] };
    const usuario = userEvent.setup();
    const { rerender } = montar({ cadastro: false, inicial: ['A'], recursosIniciais: gravados, editavel: false });
    expect(await screen.findByText('I-A - Trocar o cabo')).toBeInTheDocument();

    rerender(<Formulario cadastro={false} inicial={['A']} recursosIniciais={gravados} editavel />);
    await usuario.click(await screen.findByRole('button', { name: 'Acrescentar instrução' }));
    await usuario.click(await screen.findByRole('combobox'));
    await usuario.click(screen.getByRole('option', { name: 'I-B - Laudo' }));

    // Antes, a lista com B virava a base calada e o laudo nunca entrava
    await waitFor(() => expect(recursos().itens_orcamento).toEqual([{ descricao: 'Terceiro: Laudo', valor: 300, natureza: 'TERCEIRO' }]));
    expect(recursos().materiais).toEqual(gravados.materiais);
  });

  it('marcar outra tarefa do plano não ressemeia a lista (a avulsa acrescentada fica)', async () => {
    const usuario = userEvent.setup();
    const { rerender } = montar({ cadastro: true, plano: { tarefaIds: ['t1'] } });
    await waitFor(() => expect(screen.getByText('I-C - Reaperto')).toBeInTheDocument());

    await usuario.click(screen.getByRole('button', { name: 'Acrescentar instrução' }));
    await usuario.click(await screen.findByRole('combobox'));
    await usuario.click(screen.getByRole('option', { name: 'I-A - Trocar o cabo' }));
    await waitFor(() => expect(screen.getByTestId('valor')).toHaveTextContent(/^A$/));

    rerender(<Formulario cadastro plano={{ tarefaIds: ['t1', 't2'] }} />);
    await waitFor(() => expect(tarefasDoPlano).toHaveBeenCalledTimes(2));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByTestId('valor')).toHaveTextContent(/^A$/);
  });
});
