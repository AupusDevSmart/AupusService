import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResumoDoCusto } from '@/features/execucao-os/types/custos';
import { linhasDosOutrosCustos, type LinhaDeOutroCusto } from '@/features/execucao-os/utils/outros-custos';
import type { OSDoSheet } from './SecoesDeLeitura';

const registrarOutrosCustos = vi.fn();
vi.mock('@/services/execucao-os.service', () => ({ execucaoOSApi: { registrarOutrosCustos: (...a: unknown[]) => registrarOutrosCustos(...a) } }));
const toast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ toast: (...a: unknown[]) => toast(...a) }));

const { OutrosCustosDaOS } = await import('./OutrosCustosDaOS');

const itens_orcamento = [{ id: 'I1', descricao: 'Veículo: Picape 4x4', valor: 1316, natureza: 'VEICULO' as const }];
const outroDoResumo = (mudar: Partial<ResumoDoCusto['outros'][number]> = {}): ResumoDoCusto['outros'][number] => ({
  descricao: 'Veículo: Picape 4x4',
  natureza: 'VEICULO',
  rotulo: 'Veículo',
  previsto: 1316,
  real: null,
  no_real: 1316,
  conferido: false,
  nao_previsto: false,
  ...mudar,
});
const os = (status: string, outros = [outroDoResumo()]): OSDoSheet =>
  ({ id: 'OS1', status, statusExecucao: status, itens_orcamento, custos: { outros } }) as unknown as OSDoSheet;

/** Em execução: o rascunho vive no sheet; aqui, um dono mínimo */
function EmExecucao({ onLinhas }: { onLinhas: (l: LinhaDeOutroCusto[]) => void }) {
  const [linhas, setLinhas] = useState(() => linhasDosOutrosCustos(itens_orcamento));
  onLinhas(linhas);
  return (
    <OutrosCustosDaOS os={os('EM_EXECUCAO')} status="EM_EXECUCAO" rascunho={linhas} onRascunho={setLinhas} podeConferir podeCorrigir onCorrigido={vi.fn()} />
  );
}

/**
 * Os outros custos ao lado do previsto (07/nov/2026): em execução, conferidos
 * aqui e gravados ao concluir; depois, corrigidos aqui (antes, num botão do
 * quadro de custos, que dizia "não conferido" de um valor que estava na tela).
 */
describe('OutrosCustosDaOS', () => {
  beforeEach(() => {
    registrarOutrosCustos.mockReset().mockResolvedValue(undefined);
    toast.mockReset();
  });

  it('em execução: o previsto ao lado, o real começa nele e se corrige no rascunho', () => {
    let linhas: LinhaDeOutroCusto[] = [];
    render(<EmExecucao onLinhas={(l) => (linhas = l)} />);

    expect(screen.getByText(/previsto R\$\s*1\.316,00/)).toBeInTheDocument();
    expect(screen.getByText(/Gravam ao concluir a execução/)).toBeInTheDocument();
    const campo = screen.getByLabelText('Quanto custou: Veículo: Picape 4x4');
    expect(campo).toHaveValue('1.316,00');
    fireEvent.change(campo, { target: { value: '1402,5' } });
    fireEvent.blur(campo);

    expect(linhas[0].valor).toBe(1402.5);
    // Nada grava antes de concluir
    expect(registrarOutrosCustos).not.toHaveBeenCalled();
  });

  it('em execução, para quem só olha: o previsto, e que o real é conferido ao concluir', () => {
    render(<OutrosCustosDaOS os={os('EM_EXECUCAO')} status="EM_EXECUCAO" rascunho={null} onRascunho={vi.fn()} podeConferir={false} podeCorrigir={false} onCorrigido={vi.fn()} />);
    expect(screen.getByText(/conferido ao concluir/)).toBeInTheDocument();
    expect(screen.queryByText(/não conferido/)).toBeNull();
  });

  it('depois de executar: o conferido, e corrigir grava a lista inteira e relê a OS', async () => {
    const onCorrigido = vi.fn().mockResolvedValue(undefined);
    render(
      <OutrosCustosDaOS
        os={os('AUDITADA', [outroDoResumo({ real: 1316, conferido: true })])}
        status="AUDITADA"
        rascunho={null}
        onRascunho={vi.fn()}
        podeConferir={false}
        podeCorrigir
        onCorrigido={onCorrigido}
      />,
    );
    expect(screen.getByText('R$ 1.316,00', { selector: 'span' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Corrigir/ }));
    const campo = screen.getByLabelText('Quanto custou: Veículo: Picape 4x4');
    fireEvent.change(campo, { target: { value: '1402,5' } });
    fireEvent.blur(campo);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar outros custos' }));

    await waitFor(() => expect(onCorrigido).toHaveBeenCalled());
    expect(registrarOutrosCustos).toHaveBeenCalledWith('OS1', [{ id: 'I1', valor_real: 1402.5 }]);
  });

  it('gravou e a releitura falhou: não diz que não salvou', async () => {
    const onCorrigido = vi.fn().mockRejectedValue(new Error('rede'));
    render(<OutrosCustosDaOS os={os('EXECUTADA')} status="EXECUTADA" rascunho={null} onRascunho={vi.fn()} podeConferir={false} podeCorrigir onCorrigido={onCorrigido} />);
    fireEvent.click(screen.getByRole('button', { name: /Corrigir/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar outros custos' }));

    await waitFor(() => expect(onCorrigido).toHaveBeenCalled());
    const titulos = () => toast.mock.calls.map((c) => (c[0] as { title: string }).title);
    await waitFor(() => expect(titulos()).toContain('Salvo, mas a OS não foi relida'));
    expect(titulos()).not.toContain('Não foi possível salvar os outros custos');
  });

  it('finalizada (selada) não corrige; o cliente, sem o resumo de custos, não vê a seção', () => {
    const { unmount } = render(
      <OutrosCustosDaOS os={os('FINALIZADA')} status="FINALIZADA" rascunho={null} onRascunho={vi.fn()} podeConferir={false} podeCorrigir onCorrigido={vi.fn()} />,
    );
    expect(screen.queryByRole('button', { name: /Corrigir/ })).toBeNull();
    unmount();

    const doCliente = { ...os('EXECUTADA'), custos: undefined } as unknown as OSDoSheet;
    const { container } = render(
      <OutrosCustosDaOS os={doCliente} status="EXECUTADA" rascunho={null} onRascunho={vi.fn()} podeConferir={false} podeCorrigir={false} onCorrigido={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
