// src/features/reservas/utils/date-utils.ts

/**
 * Utilitários para conversão de datas entre frontend e backend
 */

/**
 * Converte data ISO (do BD) para formato de input date (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  try {
    // Se já está no formato correto, retorna
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // Converte de ISO para YYYY-MM-DD
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Data inválida:', dateString);
      return '';
    }
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erro ao formatar data para input:', error);
    return '';
  }
};

/**
 * Converte data do input (YYYY-MM-DD) para formato da API
 * Pode retornar ISO completo ou manter simples dependendo da configuração
 */
export const formatDateForAPI = (dateString: string, useISOFormat = false): string => {
  if (!dateString) return '';
  
  try {
    // Se useISOFormat = true, converte para ISO completo
    if (useISOFormat) {
      const date = new Date(dateString + 'T00:00:00.000Z');
      return date.toISOString();
    }
    
    // Senão, mantém no formato YYYY-MM-DD
    return dateString;
  } catch (error) {
    console.error('Erro ao formatar data para API:', error);
    return dateString;
  }
};

/**
 * Obter data atual no formato YYYY-MM-DD
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Obter hora atual no formato HH:mm
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

/**
 * Validar se uma data está no formato correto
 */
export const isValidDateFormat = (dateString: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

/**
 * Validar se uma hora está no formato correto
 */
export const isValidTimeFormat = (timeString: string): boolean => {
  return /^\d{2}:\d{2}$/.test(timeString);
};

/**
 * Combinar data e hora em uma string datetime
 */
export const combineDateAndTime = (date: string, time: string): string => {
  return `${date}T${time}:00.000Z`;
};

/**
 * Verificar se uma data é no passado
 */
export const isDateInPast = (dateString: string, allowToday = true): boolean => {
  const inputDate = new Date(dateString);
  const today = new Date();
  
  if (allowToday) {
    today.setHours(0, 0, 0, 0);
    return inputDate < today;
  } else {
    today.setHours(23, 59, 59, 999);
    return inputDate < today;
  }
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
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Se são datas diferentes, só comparar as datas
  if (startDate !== endDate) {
    return end >= start;
  }
  
  // Se é o mesmo dia e temos horários, comparar horários também
  if (startTime && endTime) {
    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    return endDateTime > startDateTime;
  }
  
  return true;
};

/**
 * Formatar período para exibição
 */
export const formatPeriodForDisplay = (
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string
): string => {
  const start = formatDateForInput(startDate);
  const end = formatDateForInput(endDate);
  
  let period = `${start}`;
  if (start !== end) {
    period += ` a ${end}`;
  }
  
  if (startTime && endTime) {
    period += ` (${startTime} às ${endTime})`;
  }
  
  return period;
};