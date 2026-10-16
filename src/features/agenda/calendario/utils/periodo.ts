import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type Visao = 'mes' | 'semana' | 'lista';

/** A semana do calendário brasileiro começa no domingo. */
const SEMANA = { weekStartsOn: 0 as const };

export interface Periodo {
  inicio: Date;
  fim: Date;
  /** Os dias que a visão desenha: no mês, as semanas inteiras (com o fim do mês anterior e o começo do seguinte). */
  dias: Date[];
}

export function periodoDaVisao(visao: Visao, base: Date): Periodo {
  if (visao === 'semana') {
    const inicio = startOfWeek(base, SEMANA);
    const fim = endOfWeek(base, SEMANA);
    return { inicio, fim, dias: eachDayOfInterval({ start: inicio, end: fim }) };
  }
  if (visao === 'lista') {
    const inicio = startOfMonth(base);
    const fim = endOfMonth(base);
    return { inicio, fim, dias: eachDayOfInterval({ start: inicio, end: fim }) };
  }
  const inicio = startOfWeek(startOfMonth(base), SEMANA);
  const fim = endOfWeek(endOfMonth(base), SEMANA);
  return { inicio, fim, dias: eachDayOfInterval({ start: inicio, end: fim }) };
}

export function deslocar(visao: Visao, base: Date, passos: number): Date {
  return visao === 'semana' ? addWeeks(base, passos) : addMonths(base, passos);
}

/** O dia da grade como a API recebe (AAAA-MM-DD): a data de calendário, que a API lê em Brasília. */
export const diaParaApi = (dia: Date) => format(dia, 'yyyy-MM-dd');

/** A chave de um dia da grade (a data de calendário dele). */
export const chaveDoDia = (dia: Date) => format(dia, 'yyyy-MM-dd');

/** Brasília: -03:00 fixo, sem horário de verão desde 2019 (a convenção do backend). */
const BRASILIA_MIN = -180;

/**
 * O instante com os campos locais iguais aos de Brasília, para o date-fns
 * formatar. Pelo fuso do aparelho, em Cuiabá (-04:00) a OS de 00:30 de domingo
 * caía no sábado — fora da semana que a API mandou, e de todas as outras.
 */
export function emBrasilia(instante: string | Date): Date {
  const data = new Date(instante);
  return new Date(data.getTime() + (data.getTimezoneOffset() + BRASILIA_MIN) * 60_000);
}

export const formatarEmBrasilia = (instante: string | Date, padrao: string) => format(emBrasilia(instante), padrao, { locale: ptBR });

/** O dia (em Brasília) de um evento. */
export const diaDoEvento = (instante: string | Date) => formatarEmBrasilia(instante, 'yyyy-MM-dd');

export function agruparPorDia<T extends { data: string }>(eventos: T[]): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  for (const evento of eventos) {
    const chave = diaDoEvento(evento.data);
    grupos.set(chave, [...(grupos.get(chave) ?? []), evento]);
  }
  return grupos;
}

/** Só a primeira letra: o `capitalize` do CSS escrevia "Novembro De 2026". */
export const comInicialMaiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export function tituloDoPeriodo(visao: Visao, base: Date): string {
  if (visao !== 'semana') return comInicialMaiuscula(format(base, "MMMM 'de' yyyy", { locale: ptBR }));
  const { inicio, fim } = periodoDaVisao('semana', base);
  const mesmoMes = isSameMonth(inicio, fim);
  return `${format(inicio, mesmoMes ? 'd' : "d 'de' MMM", { locale: ptBR })} a ${format(fim, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
}

/**
 * Os dias da semana, a partir de domingo, para o cabeçalho do mês: a sigla e,
 * no celular, a letra. Escritos à mão: no ptBR do date-fns o "abreviado" é o
 * nome inteiro e o curto perde o acento do sábado.
 */
export const DIAS_DA_SEMANA = [
  { sigla: 'Dom', letra: 'D' },
  { sigla: 'Seg', letra: 'S' },
  { sigla: 'Ter', letra: 'T' },
  { sigla: 'Qua', letra: 'Q' },
  { sigla: 'Qui', letra: 'Q' },
  { sigla: 'Sex', letra: 'S' },
  { sigla: 'Sáb', letra: 'S' },
];
