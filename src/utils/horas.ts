// src/utils/horas.ts
import { HORAS_POR_DIA } from '@/services/recursos.services';

/**
 * Horas em texto curto: "2h", "2h30" ou "45min".
 *
 * Decimal puro ("2.5h") obriga quem lê a converter de cabeça, e é tempo de
 * serviço — a leitura natural é em horas e minutos.
 */
export function formatarHoras(horas: number): string {
  if (!horas || horas <= 0) return '0h';

  const totalMinutos = Math.round(horas * 60);
  const h = Math.floor(totalMinutos / 60);
  const min = totalMinutos % 60;

  if (h === 0) return `${min}min`;
  if (min === 0) return `${h}h`;
  return `${h}h${String(min).padStart(2, '0')}`;
}

/**
 * As horas no campo de digitar ("3h30"); vazio é null. Em horas e minutos
 * quando a volta dá o mesmo número (0,33 h é "0h20", que volta 0,33); senão em
 * decimal: 1,11 h (da planilha) em "1h07" voltaria 1,12, e só passar pelo
 * campo regravaria outro número.
 */
export const horasNoCampo = (valor: number | null) => {
  if (valor === null) return '';
  const volta = Math.round((Math.round(valor * 60) / 60) * 100) / 100;
  return Math.abs(volta - valor) > 1e-9 ? String(valor).replace('.', ',') : formatarHoras(valor);
};

/** Até 999,99 h e 2 casas: a coluna das horas trabalhadas é Decimal(5, 2). */
const HORAS_MAXIMAS = 999.99;

/**
 * Horas digitadas (SN-61): "3h30", "3h", "45min", "3:30" ou decimal com vírgula
 * ("3,5"). Quem está em campo pensa em horas e minutos; o decimal fica para
 * quem preferir. Vazio é null; o que não dá para ler, undefined (o campo
 * avisa e não grava). Minutos viram horas com 2 casas (20 min = 0,33 h), a
 * precisão da coluna — volta para a tela como "0h20".
 */
export function lerHorasDigitadas(texto: string): number | null | undefined {
  const limpo = texto.trim().toLowerCase().replace(/\s/g, '');
  if (limpo === '') return null;

  const emHoras = (h: number, min: number) => (min >= 60 ? undefined : Math.round((h + min / 60) * 100) / 100);
  let partes = /^(\d{1,3})h(?:(\d{1,2})(?:min|m)?)?$/.exec(limpo) ?? /^(\d{1,3}):(\d{2})$/.exec(limpo);
  let horas: number | undefined;
  if (partes) horas = emHoras(Number(partes[1]), Number(partes[2] ?? 0));
  else if ((partes = /^(\d{1,5})(?:min|m)$/.exec(limpo))) horas = Math.round((Number(partes[1]) / 60) * 100) / 100;
  else if (/^\d{1,3}(,\d{1,2})?$/.test(limpo) || /^\d{1,3}(\.\d{1,2})?$/.test(limpo)) horas = Number(limpo.replace(',', '.'));

  return horas === undefined || horas > HORAS_MAXIMAS ? undefined : horas;
}

/**
 * Uma duração longa em minutos, legível: "3 d 4 h", "1 h 45 min", "45 min".
 * Para o tempo parado (SN-60): 4320 min não diz nada a quem lê; "3 d" diz.
 */
export function duracaoLegivel(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || minutos < 0) return '';
  const total = Math.round(minutos);
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const min = total % 60;
  const partes = [d && `${d} d`, h && `${h} h`, (min || (!d && !h)) && `${min} min`].filter(Boolean);
  // Com dias, os minutos sobram: "3 d 4 h" basta
  return (d ? partes.slice(0, 2) : partes).join(' ');
}

/**
 * Quantas diárias uma duração ocupa, e quantas horas isso representa.
 *
 * Uma instrução de 10h não cabe num dia de 8h: ocupa dois, e é por dois dias
 * que se paga o técnico e a viatura. Por isso arredonda para cima — meio dia de
 * alocação custa o dia.
 */
export function diariasDaDuracao(horas: number): { dias: number; horas: number } {
  if (!horas || horas <= 0) return { dias: 0, horas: 0 };

  const dias = Math.ceil(horas / HORAS_POR_DIA);
  return { dias, horas: dias * HORAS_POR_DIA };
}
