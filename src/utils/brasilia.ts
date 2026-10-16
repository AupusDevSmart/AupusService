import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Datas no horário de Brasília: -03:00 fixo, sem horário de verão desde 2019 —
 * a mesma convenção do backend (dias úteis, agenda, reserva de viatura, a
 * rodada das 3h do gerador). Pelo fuso do aparelho, em Cuiabá (-04:00) a OS de
 * 00:30 de domingo caía no sábado.
 */
const BRASILIA_MIN = -180;

/** O instante com os campos locais iguais aos de Brasília, para o date-fns formatar. */
export function emBrasilia(instante: string | Date): Date {
  const data = new Date(instante);
  return new Date(data.getTime() + (data.getTimezoneOffset() + BRASILIA_MIN) * 60_000);
}

export const formatarEmBrasilia = (instante: string | Date, padrao: string) => format(emBrasilia(instante), padrao, { locale: ptBR });

/** Hoje em Brasília, como a API recebe um dia (AAAA-MM-DD). */
export const hojeEmBrasilia = () => formatarEmBrasilia(new Date(), 'yyyy-MM-dd');
