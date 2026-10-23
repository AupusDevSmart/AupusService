/**
 * Data e hora para a API: ISO com o fuso, convertido no navegador.
 *
 * O campo `datetime-local` devolve "2026-09-29T09:00" — hora local, sem fuso e
 * sem segundos. A API exige o fuso (`@InstanteComFuso`, SN-74): sem ele, o
 * servidor leria a hora no fuso DELE. A conversão certa é a daqui, que sabe o
 * fuso de quem digitou. Vazio vira null (apagar a data). Texto que não é data
 * é erro: no update, null apaga — virar null calado apagaria a data gravada.
 */
export function instanteParaApi(valor?: string | null): string | null {
  if (!valor || !String(valor).trim()) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) throw new Error(`Data e hora inválidas: ${valor}`);
  return data.toISOString();
}
