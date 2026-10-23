import { equipamentosApi, type EquipamentosQueryParams } from '@/services/equipamentos.services';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { dadosDaListagem, type DadosDaEtiqueta, type EquipamentoDaListagem } from '@/core/features/equipamentos/utils/etiqueta';

/**
 * Todos os equipamentos da lista filtrada (todas as páginas, UC e componentes,
 * como a tabela mostra), para as etiquetas (SN-67). Os virtuais do diagrama
 * (barramento, ponto) não são máquina e não ganham etiqueta.
 */
export async function equipamentosParaEtiqueta(filtros: EquipamentosQueryParams): Promise<DadosDaEtiqueta[]> {
  const lista = await todasAsPaginas(async (page, limit) => {
    const resposta = await equipamentosApi.findAll({ ...filtros, ocultarVirtuais: true, page, limit });
    // Depois do interceptor, `data` já é o array; um embrulho a mais o deixaria em `data.data`
    const corpo = resposta as unknown as { data: EquipamentoDaListagem[] | { data: EquipamentoDaListagem[] } };
    return { data: Array.isArray(corpo.data) ? corpo.data : corpo.data.data };
  });
  return lista.map(dadosDaListagem);
}
