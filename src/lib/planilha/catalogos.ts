import type { Referencia } from '@/lib/planilha/referencias';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { PlantasService } from '@/services/plantas.services';

/**
 * As referências que mais de um cadastro usa. Cada uma traz o nome (a
 * primeira coluna, a da lista suspensa), o que ajuda a distinguir nomes
 * parecidos e o ID — para quem precisa conferir um nome repetido.
 */

/** As plantas que quem exporta enxerga (a listagem já aplica o escopo). */
export async function referenciaDePlantas(): Promise<Referencia> {
  const plantas = await todasAsPaginas((page, limit) => PlantasService.getAllPlantas({ page, limit }));

  return {
    chave: 'plantas',
    titulo: 'PLANTAS',
    colunas: ['NOME', 'CIDADE', 'UF', 'ID'],
    linhas: plantas.map((p) => [p.nome, p.endereco?.cidade ?? null, p.endereco?.uf ?? null, p.id.trim()]),
  };
}
