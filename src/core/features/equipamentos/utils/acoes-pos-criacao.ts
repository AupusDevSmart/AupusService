/** O que o sheet faz depois que o componente existe, pelo nome que aparece no aviso. */
export type AcoesPosCriacao = Map<string, (id: string) => Promise<void>>;

/**
 * Roda cada ação com o id criado e devolve o nome das que falharam. Uma falha
 * não impede as outras; quem chama avisa o que ficou faltando (SN-12).
 */
export async function rodarAcoesPosCriacao(acoes: AcoesPosCriacao, id: string): Promise<string[]> {
  const falharam: string[] = [];
  for (const [nome, acao] of acoes) {
    try {
      await acao(id);
    } catch {
      falharam.push(nome);
    }
  }
  return falharam;
}
