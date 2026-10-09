import type { Workbook } from 'exceljs';

import type { Campo } from '@/lib/planilha/campos';
import { exportarPlana, lerPlana, type PlanilhaPlana } from '@/lib/planilha/plana';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import {
  CATEGORIAS_RECURSO,
  UNIDADES_RECURSO,
  recursosApi,
  type QueryRecursosParams,
  type RecursoApiResponse,
} from '@/services/recursos.services';

/** Recursos na planilha: cadastro plano, editado na aba RESUMO. */

const ROTULO_DA_CATEGORIA = Object.fromEntries(CATEGORIAS_RECURSO.map((c) => [c.value, c.label]));

const campos: Campo<RecursoApiResponse>[] = [
  {
    titulo: 'CATEGORIA',
    caminho: 'categoria',
    tipo: 'opcao',
    rotulos: ROTULO_DA_CATEGORIA,
    obrigatorio: 'Sim',
    largura: 16,
    explicacao: 'O tipo do recurso.',
    exemplo: 'Técnico',
    valor: (r) => r.categoria,
  },
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    obrigatorio: 'Sim',
    largura: 40,
    explicacao: 'Nome do recurso. Não pode repetir o de outro recurso da mesma categoria.',
    exemplo: 'Eletricista',
    valor: (r) => r.nome,
  },
  {
    titulo: 'UNIDADE',
    caminho: 'unidade',
    tipo: 'texto',
    lista: `"${UNIDADES_RECURSO.map((u) => u.value).join(',')}"`,
    largura: 10,
    explicacao: `A que se refere o custo: ${UNIDADES_RECURSO.map((u) => `${u.value} (${u.label.toLowerCase()})`).join(', ')}.`,
    exemplo: 'h',
    valor: (r) => r.unidade ?? null,
  },
  {
    titulo: 'CUSTO MÉDIO',
    caminho: 'preco_medio',
    tipo: 'moeda',
    largura: 14,
    explicacao: 'Custo por unidade. Vazio = sem preço (aparece como pendência no orçamento, não como zero).',
    exemplo: '85,50',
    valor: (r) => (r.preco_medio === null || r.preco_medio === undefined ? null : Number(r.preco_medio)),
  },
  {
    titulo: 'ATIVO',
    caminho: 'ativo',
    tipo: 'simnao',
    vazioEhPadrao: true,
    largura: 8,
    explicacao: 'NÃO tira o recurso de uso sem apagá-lo. Vazio = mantém (SIM no recurso novo).',
    exemplo: 'SIM',
    valor: (r) => r.ativo,
  },
];

export const definicaoDeRecursos: PlanilhaPlana<RecursoApiResponse> = {
  cadastro: 'Recursos',
  singular: 'recurso',
  campos,
  id: (r) => r.id.trim(),
  nome: (r) => r.nome,
  atualizadoEm: (r) => r.updated_at,
  comoTirarDeUso: 'escreva NÃO em ATIVO',
  regrasDoCadastro: [
    'Recurso em uso numa instrução não se apaga nem pela tela: desative-o (ATIVO = NÃO).',
  ],
};

export async function exportarRecursos(filtros: Pick<QueryRecursosParams, 'categoria' | 'search'>) {
  const recursos = await todasAsPaginas((page, limit) => recursosApi.listar({ ...filtros, page, limit }));
  await exportarPlana(definicaoDeRecursos, recursos);
}

export const lerRecursos = (livro: Workbook) => lerPlana(definicaoDeRecursos, livro);
