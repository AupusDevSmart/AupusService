import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConcluirExecucao } from './ConcluirExecucao';

vi.mock('@/features/execucao-os/hooks/usePessoasDaOS', () => ({ usePessoasDaOS: () => ({ data: [], isError: false }) }));

const base = {
  onAbrir: vi.fn(),
  onFechar: vi.fn(),
  onConfirm: vi.fn().mockResolvedValue(undefined),
  entity: { id: 'OS1', status: 'EM_EXECUCAO', tecnicos: [] },
  totalDeTarefas: 3,
  podeInformarValorDaHora: false,
};

/**
 * O fim do sheet da OS em andamento (06/nov/2026): marca-se o que foi feito
 * em cima, e aqui se justifica o que faltou e se conclui, com o botão por último.
 */
describe('ConcluirExecucao', () => {
  it('fechado: diz quantas tarefas faltam e abre o painel ao clicar', () => {
    const onAbrir = vi.fn();
    render(<ConcluirExecucao {...base} onAbrir={onAbrir} aberto={false} tarefasPendentes={[{ id: 'V1', nome: 'Limpeza' }]} />);

    expect(screen.getByText(/Falta 1 tarefa de 3/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Concluir a execução' }));
    expect(onAbrir).toHaveBeenCalled();
  });

  it('aberto: o motivo do que faltou vem antes do resultado, e o botão de confirmar por último', () => {
    render(<ConcluirExecucao {...base} aberto tarefasPendentes={[{ id: 'V1', nome: 'Limpeza' }]} />);

    const motivo = screen.getByLabelText(/Por que "Limpeza" não foi feita/);
    const resultado = screen.getByLabelText(/Resultado do serviço/);
    // DOCUMENT_POSITION_FOLLOWING: o resultado vem depois do motivo
    expect(motivo.compareDocumentPosition(resultado) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const botoes = screen.getAllByRole('button');
    const confirmar = screen.getByRole('button', { name: /Confirmar execução/ });
    expect(botoes.indexOf(confirmar)).toBe(botoes.length - 2); // só o "Fechar sem concluir" depois
    expect(screen.getByRole('button', { name: 'Fechar sem concluir' })).toBeInTheDocument();
  });

  it('aberto: o quadro de custos vem depois das horas e dos outros custos, logo antes do botão', () => {
    render(
      <ConcluirExecucao {...base} aberto tarefasPendentes={[]} custos={<p>Quadro de custos</p>} />,
    );
    const quadro = screen.getByText('Quadro de custos');
    const horas = screen.getByText('Horas trabalhadas');
    const confirmar = screen.getByRole('button', { name: /Confirmar execução/ });
    expect(horas.compareDocumentPosition(quadro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(quadro.compareDocumentPosition(confirmar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('com tudo feito, não pede motivo', () => {
    render(<ConcluirExecucao {...base} aberto={false} tarefasPendentes={[]} />);
    expect(screen.getByText(/Todas as tarefas estão feitas/)).toBeInTheDocument();
  });
});

describe('ConcluirExecucao com outra ação aberta no topo', () => {
  it('o botão espera, com o motivo: trocar apagaria o que foi digitado lá', () => {
    render(<ConcluirExecucao {...base} aberto={false} tarefasPendentes={[]} bloqueado="Termine ou feche a ação aberta no topo antes de concluir." />);

    expect(screen.getByRole('button', { name: 'Concluir a execução' })).toBeDisabled();
    expect(screen.getByText(/Termine ou feche a ação aberta no topo/)).toBeInTheDocument();
  });
});
