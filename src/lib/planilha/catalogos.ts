import type { Referencia } from '@/lib/planilha/referencias';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { instrucoesApi } from '@/services/instrucoes.services';
import { PlantasService } from '@/services/plantas.services';
import { categoriasEquipamentosApi } from '@/services/tipos-equipamentos.services';

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

/** As categorias de equipamento (a de um plano, a de um modelo). */
export async function referenciaDeCategorias(): Promise<Referencia> {
  const categorias = await categoriasEquipamentosApi.getAll();
  return {
    chave: 'categorias',
    titulo: 'CATEGORIAS',
    colunas: ['NOME', 'ID'],
    linhas: categorias.map((c) => [c.nome, String(c.id).trim()]),
  };
}

/** As instruções ativas, pelo nome, com a TAG (que também serve para achá-las). */
export async function referenciaDeInstrucoes(): Promise<Referencia> {
  const instrucoes = await instrucoesApi.listarTodasAtivas();
  return {
    chave: 'instrucoes',
    titulo: 'INSTRUÇÕES',
    colunas: ['NOME', 'TAG', 'ID'],
    linhas: instrucoes.map((i) => [i.nome, i.tag, i.id.trim()]),
  };
}
