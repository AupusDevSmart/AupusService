import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ResumoDoCusto } from '@/features/execucao-os/types/custos';
import { CustosDaOS } from './CustosDaOS';

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
  it('executada: o custo real em destaque, o previsto, a diferença, as naturezas com valor e as instruções', () => {
    render(<CustosDaOS status="EXECUTADA" custos={custos()} />);

    expect(sem(screen.getByText('Custo real').nextElementSibling!.textContent)).toBe('R$ 7.243,14');
    expect(sem(screen.getAllByText('Diferença')[0].nextElementSibling!.textContent)).toBe('+R$ 26,50 (+0,4%)');
    // A natureza sem previsto nem real (material) não ocupa linha
    expect(screen.getAllByText('Mão de obra')[0]).toBeInTheDocument();
    expect(screen.queryByText('Material')).toBeNull();
    // Cada instrução com o equipamento e a situação; o total das feitas
    expect(screen.getByText('Inversor 01 · Feita')).toBeInTheDocument();
    expect(screen.getByText('Inversor 05 · Não feita')).toBeInTheDocument();
    expect(sem(screen.getByText(/^Instruções 1 de 2 feitas/).textContent)).toBe('Instruções 1 de 2 feitas · custo programado das feitas R$ 902,08 de R$ 1.804,16');
    expect(screen.getByText('Custo programado por instrução')).toBeInTheDocument();
    // A correção dos outros custos foi para a seção deles (OutrosCustosDaOS)
    expect(screen.queryByRole('button', { name: /Corrigir/ })).toBeNull();
  });

  it('em execução, com o material da tela: o custo até agora muda a cada registro', () => {
    // A API somou R$ 0 de material (nada registrado quando a OS foi lida); a tela já registrou R$ 120
    const resumo = custos({ naturezas: [...custos().naturezas.slice(0, 1), { natureza: 'MATERIAL', rotulo: 'Material', previsto: 0, real: 0 }, custos().naturezas[2]] });
    const { rerender } = render(<CustosDaOS status="EM_EXECUCAO" custos={resumo} aoVivo={{ material: 120 }} />);

    expect(sem(screen.getByText('Custo até agora').nextElementSibling!.textContent)).toBe('R$ 4.822,50'); // a soma das naturezas da fixture (3.386,50 + 120 + 1.316)
    expect(screen.getByText(/as previstas enquanto vazias/)).toBeInTheDocument();
    // O detalhe repetiria as seções Equipe, Materiais e Outros custos, onde se informa cada um
    expect(screen.queryByText(/O detalhe: cada pessoa/)).toBeNull();
    // A linha do material aparece com o valor da tela
    expect(screen.getByText('Material')).toBeInTheDocument();

    rerender(<CustosDaOS status="EM_EXECUCAO" custos={resumo} aoVivo={{ material: 150 }} />);
    expect(sem(screen.getByText('Custo até agora').nextElementSibling!.textContent)).toBe('R$ 4.852,50');
  });

  it('antes de executar, o real ainda não existe: só o previsto', () => {
    render(<CustosDaOS status="PENDENTE" custos={custos()} />);
    expect(screen.getByText('Custo real (sai no Executar)').nextElementSibling).toHaveTextContent('—');
    expect(screen.getAllByText('Diferença')[0].nextElementSibling).toHaveTextContent('—');
  });

  it('a pendência da conta aparece (sem valor/hora, não conferido)', () => {
    render(
      <CustosDaOS status="EXECUTADA" custos={custos({ pendencias: ['1 outro custo não foi conferido e entra pelo previsto.'] })} />,
    );
    expect(screen.getByText('1 outro custo não foi conferido e entra pelo previsto.')).toBeInTheDocument();
  });

  // Revisão de falha silenciosa: "Veículo R$ 0,00 −100%" e o destaque de uma economia que não houve
  it('a OS finalizada antes do SN-93: os outros custos fora do total, e o previsto comparado é o do real', () => {
    render(
      <CustosDaOS
       
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
       
       
      />,
    );
    expect(screen.getByText('fora do total')).toBeInTheDocument();
    expect(sem(screen.getAllByText('Diferença')[0].nextElementSibling!.textContent)).toBe('+R$ 26,50 (+0,8%)');
    expect(screen.getByText(/os outros custos ficam fora do total nesta OS/)).toBeInTheDocument();
  });

  it('sem resumo (a lista da tabela, que não o traz), não desenha nada', () => {
    const { container } = render(<CustosDaOS status="EXECUTADA" />);
    expect(container).toBeEmptyDOMElement();
  });
});
