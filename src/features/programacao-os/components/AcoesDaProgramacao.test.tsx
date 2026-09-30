import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AcoesDaProgramacao } from './AcoesDaProgramacao';

/**
 * As ações da programação no topo do sheet (visualizar e editar), com as mesmas
 * regras das guardas do backend (programacao-os.service).
 */
const botoes = () => screen.queryAllByRole('button').map((b) => b.textContent?.trim());

const programacao = (status: string, statusOS?: string) => ({
  status,
  ordem_servico: statusOS ? { id: 'os-1', status: statusOS } : null,
});

describe('AcoesDaProgramacao', () => {
  it.each([
    ['PENDENTE sem OS', programacao('PENDENTE'), ['Aprovar', 'Editar', 'Cancelar', 'Excluir']],
    ['APROVADA com OS pendente', programacao('APROVADA', 'PENDENTE'), ['Abrir OS', 'Cancelar']],
    ['APROVADA com OS em execução', programacao('APROVADA', 'EM_EXECUCAO'), ['Abrir OS']],
    ['CANCELADA com OS', programacao('CANCELADA', 'CANCELADA'), ['Abrir OS']],
    ['FINALIZADA', programacao('FINALIZADA', 'FINALIZADA'), ['Abrir OS']],
  ])('%s oferece %j', (_nome, p, esperado) => {
    render(<AcoesDaProgramacao programacao={p} modo="view" onAcao={() => {}} />);

    expect(botoes()).toEqual(esperado);
  });

  it('no editar não oferece Editar', () => {
    render(<AcoesDaProgramacao programacao={programacao('PENDENTE')} modo="edit" onAcao={() => {}} />);

    expect(botoes()).toEqual(['Aprovar', 'Cancelar', 'Excluir']);
  });

  it('cancelada sem OS diz que não há ação', () => {
    render(<AcoesDaProgramacao programacao={programacao('CANCELADA')} modo="view" onAcao={() => {}} />);

    expect(botoes()).toEqual([]);
    expect(screen.getByText(/nenhuma ação disponível/)).toBeInTheDocument();
  });

  it('esconde a ação sem a permissão dela', () => {
    render(
      <AcoesDaProgramacao
        programacao={programacao('PENDENTE')}
        modo="view"
        temPermissao={(perm) => perm !== 'programacao_os.aprovar'}
        onAcao={() => {}}
      />,
    );

    expect(botoes()).toEqual(['Editar', 'Cancelar', 'Excluir']);
  });

  it('com alteração não salva, desabilita as ações e avisa', () => {
    render(
      <AcoesDaProgramacao
        programacao={programacao('PENDENTE')}
        modo="edit"
        alteracoesPendentes
        onAcao={() => {}}
      />,
    );

    for (const botao of screen.getAllByRole('button')) expect(botao).toBeDisabled();
    expect(screen.getByText(/salve as alterações antes/i)).toBeInTheDocument();
  });

  it('clicar escolhe a ação', () => {
    const onAcao = vi.fn();
    render(<AcoesDaProgramacao programacao={programacao('PENDENTE')} modo="view" onAcao={onAcao} />);

    fireEvent.click(screen.getByRole('button', { name: /Aprovar/ }));

    expect(onAcao).toHaveBeenCalledWith('aprovar');
  });
});
