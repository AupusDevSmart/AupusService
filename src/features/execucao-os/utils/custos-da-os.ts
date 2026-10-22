// src/features/execucao-os/utils/custos-da-os.ts
import { formatCurrency } from '@/lib/utils';
import type { ResumoDoCusto } from '@/features/execucao-os/types/custos';

/**
 * O custo da OS em texto, para o sheet e para o PDF (SN-93). A conta é da API
 * (`ResumoDoCusto`); aqui só a leitura: a diferença para o previsto, a situação
 * de cada instrução e a frase das instruções feitas.
 */

export type SentidoDaDiferenca = 'acima' | 'abaixo' | 'igual' | 'sem-previsto';

/** "+R$ 26,50 (+0,4%)": o real menos o previsto, e o quanto isso é do previsto */
export function diferencaDoPrevisto(previsto: number, real: number): { texto: string; sentido: SentidoDaDiferenca } {
  const diferenca = Math.round((real - previsto) * 100) / 100;
  if (previsto <= 0) return { texto: real > 0 ? 'sem previsto' : '—', sentido: 'sem-previsto' };
  if (diferenca === 0) return { texto: 'igual ao previsto', sentido: 'igual' };
  const sinal = diferenca > 0 ? '+' : '−';
  const pct = Math.abs((diferenca / previsto) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return { texto: `${sinal}${formatCurrency(Math.abs(diferenca))} (${sinal}${pct}%)`, sentido: diferenca > 0 ? 'acima' : 'abaixo' };
}

const SITUACAO: Record<string, string> = { CONCLUIDA: 'Feita', CANCELADA: 'Não feita', PENDENTE: 'Pendente' };
export const situacaoDaInstrucao = (status: string) => SITUACAO[status] ?? status;

/** "7 de 8 feitas · R$ 6.314,56 de R$ 7.216,64" */
export function resumoDasInstrucoes(custos: ResumoDoCusto): string | null {
  const total = custos.instrucoes.length;
  if (total === 0) return null;
  const feitas = `${custos.instrucoes_feitas} de ${total} ${total === 1 ? 'feita' : 'feitas'}`;
  return `${feitas} · ${formatCurrency(custos.instrucoes_feitas_total)} de ${formatCurrency(custos.instrucoes_total)}`;
}

/** O valor da instrução com o que ele é: ajustado nesta OS, ou o do cadastro de hoje (OS antiga) */
export function valorDaInstrucao(i: ResumoDoCusto['instrucoes'][number]): { texto: string; detalhe: string | null } {
  if (i.valor === null) return { texto: '—', detalhe: 'sem valor no cadastro' };
  const detalhe = i.do_cadastro_hoje
    ? 'do cadastro de hoje'
    : i.ajustado && i.valor_original !== null
      ? `ajustado; cadastro ${formatCurrency(i.valor_original)}`
      : null;
  return { texto: formatCurrency(i.valor), detalhe };
}

/** O nome da instrução como a OS a mostra: "INV-03 · Termografia e reaperto" */
export const nomeDaInstrucao = (i: Pick<ResumoDoCusto['instrucoes'][number], 'codigo' | 'nome'>) =>
  [i.codigo?.trim(), i.nome?.trim() || 'Instrução'].filter(Boolean).join(' · ');
