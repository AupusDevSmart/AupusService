import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TarefasEValoresDoPlano } from './TarefasEValoresDoPlano';
import type { PlanoManutencaoApiResponse, TarefaResumoDto } from '@/services/planos-manutencao.services';

/**
 * As tarefas do plano com o valor de cada uma e o total, no sheet. O que
 * enganaria quem le se quebrasse: "sem tarefas" no lugar de "nao carregou",
 * tarefa sem instrucao parecendo custo zero, e total sem o aviso de item sem preco.
 */
const tarefa = (id: string, nome: string, extra: Partial<TarefaResumoDto> = {}): TarefaResumoDto => ({
  id,
  tag: `TAR-${id}`,
  nome,
  ordem: 1,
  criticidade: 3,
  ativo: true,
  ...extra,
});

const plano = (tarefas: TarefaResumoDto[] | undefined, extra: Partial<PlanoManutencaoApiResponse> = {}) =>
  ({ id: 'p1', nome: 'Plano', versao: '1.0', equipamento_id: '', tarefas, ...extra }) as PlanoManutencaoApiResponse;

// toLocaleString em pt-BR separa "R$" do numero com espaco nao quebravel; \s casa os dois
const moeda = (texto: string) => texto.replace(/\s/g, ' ');

describe('TarefasEValoresDoPlano', () => {
  it('lista cada tarefa com a frequencia, a instrucao e o valor, e o total do plano', () => {
    render(
      <TarefasEValoresDoPlano
        plano={plano(
          [
            tarefa('1', 'Inspecao visual', {
              frequencia: 'MENSAL',
              instrucao_codigo: 'INST-001',
              instrucao_nome: 'Inspecionar painel',
              valor: 1500.5,
            }),
            tarefa('2', 'Limpeza dos modulos', { frequencia: 'PERSONALIZADA', frequencia_personalizada: 45, valor: 800 }),
          ],
          { valor_total: 2300.5, tarefas_sem_preco: 0 },
        )}
      />,
    );

    expect(screen.getByText('Inspecao visual')).toBeInTheDocument();
    expect(screen.getByText(/INST-001 - Inspecionar painel/)).toBeInTheDocument();
    expect(screen.getByText('Mensal')).toBeInTheDocument();
    expect(screen.getByText('A cada 45 dias')).toBeInTheDocument();
    expect(moeda(screen.getByText(/1\.500,50/).textContent ?? '')).toBe('R$ 1.500,50');
    expect(screen.getByText('Valor total do plano')).toBeInTheDocument();
    expect(moeda(screen.getByText(/2\.300,50/).textContent ?? '')).toBe('R$ 2.300,50');
    expect(screen.queryByText(/pode estar abaixo do custo/i)).not.toBeInTheDocument();
  });

  it('tarefa sem instrucao mostra traco, nao zero', () => {
    render(<TarefasEValoresDoPlano plano={plano([tarefa('1', 'Sem instrucao', { valor: null })], { valor_total: 0 })} />);

    expect(screen.getByText('Sem instrução', { exact: false })).toBeInTheDocument();
    expect(screen.getByTitle(/não tem instrução vinculada/i)).toHaveTextContent('-');
  });

  it('avisa que o total pode estar abaixo do custo quando ha item sem preco', () => {
    render(
      <TarefasEValoresDoPlano
        plano={plano([tarefa('1', 'Com item sem preco', { valor: 100, valor_sem_preco: true })], {
          valor_total: 100,
          tarefas_sem_preco: 1,
        })}
      />,
    );

    expect(screen.getByText('item sem preço')).toBeInTheDocument();
    expect(screen.getByText(/1 tarefa tem instrução com item sem preço/i)).toBeInTheDocument();
  });

  it('tarefa inativa aparece marcada e fica fora da contagem das ativas', () => {
    render(
      <TarefasEValoresDoPlano
        plano={plano([tarefa('1', 'Ativa', { valor: 10 }), tarefa('2', 'Parada', { valor: 20, ativo: false })], {
          valor_total: 10,
        })}
      />,
    );

    expect(screen.getByText(/inativa/)).toBeInTheDocument();
    expect(screen.getByText(/das 1 tarefa ativa/i)).toBeInTheDocument();
  });

  it('plano sem tarefas diz que nao ha', () => {
    render(<TarefasEValoresDoPlano plano={plano([])} />);

    expect(screen.getByText(/ainda não tem tarefas/i)).toBeInTheDocument();
  });

  it('sem a lista (a busca falhou) nao diz que o plano esta vazio', () => {
    render(<TarefasEValoresDoPlano plano={plano(undefined)} />);

    expect(screen.getByText(/não foi possível carregar as tarefas/i)).toBeInTheDocument();
    expect(screen.queryByText(/ainda não tem tarefas/i)).not.toBeInTheDocument();
  });
});
