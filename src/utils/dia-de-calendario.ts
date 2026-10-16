/**
 * O dia de calendário de um campo `@db.Date` (feriado, reserva), para exibir e
 * para o campo `type="date"`.
 *
 * O banco devolve meia-noite UTC ("2024-12-25T00:00:00.000Z"). Pelo fuso de
 * Brasília (UTC-3), `toLocaleDateString` mostrava o dia ANTERIOR — o Natal em
 * 24/12 — e o campo de data recebia o ISO inteiro, que ele não aceita, e abria
 * vazio. Meia-noite UTC é o dia gravado; outro instante (dado antigo com hora)
 * é lido no fuso local.
 */
export function diaDeCalendario(valor?: string | Date | null): string {
  if (!valor) return '';
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  const meiaNoiteUtc = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  if (meiaNoiteUtc) return d.toISOString().slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** DD/MM/AAAA do dia de calendário. */
export function formatarDiaDeCalendario(valor?: string | Date | null): string {
  const dia = diaDeCalendario(valor);
  if (!dia) return '';
  const [ano, mes, d] = dia.split('-');
  return `${d}/${mes}/${ano}`;
}
