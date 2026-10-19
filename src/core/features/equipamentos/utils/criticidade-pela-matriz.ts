import { rotuloDaCriticidade } from '@/core/features/equipamentos/config/criticidade';

/**
 * Criticidade do equipamento pela matriz impacto × probabilidade (SN-64).
 *
 * O impacto pesa o dobro: nível = (2 × impacto + probabilidade) ÷ 3,
 * arredondado (decisão do usuário, 19/out/2026). A tabela é a mesma do backend
 * (aupus-service-api, `core/modules/equipamentos/criticidade-pela-matriz.ts`),
 * que é quem decide ao gravar; aqui ela só sugere na tela. Os testes dos dois
 * lados conferem célula por célula.
 */
export const MATRIZ_DE_CRITICIDADE: readonly (readonly number[])[] = [
  //  probabilidade 1  2  3  4  5
  /* impacto 1 */ [1, 1, 2, 2, 2],
  /* impacto 2 */ [2, 2, 2, 3, 3],
  /* impacto 3 */ [2, 3, 3, 3, 4],
  /* impacto 4 */ [3, 3, 4, 4, 4],
  /* impacto 5 */ [4, 4, 4, 5, 5],
];

export interface NotaDaEscala {
  nota: number;
  rotulo: string;
  descricao: string;
}

/** O que a falha deste equipamento causa. */
export const IMPACTOS: readonly NotaDaEscala[] = [
  { nota: 1, rotulo: 'Desprezível', descricao: 'Não afeta a operação' },
  { nota: 2, rotulo: 'Menor', descricao: 'Afeta pouco, e há como contornar' },
  { nota: 3, rotulo: 'Moderado', descricao: 'Reduz a operação ou a geração' },
  { nota: 4, rotulo: 'Grave', descricao: 'Para parte da instalação, ou o reparo custa caro' },
  { nota: 5, rotulo: 'Crítico', descricao: 'Para a instalação, ou põe pessoas ou o ambiente em risco' },
];

/** Com que frequência ele falha. */
export const PROBABILIDADES: readonly NotaDaEscala[] = [
  { nota: 1, rotulo: 'Rara', descricao: 'Menos de uma vez em 5 anos' },
  { nota: 2, rotulo: 'Improvável', descricao: 'Uma vez a cada 2 a 5 anos' },
  { nota: 3, rotulo: 'Ocasional', descricao: 'Cerca de uma vez por ano' },
  { nota: 4, rotulo: 'Provável', descricao: 'Algumas vezes por ano' },
  { nota: 5, rotulo: 'Frequente', descricao: 'Todo mês ou mais' },
];

export const LIMITE_DO_MOTIVO = 1000;

export interface AvaliacaoDaCriticidade {
  criticidade?: string;
  criticidadeImpacto?: number | null;
  criticidadeProbabilidade?: number | null;
  criticidadeMotivo?: string | null;
}

const ehNota = (valor: unknown): valor is number => Number.isInteger(valor) && (valor as number) >= 1 && (valor as number) <= 5;

/** Só os quatro campos da avaliação, de um formulário maior. */
export const soAAvaliacao = (v: AvaliacaoDaCriticidade): AvaliacaoDaCriticidade => ({
  criticidade: v.criticidade,
  criticidadeImpacto: v.criticidadeImpacto,
  criticidadeProbabilidade: v.criticidadeProbabilidade,
  criticidadeMotivo: v.criticidadeMotivo,
});

/** O nível que a matriz sugere; null sem as duas notas. */
export function criticidadeSugerida(impacto?: number | null, probabilidade?: number | null): number | null {
  if (!ehNota(impacto) || !ehNota(probabilidade)) return null;
  return MATRIZ_DE_CRITICIDADE[impacto - 1][probabilidade - 1];
}

export function sugeridaDe(valores: AvaliacaoDaCriticidade): string | null {
  const sugerida = criticidadeSugerida(valores.criticidadeImpacto, valores.criticidadeProbabilidade);
  return sugerida === null ? null : String(sugerida);
}

/** O nível escolhido difere do que a matriz sugere (só com as duas notas). */
export function difereDaMatriz(valores: AvaliacaoDaCriticidade): boolean {
  const sugerida = sugeridaDe(valores);
  return sugerida !== null && (valores.criticidade ?? '').trim() !== sugerida;
}

/**
 * Aplica uma mudança no formulário. Ao dar as duas notas, o nível passa a ser
 * o sugerido (é o "aceitar"); quem quiser outro troca o nível depois, e então
 * o motivo é pedido.
 *
 * O nível escolhido fora da matriz não é desfeito por mexer numa nota: era uma
 * decisão com motivo, e voltar calado para a sugestão mudaria a prioridade das
 * OS sem ninguém ver. A sugestão nova aparece ao lado; o nível fica.
 */
export function avaliar(valores: AvaliacaoDaCriticidade, mudanca: Partial<AvaliacaoDaCriticidade>): AvaliacaoDaCriticidade {
  const novo = { ...valores, ...mudanca };
  const mexeuNasNotas = 'criticidadeImpacto' in mudanca || 'criticidadeProbabilidade' in mudanca;
  const sugerida = sugeridaDe(novo);
  if (mexeuNasNotas && sugerida !== null && !difereDaMatriz(valores)) {
    novo.criticidade = sugerida;
    novo.criticidadeMotivo = '';
  }
  return novo;
}

/** A mesma conferência do backend, para avisar antes de salvar. */
export function problemaDaCriticidade(valores: AvaliacaoDaCriticidade): string | null {
  if (ehNota(valores.criticidadeImpacto) !== ehNota(valores.criticidadeProbabilidade)) {
    return 'Informe o impacto e a probabilidade juntos, ou nenhum dos dois.';
  }
  const motivo = valores.criticidadeMotivo?.trim() ?? '';
  if (difereDaMatriz(valores) && !motivo) {
    return `A matriz sugere ${rotuloDaCriticidade(sugeridaDe(valores))}. Para usar outro nível, informe o motivo.`;
  }
  if (motivo.length > LIMITE_DO_MOTIVO) return `O motivo da criticidade tem no máximo ${LIMITE_DO_MOTIVO} caracteres.`;
  return null;
}

/** Os três campos para a API. O motivo é o da diferença: sem ela vai null. */
export function avaliacaoParaApi(valores: AvaliacaoDaCriticidade) {
  return {
    criticidade_impacto: ehNota(valores.criticidadeImpacto) ? valores.criticidadeImpacto : null,
    criticidade_probabilidade: ehNota(valores.criticidadeProbabilidade) ? valores.criticidadeProbabilidade : null,
    criticidade_motivo: difereDaMatriz(valores) ? valores.criticidadeMotivo?.trim() || null : null,
  };
}

/** A avaliação que a API devolve, como o formulário guarda. */
export function avaliacaoDaApi(api: {
  criticidade_impacto?: number | null;
  criticidade_probabilidade?: number | null;
  criticidade_motivo?: string | null;
}): Required<Omit<AvaliacaoDaCriticidade, 'criticidade'>> {
  return {
    criticidadeImpacto: ehNota(api.criticidade_impacto) ? api.criticidade_impacto : null,
    criticidadeProbabilidade: ehNota(api.criticidade_probabilidade) ? api.criticidade_probabilidade : null,
    criticidadeMotivo: api.criticidade_motivo ?? null,
  };
}
