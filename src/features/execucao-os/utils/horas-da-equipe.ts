// src/features/execucao-os/utils/horas-da-equipe.ts
import { formatCurrency } from '@/lib/utils';
import { formatarHoras } from '@/utils/horas';

/**
 * As horas trabalhadas no Executar (SN-61). Toda linha da equipe precisa de
 * horas — 0 quando a pessoa não foi —, e quem entrou na hora entra com o
 * usuário. A API confere o mesmo; aqui o aviso vem antes de gravar.
 */

/** A linha da equipe como a OS chega (o nome é nulo na linha de perfil, "precisa de um eletricista") */
export interface TecnicoDaOS {
  id?: string;
  nome?: string | null;
  especialidade?: string | null;
  tecnico_id?: string | null;
  horas_trabalhadas?: number | null;
  custo_hora?: number | null;
}

export interface LinhaDeHoras {
  /** Chave da linha na tela: o id da linha da equipe, ou `extra:<usuário>` */
  chave: string;
  /** Linha da equipe (tecnicos_os.id); vazio em quem entrou na hora */
  id?: string;
  /** O usuário da linha: de quem entrou na hora e de quem foi escalado (não aparece de novo para acrescentar) */
  tecnicoId?: string;
  nome: string;
  detalhe: string;
  horas: number | null;
  extra: boolean;
  /** O texto no campo não dá para ler: confirmar mandaria o valor anterior calado */
  ilegivel?: boolean;
  /** Veio da execução anterior (reexecutar depois de reabrir), não da sugestão */
  registradaAntes?: boolean;
}

export const nomeDaLinha = (t: TecnicoDaOS) => t.nome?.trim() || `${t.especialidade?.trim() || 'Técnico'} (sem pessoa)`;

export const horasDoTempo = (minutos: number | null | undefined) =>
  minutos === null || minutos === undefined || minutos < 0 ? null : Math.round((minutos / 60) * 100) / 100;

/** Até uma jornada longa: além disso a OS ficou aberta de um dia para o outro, e o tempo dela não é o de ninguém. */
export const JORNADA_MAXIMA_MIN = 12 * 60;

/**
 * Horas do tempo efetivo, para começar: a equipe que vai junto trabalha o
 * tempo da OS, e é só ajustar quem não foi ou saiu antes. Só quando cabe numa
 * jornada — OS aberta por dias sugeria centenas de horas (uma de dev, aberta
 * desde abril, sugeria 4.614 h, que a API recusa).
 */
export const sugestaoDeHoras = (minutos: number | null | undefined) =>
  minutos !== null && minutos !== undefined && minutos <= JORNADA_MAXIMA_MIN ? horasDoTempo(minutos) : null;

/** As já registradas (reexecutar depois de reabrir) valem mais que a sugestão. */
export function linhasIniciais(tecnicos: TecnicoDaOS[] = [], tempoEfetivoMinutos?: number | null): LinhaDeHoras[] {
  const sugestao = sugestaoDeHoras(tempoEfetivoMinutos);
  return tecnicos
    .filter((t) => t.id?.trim())
    .map((t) => ({
      chave: t.id!.trim(),
      id: t.id!.trim(),
      tecnicoId: t.tecnico_id?.trim() || undefined,
      nome: nomeDaLinha(t),
      detalhe: t.nome?.trim() ? t.especialidade?.trim() ?? '' : '',
      horas: t.horas_trabalhadas ?? sugestao,
      extra: false,
      registradaAntes: t.horas_trabalhadas !== null && t.horas_trabalhadas !== undefined,
    }));
}

/**
 * O tempo efetivo agora: a API conta até a hora da leitura, e em execução ele
 * continua correndo. Quem abre a OS às 8h05 e executa ao meio-dia recebia a
 * sugestão de 0h05 (revisão do SN-61). Pausada, o tempo parado não conta.
 */
export function tempoEfetivoAgora(
  os: { tempo_efetivo_minutos?: number | null; tempo_efetivo_lido_em?: number; status?: string; statusExecucao?: string } | null | undefined,
  agora = Date.now(),
): number | null {
  const minutos = os?.tempo_efetivo_minutos;
  if (minutos === null || minutos === undefined) return null;
  const emExecucao = (os?.statusExecucao ?? os?.status) === 'EM_EXECUCAO';
  const corrido = emExecucao && os?.tempo_efetivo_lido_em ? Math.max(0, (agora - os.tempo_efetivo_lido_em) / 60_000) : 0;
  return Math.round(minutos + corrido);
}

