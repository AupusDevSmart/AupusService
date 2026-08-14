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
