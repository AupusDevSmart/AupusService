import { useState, type ReactElement } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { renderWithProviders } from '@/test-utils';
import type { AnexoOS } from '@/features/execucao-os/types';
import { montarProgresso, type ProgressoDaExecucao } from '../utils/progresso-da-execucao';

const api = {
  getAnexos: vi.fn().mockResolvedValue([]),
  uploadAnexo: vi.fn().mockResolvedValue({}),
  deleteAnexo: vi.fn().mockResolvedValue(undefined),
  downloadAnexo: vi.fn().mockResolvedValue(new Blob(['x'], { type: 'image/jpeg' })),
  atualizarChecklist: vi.fn().mockResolvedValue(undefined),
  concluirTarefa: vi.fn().mockResolvedValue(undefined),
  reabrirTarefa: vi.fn().mockResolvedValue(undefined),
};
vi.mock('@/services/execucao-os.service', () => ({ execucaoOSApi: api }));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

const { OQueFoiFeito } = await import('./OQueFoiFeito');

/** Com React Query (as fotos vêm da consulta dos anexos) e o tooltip, como na tela. */
const montar = (ui: ReactElement) => renderWithProviders(<TooltipProvider>{ui}</TooltipProvider>, { withRouter: false });

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
    montar(<ComEstado />);

    expect(screen.getByRole('button', { name: /Marcar "Lubrificar mancal" como feita/ })).toBeDisabled();
    expect(screen.getByText(/falta 1 item obrigatório/i)).toBeInTheDocument();
  });

  it('com mais de um obrigatório pendente: "Faltam 2 itens obrigatórios" (era "items")', () => {
    const p = montarProgresso(
      [{ id: 'V1', nome_snapshot: 'Troca de rolamento', status: 'PENDENTE', ordem: 1 }],
      [
        { id: 'C1', atividade: 'Troca de rolamento: Desenergizar', obrigatoria: true, concluida: false, tarefa_os_id: 'V1', ordem: 1 },
        { id: 'C2', atividade: 'Troca de rolamento: Substituir', obrigatoria: true, concluida: false, tarefa_os_id: 'V1', ordem: 2 },
      ],
    );
    montar(<OQueFoiFeito osId="OS1" progresso={p} editavel onChange={vi.fn()} />);

    expect(screen.getByText('Faltam 2 itens obrigatórios.')).toBeInTheDocument();
  });

  it('marcar o item grava na hora e libera a tarefa', async () => {
    montar(<ComEstado />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Limpar o mancal' }));

    expect(api.atualizarChecklist).toHaveBeenCalledWith('OS1', [{ id: 'C1', concluida: true }]);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Marcar "Lubrificar mancal" como feita/ })).toBeEnabled(),
    );
  });

  it('concluir a tarefa chama a API pelo id do vínculo e oferece desfazer', async () => {
    montar(<ComEstado />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Limpar o mancal' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Marcar "Lubrificar mancal" como feita/ })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole('button', { name: /Marcar "Lubrificar mancal" como feita/ }));

    await waitFor(() => expect(api.concluirTarefa).toHaveBeenCalledWith('OS1', 'V1'));
    expect(await screen.findByRole('button', { name: /Desfazer "Lubrificar mancal"/ })).toBeInTheDocument();
  });

  it('mostra o motivo da tarefa não feita', () => {
    montar(<ComEstado />);

    expect(screen.getByText('Chuva forte')).toBeInTheDocument();
  });

  it('não mostra a seção genérica de segurança (itens sem tarefa das OS antigas)', () => {
    montar(<ComEstado />);

    expect(screen.queryByText('Segurança e encerramento')).toBeNull();
    expect(screen.queryByText('Verificar equipamentos de segurança')).toBeNull();
  });

  it('em leitura não tem caixas nem botões', () => {
    montar(<ComEstado editavel={false} />);

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
    montar(<ComLeitura />);

    expect(screen.getByText('faixa 580 a 620 V')).toBeInTheDocument();
    expect(botaoFeita()).toBeDisabled();
  });

  it('digitar o valor (com vírgula) grava ao sair do campo e libera a tarefa', async () => {
    montar(<ComLeitura />);

    fireEvent.change(campo(), { target: { value: '601,25' } });
    fireEvent.blur(campo());

    expect(api.atualizarChecklist).toHaveBeenCalledWith('OS1', [{ id: 'L1', valor_lido: 601.25 }]);
    await waitFor(() => expect(botaoFeita()).toBeEnabled());
    expect(screen.queryByText('Fora da faixa')).toBeNull();
  });

  it('fora da faixa: marca, pede a observação e segura a tarefa até explicar', async () => {
    montar(<ComLeitura />);

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
    montar(<ComLeitura />);

    fireEvent.change(campo(), { target: { value: '12V' } });
    fireEvent.blur(campo());

    expect(api.atualizarChecklist).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/vírgula e até 4 casas/);
  });

  // Revisão do SN-58: o campo mostrava 1234 como "1.234", e sair dele regravava 1,234
  it('sair do campo sem mexer não grava, mesmo com leitura acima de mil', () => {
    montar(<ComLeitura valorLido={1234} />);

    expect(campo()).toHaveValue('1234');
    fireEvent.focus(campo());
    fireEvent.blur(campo());

    expect(api.atualizarChecklist).not.toHaveBeenCalled();
  });

  it('erro ao salvar desfaz só o que aquele pedido mudou', async () => {
    api.atualizarChecklist.mockRejectedValueOnce(new Error('rede'));
    montar(<ComLeitura />);

    fireEvent.change(campo(), { target: { value: '601' } });
    fireEvent.blur(campo());

    await waitFor(() => expect(campo()).toHaveValue(''));
    expect(botaoFeita()).toBeDisabled();
  });

  it('apagar o valor desmarca a leitura (manda null)', () => {
    montar(<ComLeitura valorLido={600} />);

    fireEvent.change(campo(), { target: { value: '' } });
    fireEvent.blur(campo());

    expect(api.atualizarChecklist).toHaveBeenCalledWith('OS1', [{ id: 'L1', valor_lido: null }]);
  });

  it('na leitura do registro: o valor com unidade, a faixa, o selo e a observação', () => {
    montar(<ComLeitura editavel={false} valorLido={650} observacoes="Conector oxidado" />);

    expect(screen.getByText('650 V')).toBeInTheDocument();
    expect(screen.getByText('(faixa 580 a 620 V)')).toBeInTheDocument();
    expect(screen.getByText('Fora da faixa')).toBeInTheDocument();
    expect(screen.getByText('Obs.: Conector oxidado')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});

/** SN-59: a câmera ao lado de cada item e de cada tarefa; o item que exige foto espera a foto */
describe('OQueFoiFeito: fotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAnexos.mockResolvedValue([]);
  });

  const comFotoObrigatoria = () =>
    montarProgresso(
      [{ id: 'V1', nome_snapshot: 'Trocar fusível', status: 'PENDENTE', ordem: 1 }],
      [
        { id: 'F1', atividade: 'Trocar fusível: Fotografar o fusível queimado', obrigatoria: true, concluida: false, tarefa_os_id: 'V1', ordem: 1, exige_foto: true },
        { id: 'F2', atividade: 'Trocar fusível: Limpar o painel', obrigatoria: false, concluida: false, tarefa_os_id: 'V1', ordem: 2 },
      ],
    );

  function ComFotos({ editavel = true }: { editavel?: boolean }) {
    const [p, setP] = useState<ProgressoDaExecucao>(comFotoObrigatoria);
    return <OQueFoiFeito osId="OS1" status="EM_EXECUCAO" progresso={p} editavel={editavel} onChange={setP} />;
  }

  const foto = (dados: Partial<AnexoOS>): AnexoOS => ({
    id: 'A1',
    os_id: 'OS1',
    nome: 'f.jpg',
    nome_original: 'fusivel.jpg',
    tipo: 'FOTO_DURANTE',
    mime_type: 'image/jpeg',
    tamanho: 10,
    caminho_s3: '',
    uploaded_at: '2026-10-16T13:05:00.000Z',
    ...dados,
  });

  it('o item que exige foto não marca sem a foto, e avisa', async () => {
    montar(<ComFotos />);

    expect(await screen.findByText('foto obrigatória')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Fotografar o fusível queimado' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Limpar o painel' })).toBeEnabled();
  });

  it('com a foto do item, ele marca', async () => {
    api.getAnexos.mockResolvedValue([foto({ checklist_item_id: 'F1', tarefa_os_id: 'V1' })]);
    montar(<ComFotos />);

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Fotografar o fusível queimado' })).toBeEnabled());
    expect(screen.queryByText('foto obrigatória')).toBeNull();
  });

  it('documento não conta como foto do item (e se baixa pelo ícone)', async () => {
    api.getAnexos.mockResolvedValue([foto({ checklist_item_id: 'F1', mime_type: 'application/pdf', nome_original: 'laudo.pdf' })]);
    montar(<ComFotos />);

    // Esperar o PDF na tela: carregando, o item também fica travado
    expect(await screen.findByRole('button', { name: 'Baixar laudo.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Fotografar o fusível queimado' })).toBeDisabled();
    expect(screen.getByText('foto obrigatória')).toBeInTheDocument();
  });

  it('enquanto as fotos carregam, o aviso diz isso (não "foto obrigatória")', async () => {
    api.getAnexos.mockReturnValue(new Promise(() => {}));
    montar(<ComFotos />);

    expect(await screen.findByText('carregando fotos')).toBeInTheDocument();
    expect(screen.queryByText('foto obrigatória')).toBeNull();
  });

  it('falha ao carregar as fotos não vira "sem foto": avisa e deixa tentar de novo', async () => {
    api.getAnexos.mockRejectedValueOnce({ response: { status: 500 } });
    montar(<ComFotos />);

    expect(await screen.findByText(/Não foi possível carregar as fotos/)).toBeInTheDocument();
    api.getAnexos.mockResolvedValue([foto({ checklist_item_id: 'F1' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Fotografar o fusível queimado' })).toBeEnabled());
  });

  it('a câmera do item manda a foto presa ao item; a da tarefa, à tarefa', async () => {
    montar(<ComFotos />);
    const arquivo = new File(['x'], 'fusivel.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByTestId('camera-o item Fotografar o fusível queimado'), { target: { files: [arquivo] } });
    await waitFor(() => expect(api.uploadAnexo).toHaveBeenCalledWith('OS1', arquivo, 'FOTO_DURANTE', undefined, { checklist_item_id: 'F1' }));

    fireEvent.change(screen.getByTestId('camera-a tarefa Trocar fusível'), { target: { files: [arquivo] } });
    await waitFor(() => expect(api.uploadAnexo).toHaveBeenLastCalledWith('OS1', arquivo, 'FOTO_DURANTE', undefined, { tarefa_os_id: 'V1' }));
  });

  it('na leitura do registro: as fotos aparecem, sem câmera', async () => {
    api.getAnexos.mockResolvedValue([foto({ checklist_item_id: 'F1', tarefa_os_id: 'V1', mime_type: 'image/heic', nome_original: 'fusivel.heic' })]);
    montar(<ComFotos editavel={false} />);

    expect(await screen.findByRole('button', { name: 'Baixar fusivel.heic' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fotografar/ })).toBeNull();
  });
});
