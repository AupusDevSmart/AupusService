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

/** SN-58: o passo de leitura — digitar o valor, a faixa ao lado, explicar o desvio */
describe('OQueFoiFeito: leituras', () => {
  beforeEach(() => vi.clearAllMocks());

  const comLeitura = (valorLido: number | null = null, observacoes: string | null = null) =>
    montarProgresso(
      [{ id: 'V1', nome_snapshot: 'Medir inversor', status: 'PENDENTE', ordem: 1 }],
      [
        {
          id: 'L1',
          atividade: 'Medir inversor: Tensão CC',
          obrigatoria: true,
          concluida: valorLido !== null,
          tarefa_os_id: 'V1',
          ordem: 1,
          tipo: 'LEITURA',
          unidade: 'V',
          valor_minimo: 580,
          valor_maximo: 620,
          valor_lido: valorLido,
          observacoes,
        },
      ],
    );

  function ComLeitura({ editavel = true, valorLido = null as number | null, observacoes = null as string | null }) {
    const [p, setP] = useState<ProgressoDaExecucao>(() => comLeitura(valorLido, observacoes));
    return <OQueFoiFeito osId="OS1" progresso={p} editavel={editavel} onChange={setP} />;
  }

  const campo = () => screen.getByRole('textbox', { name: /^Tensão CC/ });
  const botaoFeita = () => screen.getByRole('button', { name: /Marcar "Medir inversor" como feita/ });

  it('mostra unidade e faixa ao lado do campo; sem valor, a tarefa espera', () => {
    render(<ComLeitura />);

    expect(screen.getByText('faixa 580 a 620 V')).toBeInTheDocument();
    expect(botaoFeita()).toBeDisabled();
  });

  it('digitar o valor (com vírgula) grava ao sair do campo e libera a tarefa', async () => {
    render(<ComLeitura />);

    fireEvent.change(campo(), { target: { value: '601,25' } });
    fireEvent.blur(campo());

    expect(api.atualizarChecklist).toHaveBeenCalledWith('OS1', [{ id: 'L1', valor_lido: 601.25 }]);
    await waitFor(() => expect(botaoFeita()).toBeEnabled());
    expect(screen.queryByText('Fora da faixa')).toBeNull();
  });

  it('fora da faixa: marca, pede a observação e segura a tarefa até explicar', async () => {
    render(<ComLeitura />);

    fireEvent.change(campo(), { target: { value: '650' } });
    fireEvent.blur(campo());

    expect(await screen.findByText('Fora da faixa')).toBeInTheDocument();
    expect(botaoFeita()).toBeDisabled();
    expect(screen.getByText(/Explique na observação a leitura fora da faixa/)).toBeInTheDocument();

    const observacao = screen.getByRole('textbox', { name: /Observação da leitura fora da faixa/ });
    fireEvent.change(observacao, { target: { value: 'String 3 com conector oxidado' } });
    fireEvent.blur(observacao);

    expect(api.atualizarChecklist).toHaveBeenLastCalledWith('OS1', [{ id: 'L1', observacoes: 'String 3 com conector oxidado' }]);
    await waitFor(() => expect(botaoFeita()).toBeEnabled());
  });

  it('texto que não é número não grava e avisa', () => {
    render(<ComLeitura />);

    fireEvent.change(campo(), { target: { value: '12V' } });
    fireEvent.blur(campo());

    expect(api.atualizarChecklist).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/vírgula e até 4 casas/);
  });

  // Revisão do SN-58: o campo mostrava 1234 como "1.234", e sair dele regravava 1,234
  it('sair do campo sem mexer não grava, mesmo com leitura acima de mil', () => {
    render(<ComLeitura valorLido={1234} />);

    expect(campo()).toHaveValue('1234');
    fireEvent.focus(campo());
    fireEvent.blur(campo());

    expect(api.atualizarChecklist).not.toHaveBeenCalled();
  });

  it('erro ao salvar desfaz só o que aquele pedido mudou', async () => {
    api.atualizarChecklist.mockRejectedValueOnce(new Error('rede'));
    render(<ComLeitura />);

    fireEvent.change(campo(), { target: { value: '601' } });
    fireEvent.blur(campo());

    await waitFor(() => expect(campo()).toHaveValue(''));
    expect(botaoFeita()).toBeDisabled();
  });

  it('apagar o valor desmarca a leitura (manda null)', () => {
    render(<ComLeitura valorLido={600} />);

    fireEvent.change(campo(), { target: { value: '' } });
    fireEvent.blur(campo());

    expect(api.atualizarChecklist).toHaveBeenCalledWith('OS1', [{ id: 'L1', valor_lido: null }]);
  });

  it('na leitura do registro: o valor com unidade, a faixa, o selo e a observação', () => {
    render(<ComLeitura editavel={false} valorLido={650} observacoes="Conector oxidado" />);

    expect(screen.getByText('650 V')).toBeInTheDocument();
    expect(screen.getByText('(faixa 580 a 620 V)')).toBeInTheDocument();
    expect(screen.getByText('Fora da faixa')).toBeInTheDocument();
    expect(screen.getByText('Obs.: Conector oxidado')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
