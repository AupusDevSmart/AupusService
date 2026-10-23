import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResumoDoCusto } from '@/features/execucao-os/types/custos';
import { CustosDaOS } from './CustosDaOS';

const registrarOutrosCustos = vi.fn();
vi.mock('@/services/execucao-os.service', () => ({ execucaoOSApi: { registrarOutrosCustos: (...a: unknown[]) => registrarOutrosCustos(...a) } }));
const toast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({ toast: (...a: unknown[]) => toast(...a) }));

/** A seção de custos do sheet da OS (SN-93): o real contra o previsto, por natureza e por instrução */
const custos = (mudar: Partial<ResumoDoCusto> = {}): ResumoDoCusto => ({
  previsto: 7216.64,
  real: 7243.14,
  orcamento_previsto: 7216.64,
  ajuste_do_orcamento: 0,
  outros_fora_do_total: false,
  naturezas: [
    { natureza: 'MAO_DE_OBRA', rotulo: 'Mão de obra', previsto: 3360, real: 3386.5 },
    { natureza: 'MATERIAL', rotulo: 'Material', previsto: 0, real: 0 },
    { natureza: 'VEICULO', rotulo: 'Veículo', previsto: 1316, real: 1316 },
  ],
  equipe: [{ nome: 'André Lima', especialidade: 'Técnico', horas_previstas: 8, horas_trabalhadas: 7, valor_hora: 78, previsto: 624, real: 546 }],
  materiais: [],
  outros: [{ descricao: 'Veículo: Picape 4x4', natureza: 'VEICULO', rotulo: 'Veículo', previsto: 1316, real: 1316, no_real: 1316, conferido: true, nao_previsto: false }],
  instrucoes: [
    { codigo: 'INV-03', nome: 'Termografia e reaperto', equipamento: 'Inversor 01', status: 'CONCLUIDA', feita: true, valor: 902.08, valor_original: 902.08, ajustado: false, do_cadastro_hoje: false },
    { codigo: 'INV-03', nome: 'Termografia e reaperto', equipamento: 'Inversor 05', status: 'CANCELADA', feita: false, valor: 902.08, valor_original: 902.08, ajustado: false, do_cadastro_hoje: false },
  ],
  instrucoes_total: 1804.16,
  instrucoes_feitas: 1,
  instrucoes_feitas_total: 902.08,
  pendencias: [],
  ...mudar,
});

const sem = (t: string | null) => (t ?? '').replace(/\s/g, ' ');

