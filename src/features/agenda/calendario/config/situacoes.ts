import type { SituacaoDoEvento } from '@/services/eventos-da-agenda.services';

interface AparenciaDaSituacao {
  rotulo: string;
  /** O que a legenda explica. */
  descricao: string;
  /** O ponto ao lado do título: a única cor do evento (o resto é neutro). */
  ponto: string;
}

/** Na ordem da legenda: do que ainda vai acontecer ao que já foi feito, e o que pede atenção no fim. */
export const SITUACOES: Record<SituacaoDoEvento, AparenciaDaSituacao> = {
  previsto: {
    rotulo: 'Previsto',
    descricao: 'O gerador de preventivas ainda vai programar',
    ponto: 'border border-slate-400 dark:border-slate-500 bg-transparent',
  },
  programado: { rotulo: 'Programado', descricao: 'Programação ou OS a fazer', ponto: 'bg-sky-600 dark:bg-sky-400' },
  em_execucao: { rotulo: 'Em execução', descricao: 'OS em execução ou pausada', ponto: 'bg-amber-500 dark:bg-amber-400' },
  feito: { rotulo: 'Feito', descricao: 'OS executada, auditada ou finalizada', ponto: 'bg-emerald-600 dark:bg-emerald-400' },
  atrasado: { rotulo: 'Atrasado', descricao: 'Venceu e ainda não foi feito', ponto: 'bg-red-600 dark:bg-red-400' },
  nao_sai: {
    rotulo: 'Não sai',
    descricao: 'O gerador não consegue programar (veja o motivo)',
    ponto: 'border border-red-600 dark:border-red-400 bg-transparent',
  },
};

export const ORDEM_DAS_SITUACOES = Object.keys(SITUACOES) as SituacaoDoEvento[];