export function linhaExtra(tecnicoId: string, nome: string, tempoEfetivoMinutos?: number | null): LinhaDeHoras {
  return {
    chave: `extra:${tecnicoId.trim()}`,
    tecnicoId: tecnicoId.trim(),
    nome,
    detalhe: 'entrou na execução',
    horas: sugestaoDeHoras(tempoEfetivoMinutos),
    extra: true,
  };
}

/** O que impede confirmar, numa frase; null quando está tudo certo. */
export function pendenciaDasHoras(linhas: LinhaDeHoras[]): string | null {
  const ilegiveis = linhas.filter((l) => l.ilegivel).map((l) => l.nome);
  if (ilegiveis.length > 0) return `Corrija as horas de ${ilegiveis.join(', ')} (ex.: 3h30, 45min ou 3,5).`;
  const semHoras = linhas.filter((l) => l.horas === null).map((l) => l.nome);
  if (semHoras.length > 0) return `Informe as horas de ${semHoras.join(', ')} (0 se não trabalhou).`;
  const extrasSemHoras = linhas.filter((l) => l.extra && (l.horas ?? 0) <= 0).map((l) => l.nome);
  if (extrasSemHoras.length > 0) return `${extrasSemHoras.join(', ')} entrou na execução: as horas precisam ser maiores que zero.`;
  return null;
}

/** Mais horas que o tempo efetivo da OS: pode ser (trabalhou na pausa, a OS foi iniciada tarde), mas pede conferência. */
export function passaDoTempo(horas: number | null, tempoEfetivoMinutos?: number | null): boolean {
  const limite = horasDoTempo(tempoEfetivoMinutos);
  return horas !== null && limite !== null && horas > limite + 0.01;
}

export function horasDoPedido(linhas: LinhaDeHoras[]) {
  return {
    horas_dos_tecnicos: linhas.filter((l) => !l.extra).map((l) => ({ id: l.id!, horas: l.horas ?? 0 })),
    tecnicos_extras: linhas.filter((l) => l.extra).map((l) => ({ tecnico_id: l.tecnicoId!, horas: l.horas ?? 0 })),
  };
}

export const totalDasHoras = (linhas: LinhaDeHoras[]) =>
  formatarHoras(Math.round(linhas.reduce((total, l) => total + (l.horas ?? 0), 0) * 100) / 100);

/** Na leitura: "5h30 (8h previstas)"; sem horas registradas, vazio (a leitura esconde). */
export function descreverHorasHomem(real?: number | null, estimado?: number | null): string | undefined {
  if (real === null || real === undefined) return undefined;
  return estimado ? `${formatarHoras(real)} (${formatarHoras(estimado)} previstas)` : formatarHoras(real);
}

const temCustoDaHora = (t: TecnicoDaOS) => (t.custo_hora ?? 0) > 0;

/**
 * Na leitura, o custo real com o que ele não cobre. Quem entrou na hora (e a
 * linha sem custo da hora) entra no HH e não no custo — sem dizer, o custo
 * parecia completo. E a OS executada antes do SN-61 tem o custo pela hora
 * estimada: "real" sem a ressalva enganava.
 */
export function descreverCustoReal(custo?: number | null, hhReal?: number | null, tecnicos: TecnicoDaOS[] = []): string | undefined {
  const horasSemCusto = tecnicos.filter((t) => !temCustoDaHora(t)).reduce((total, t) => total + (t.horas_trabalhadas ?? 0), 0);
  if (!custo && horasSemCusto <= 0) return undefined;
  const valor = formatCurrency(Number(custo ?? 0));
  if ((hhReal === null || hhReal === undefined) && tecnicos.some(temCustoDaHora)) return `${valor} (mão de obra pela hora estimada)`;
  return horasSemCusto > 0 ? `${valor} (${formatarHoras(Math.round(horasSemCusto * 100) / 100)} sem custo da hora)` : valor;
}
