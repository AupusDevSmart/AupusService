const MINUTO = 60_000;
const HORA = 60 * MINUTO;

const diaEHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** O mesmo dia do calendário no fuso de quem está vendo. */
function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Quando a notificação chegou, como se fala: "agora", "há 5 min", "há 3 h",
 * "ontem 14:20", "12/10 09:05". `iso` vem do servidor em UTC (com o Z); a
 * conta e o dia são no fuso do navegador. Data inválida não vira "agora":
 * mostra que não se sabe.
 */
export function quandoFoi(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return 'data desconhecida';

  // Relógio do aparelho um pouco atrás do servidor não pode dar "há -1 min"
  const passou = Math.max(agora.getTime() - data.getTime(), 0);
  if (passou < MINUTO) return 'agora';
  if (passou < HORA) return `há ${Math.floor(passou / MINUTO)} min`;
  if (mesmoDia(data, agora)) return `há ${Math.floor(passou / HORA)} h`;

  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (mesmoDia(data, ontem)) return `ontem ${hora.format(data)}`;
  return diaEHora.format(data).replace(',', '');
}
