import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { montarProgresso, type ProgressoDaExecucao } from '../utils/progresso-da-execucao';

const api = {
  atualizarChecklist: vi.fn().mockResolvedValue(undefined),
  concluirTarefa: vi.fn().mockResolvedValue(undefined),
  reabrirTarefa: vi.fn().mockResolvedValue(undefined),
};
vi.mock('@/services/execucao-os.service', () => ({ execucaoOSApi: api }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

const { OQueFoiFeito } = await import('./OQueFoiFeito');

/**
 * Onde a equipe marca o que fez durante a execução. Antes não existia: nenhuma
 * tarefa era concluída pela tela, e o plano nunca registrava a execução.
 */
const inicial = () =>
  montarProgresso(
    [
      { id: 'V1', nome_snapshot: 'Lubrificar mancal', status: 'PENDENTE', ordem: 1 },
      { id: 'V2', nome_snapshot: 'Inspeção visual', status: 'CANCELADA', observacoes: 'Chuva forte', ordem: 2 },
    ],
    [
      { id: 'C1', atividade: 'Lubrificar mancal: Limpar o mancal', obrigatoria: true, concluida: false, tarefa_os_id: 'V1', ordem: 1 },
      { id: 'C9', atividade: 'Verificar equipamentos de segurança', obrigatoria: false, concluida: false, tarefa_os_id: null, ordem: 9 },
    ],
  );

function ComEstado({ editavel = true }: { editavel?: boolean }) {
  const [p, setP] = useState<ProgressoDaExecucao>(inicial);
  return <OQueFoiFeito osId="OS1" progresso={p} editavel={editavel} onChange={setP} />;
}

describe('OQueFoiFeito', () => {
  beforeEach(() => vi.clearAllMocks());

  it('tarefa com obrigatório pendente não pode ser marcada como feita', () => {
    render(<ComEstado />);

    expect(screen.getByRole('button', { name: /Marcar "Lubrificar mancal" como feita/ })).toBeDisabled();
    expect(screen.getByText(/falta 1 item obrigatório/i)).toBeInTheDocument();
  });

  it('marcar o item grava na hora e libera a tarefa', async () => {
    render(<ComEstado />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Limpar o mancal' }));

    expect(api.atualizarChecklist).toHaveBeenCalledWith('OS1', [{ id: 'C1', concluida: true }]);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Marcar "Lubrificar mancal" como feita/ })).toBeEnabled(),
    );
  });

  it('concluir a tarefa chama a API pelo id do vínculo e oferece desfazer', async () => {
    render(<ComEstado />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Limpar o mancal' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Marcar "Lubrificar mancal" como feita/ })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole('button', { name: /Marcar "Lubrificar mancal" como feita/ }));

    await waitFor(() => expect(api.concluirTarefa).toHaveBeenCalledWith('OS1', 'V1'));
    expect(await screen.findByRole('button', { name: /Desfazer "Lubrificar mancal"/ })).toBeInTheDocument();
  });

  it('mostra o motivo da tarefa não feita', () => {
    render(<ComEstado />);

    expect(screen.getByText('Chuva forte')).toBeInTheDocument();
  });

  it('não mostra a seção genérica de segurança (itens sem tarefa das OS antigas)', () => {
    render(<ComEstado />);

    expect(screen.queryByText('Segurança e encerramento')).toBeNull();
    expect(screen.queryByText('Verificar equipamentos de segurança')).toBeNull();
  });

  it('em leitura não tem caixas nem botões', () => {
    render(<ComEstado editavel={false} />);

    expect(screen.queryAllByRole('checkbox').every((c) => (c as HTMLInputElement).disabled)).toBe(true);
    expect(screen.queryByRole('button', { name: /como feita/ })).toBeNull();
  });
});
