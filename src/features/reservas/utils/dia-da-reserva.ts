/**
 * O dia de uma reserva, para exibir.
 *
 * O banco guarda o dia como meia-noite UTC ("2027-03-10T00:00:00.000Z").
 * `new Date(...).toLocaleDateString()` em Brasília (UTC-3) mostrava o dia
 * ANTERIOR. Meia-noite UTC é lida como o dia gravado; qualquer outro instante
 * (reservas antigas que herdaram hora) é lido no fuso local.
 */
export function diaDaReserva(valor?: string | Date | null): string {
  if (!valor) return '';
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  const meiaNoiteUtc =
    d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  if (meiaNoiteUtc) return d.toISOString().slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** DD/MM/AAAA do dia da reserva */
export function formatarDiaDaReserva(valor?: string | Date | null): string {
  const dia = diaDaReserva(valor);
  if (!dia) return '';
  const [ano, mes, d] = dia.split('-');
  return `${d}/${mes}/${ano}`;
}
