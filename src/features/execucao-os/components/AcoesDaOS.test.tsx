import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AcoesDaOS } from './AcoesDaOS';
import { formatarData } from '../config/labels';

/**
 * O antigo StatusTransitionHelper listava transicoes como texto, sem botao, e
 * sempre para PENDENTE. As acoes aqui espelham as guardas do backend
 * (execucao-os.service).
 */
const botoes = () => screen.queryAllByRole('button').map((b) => b.textContent?.trim());

describe('AcoesDaOS', () => {
  it.each([
    ['PENDENTE', ['Iniciar', 'Cancelar']],
    ['EM_EXECUCAO', ['Pausar', 'Executar', 'Cancelar']],
    ['PAUSADA', ['Retomar', 'Executar', 'Cancelar']],
    ['EXECUTADA', ['Auditar', 'Cancelar']],
    ['AUDITADA', ['Finalizar', 'Reabrir', 'Cancelar']],
    ['FINALIZADA', []],
    ['CANCELADA', []],
  ])('em %s oferece %j', (status, esperado) => {
    render(<AcoesDaOS status={status} onAcao={() => {}} />);

    expect(botoes()).toEqual(esperado);
  });

  it('OS encerrada diz que nao ha acao, em vez de ficar vazia', () => {
    render(<AcoesDaOS status="FINALIZADA" onAcao={() => {}} />);

    expect(screen.getByText(/nenhuma ação disponível/)).toBeInTheDocument();
  });

  it('clicar escolhe a acao', () => {
    const onAcao = vi.fn();
    render(<AcoesDaOS status="AUDITADA" onAcao={onAcao} />);

    fireEvent.click(screen.getByRole('button', { name: /Reabrir/ }));

    expect(onAcao).toHaveBeenCalledWith('reabrir');
  });
});

describe('formatarData', () => {
  it('data pura fica no dia que ela diz, sem voltar um dia pelo UTC', () => {
    expect(formatarData('2026-09-29')).toBe('29/09/2026');
  });
});
