// src/features/reservas/utils/date-utils.ts
import { hojeNaTela } from '@/utils/dia-de-calendario';

/**
 * O dia (AAAA-MM-DD) já passou? Comparado como texto com o hoje de quem está na
 * tela. O `new Date("2026-10-20")` era a meia-noite UTC — 21h do dia 19 em
 * Brasília —, e a reserva para hoje dava "não pode ser no passado" (SN-78).
 */
export const isDateInPast = (dia: string, allowToday = true): boolean => {
  const hoje = hojeNaTela();
  return allowToday ? dia < hoje : dia <= hoje;
};

/**
 * Verificar se data fim é posterior à data início
 */
export const isEndDateAfterStartDate = (
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string
): boolean => {
  // Se são datas diferentes, só comparar as datas (AAAA-MM-DD ordena como texto)
  if (startDate !== endDate) {
    return endDate >= startDate;
  }

  // Se é o mesmo dia e temos horários, comparar horários também
  if (startTime && endTime) {
    return endTime > startTime;
  }

  return true;
};
