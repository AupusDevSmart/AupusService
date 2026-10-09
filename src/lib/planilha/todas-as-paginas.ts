/** Página que as listagens desta API devolvem (o formato varia; só isto importa aqui). */
export type PaginaDaListagem<T> = {
  data: T[];
  pagination?: { totalPages?: number; total?: number } | null;
};

/** O que todas as listagens aceitam por página (veículos, feriados, instruções e planos têm `@Max(100)`). */
const POR_PAGINA = 100;

/**
 * Todas as páginas de uma listagem, com o filtro da tela — a exportação leva
 * o que a tela mostra, não só a página aberta.
 */
export async function todasAsPaginas<T>(
  buscar: (page: number, limit: number) => Promise<PaginaDaListagem<T>>,
): Promise<T[]> {
  const todos: T[] = [];

  for (let page = 1; ; page++) {
    const pagina = await buscar(page, POR_PAGINA);
    todos.push(...pagina.data);

    const totalDePaginas = pagina.pagination?.totalPages;
    const acabou = totalDePaginas !== undefined ? page >= totalDePaginas : pagina.data.length < POR_PAGINA;
    if (acabou || pagina.data.length === 0) return todos;
  }
}
