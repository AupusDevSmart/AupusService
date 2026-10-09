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

/**
 * `fn` para cada item, no máximo `limite` ao mesmo tempo, na ordem dos itens.
 * Para o detalhe de cada registro (centenas de UCs): um por vez demora; todos
 * de uma vez afogam a API.
 */
export async function emParalelo<T, R>(itens: T[], limite: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const resultados: R[] = new Array(itens.length);
  let proximo = 0;

  const trabalhador = async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await fn(itens[i]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}