describe('CustosDaOS', () => {
  beforeEach(() => {
    registrarOutrosCustos.mockReset().mockResolvedValue(undefined);
    toast.mockReset();
  });

  it('executada: o custo real em destaque, o previsto, a diferença, as naturezas com valor e as instruções', () => {
    render(<CustosDaOS osId="OS1" status="EXECUTADA" custos={custos()} podeCorrigir={false} onCorrigido={vi.fn()} />);

    expect(sem(screen.getByText('Custo real').nextElementSibling!.textContent)).toBe('R$ 7.243,14');
    expect(sem(screen.getAllByText('Diferença')[0].nextElementSibling!.textContent)).toBe('+R$ 26,50 (+0,4%)');
    // A natureza sem previsto nem real (material) não ocupa linha
    expect(screen.getAllByText('Mão de obra')[0]).toBeInTheDocument();
    expect(screen.queryByText('Material')).toBeNull();
    // Cada instrução com o equipamento e a situação; o total das feitas
    expect(screen.getByText('Inversor 01 · Feita')).toBeInTheDocument();
    expect(screen.getByText('Inversor 05 · Não feita')).toBeInTheDocument();
    expect(sem(screen.getByText(/^Instruções 1 de 2 feitas/).textContent)).toBe('Instruções 1 de 2 feitas · R$ 902,08 de R$ 1.804,16');
    expect(screen.queryByRole('button', { name: /Corrigir outros custos/ })).toBeNull();
  });

  it('antes de executar, o real ainda não existe: só o previsto', () => {
    render(<CustosDaOS osId="OS1" status="PENDENTE" custos={custos()} podeCorrigir onCorrigido={vi.fn()} />);
    expect(screen.getByText('Custo real (sai no Executar)').nextElementSibling).toHaveTextContent('—');
    expect(screen.getAllByText('Diferença')[0].nextElementSibling).toHaveTextContent('—');
    // PENDENTE ainda não tem o que corrigir
    expect(screen.queryByRole('button', { name: /Corrigir outros custos/ })).toBeNull();
  });

  it('a pendência da conta aparece (sem valor/hora, não conferido)', () => {
    render(
      <CustosDaOS osId="OS1" status="EXECUTADA" custos={custos({ pendencias: ['1 outro custo não foi conferido e entra pelo previsto.'] })} podeCorrigir={false} onCorrigido={vi.fn()} />,
    );
    expect(screen.getByText('1 outro custo não foi conferido e entra pelo previsto.')).toBeInTheDocument();
  });

  it('corrigir os outros custos grava a lista inteira e relê a OS', async () => {
    const onCorrigido = vi.fn().mockResolvedValue(undefined);
    render(
      <CustosDaOS
        osId="OS1"
        status="AUDITADA"
        custos={custos()}
        itensOrcamento={[{ id: 'I1', descricao: 'Veículo: Picape 4x4', valor: 1316, natureza: 'VEICULO', valor_real: 1316 }]}
        podeCorrigir
        onCorrigido={onCorrigido}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Corrigir outros custos/ }));
    const campo = screen.getByLabelText('Quanto custou: Veículo: Picape 4x4');
    fireEvent.change(campo, { target: { value: '1402,5' } });
    fireEvent.blur(campo);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar outros custos' }));

    await waitFor(() => expect(onCorrigido).toHaveBeenCalled());
    expect(registrarOutrosCustos).toHaveBeenCalledWith('OS1', [{ id: 'I1', valor_real: 1402.5 }]);
  });

  // Revisão de falha silenciosa: corrigida com o Executar aberto, a lista dele sobrescrevia a correção
  it('em execução não se corrige: quem confere é o Executar', () => {
    render(<CustosDaOS osId="OS1" status="EM_EXECUCAO" custos={custos()} podeCorrigir onCorrigido={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Corrigir outros custos/ })).toBeNull();
  });

  it('gravou e a releitura falhou: não diz que não salvou', async () => {
    const onCorrigido = vi.fn().mockRejectedValue(new Error('rede'));
    render(
      <CustosDaOS
        osId="OS1"
        status="EXECUTADA"
        custos={custos()}
        itensOrcamento={[{ id: 'I1', descricao: 'Veículo: Picape 4x4', valor: 1316, natureza: 'VEICULO', valor_real: 1316 }]}
        podeCorrigir
        onCorrigido={onCorrigido}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Corrigir outros custos/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar outros custos' }));
    await waitFor(() => expect(onCorrigido).toHaveBeenCalled());
    const titulos = toast.mock.calls.map((c) => (c[0] as { title: string }).title);
    await waitFor(() => expect(titulos).toContain('Salvo, mas a OS não foi relida'));
    expect(titulos).not.toContain('Não foi possível salvar os outros custos');
  });

  // Revisão de falha silenciosa: "Veículo R$ 0,00 −100%" e o destaque de uma economia que não houve
  it('a OS finalizada antes do SN-93: os outros custos fora do total, e o previsto comparado é o do real', () => {
    render(
      <CustosDaOS
        osId="OS1"
        status="FINALIZADA"
        custos={custos({
          previsto: 3360,
          real: 3386.5,
          outros_fora_do_total: true,
          naturezas: [
            { natureza: 'MAO_DE_OBRA', rotulo: 'Mão de obra', previsto: 3360, real: 3386.5 },
            { natureza: 'VEICULO', rotulo: 'Veículo', previsto: 1316, real: null },
          ],
          outros: [{ descricao: 'Veículo: Picape 4x4', natureza: 'VEICULO', rotulo: 'Veículo', previsto: 1316, real: null, no_real: null, conferido: false, nao_previsto: false }],
        })}
        podeCorrigir={false}
        onCorrigido={vi.fn()}
      />,
    );
    expect(screen.getByText('fora do total')).toBeInTheDocument();
    expect(sem(screen.getAllByText('Diferença')[0].nextElementSibling!.textContent)).toBe('+R$ 26,50 (+0,8%)');
    expect(screen.getByText(/os outros custos ficam fora do total nesta OS/)).toBeInTheDocument();
  });

  it('sem resumo (a lista da tabela, que não o traz), não desenha nada', () => {
    const { container } = render(<CustosDaOS osId="OS1" status="EXECUTADA" podeCorrigir onCorrigido={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
