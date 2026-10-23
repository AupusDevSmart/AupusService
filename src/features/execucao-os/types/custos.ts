// src/features/execucao-os/types/custos.ts

/**
 * O custo da OS aberto (SN-93), como a API o monta (`resumo-do-custo.ts` no
 * backend). O sheet e o PDF leem daqui, e o custo real gravado na OS sai da
 * mesma conta: a tela não refaz conta de custo.
 *
 * Decisões do usuário (21/out/2026): o custo real é o apurado (horas × valor/hora,
 * material consumido, os outros custos conferidos no Executar e os não
 * previstos); ao lado, cada instrução com o valor dela e o total das feitas.
 */

export type NaturezaDoOutroCusto = 'INSTRUMENTO' | 'MAQUINARIO' | 'VEICULO' | 'TERCEIRO' | 'DESPESA_CAMPO' | 'OUTRO';

export type LinhaDaNatureza = 'MAO_DE_OBRA' | 'MATERIAL' | NaturezaDoOutroCusto | 'NAO_PREVISTO' | 'ADICIONAIS';

/** A natureza do não previsto lançado na tela, na ordem do quadro */
export const NATUREZAS_DOS_OUTROS_CUSTOS: { value: NaturezaDoOutroCusto; label: string }[] = [
  { value: 'VEICULO', label: 'Veículo' },
  { value: 'DESPESA_CAMPO', label: 'Despesa de campo' },
  { value: 'INSTRUMENTO', label: 'Instrumento' },
  { value: 'MAQUINARIO', label: 'Maquinário' },
  { value: 'TERCEIRO', label: 'Terceiro' },
  { value: 'OUTRO', label: 'Outro' },
];

export interface ResumoDoCusto {
  /** O previsto do que entra no real (na OS finalizada antes do SN-93, só mão de obra e material) */
  previsto: number;
  real: number;
  orcamento_previsto: number | null;
  /** O orçamento aprovado menos o previsto pelas linhas: o ajuste da aprovação */
  ajuste_do_orcamento: number;
  /** OS finalizada antes do SN-93: os outros custos aparecem pelo previsto, fora do total */
  outros_fora_do_total: boolean;
  /** `real` null: a natureza fica fora do total */
  naturezas: { natureza: LinhaDaNatureza; rotulo: string; previsto: number; real: number | null }[];
  equipe: {
    nome: string;
    especialidade: string;
    horas_previstas: number;
    horas_trabalhadas: number | null;
    valor_hora: number | null;
    previsto: number;
    real: number;
  }[];
  materiais: {
    descricao: string;
    unidade: string;
    quantidade_planejada: number;
    quantidade_consumida: number | null;
    custo_unitario: number | null;
    previsto: number;
    real: number;
  }[];
  outros: {
    descricao: string;
    natureza: NaturezaDoOutroCusto;
    rotulo: string;
    previsto: number;
    /** null = não conferido */
    real: number | null;
    /** O que entrou no real: o conferido, ou o previsto quando não foi conferido; null = fora do total */
    no_real: number | null;
    conferido: boolean;
    nao_previsto: boolean;
  }[];
  instrucoes: {
    codigo: string | null;
    nome: string | null;
    equipamento: string | null;
    status: string;
    feita: boolean;
    valor: number | null;
    valor_original: number | null;
    ajustado: boolean;
    /** Linha de antes do SN-93: o valor é o do cadastro de hoje */
    do_cadastro_hoje: boolean;
  }[];
  instrucoes_total: number;
  instrucoes_feitas: number;
  instrucoes_feitas_total: number;
  /** O que a conta não pôde fechar (sem valor/hora, não conferido, OS antiga) */
  pendencias: string[];
}

/** Um outro custo no Executar e na correção depois dele (PATCH :id/outros-custos) */
export interface OutroCustoPedido {
  /** O item que já está na OS; sem ele, um não previsto novo */
  id?: string;
  descricao?: string;
  natureza?: NaturezaDoOutroCusto;
  valor_real: number;
}
