/**
 * A quantidade da ferramenta como vai para a API.
 *
 * O backend guarda Decimal: 2,5 tem que continuar 2,5. Era `parseInt`, que
 * truncava a quantidade para 2 ao salvar. Vazio (ou zero) continua virando 1,
 * como antes; texto que não é número também vira 1, em vez de NaN.
 */
export function quantidadeDaFerramenta(valor: number | string | null | undefined): number {
  const quantidade = Number(valor || 1);
  return Number.isNaN(quantidade) ? 1 : quantidade;
}
