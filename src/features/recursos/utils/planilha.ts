import type { Workbook } from 'exceljs';

import type { Campo } from '@/lib/planilha/campos';
import { exportarPlana, lerPlana, type PlanilhaPlana } from '@/lib/planilha/plana';
import { todasAsPaginas } from '@/lib/planilha/todas-as-paginas';
import { casarPelaChave, separarOutroSistema } from '@/lib/planilha/outro-sistema';
import {
  CATEGORIAS_RECURSO,
  ROTULO_DA_BASE,
  ROTULO_DA_ORIGEM,
  ROTULO_DA_RUBRICA,
  recursosApi,
  sufixoDaBase,
  type QueryRecursosParams,
  type RecursoApiResponse,
} from '@/services/recursos.services';

/**
 * Recursos na planilha: cadastro plano, editado na aba RESUMO. As colunas, a
 * ordem e os rótulos são os da planilha de recursos do AupusProject (SN-83:
 * decisão do usuário, a de lá importa aqui). O que só o custo apurado mostra
 * (CUSTO APURADO, POR, CUSTO POR HORA, ORIGEM DO CUSTO) é calculado: a
 * importação não lê.
 */

const ROTULO_DA_CATEGORIA = Object.fromEntries(CATEGORIAS_RECURSO.map((c) => [c.value, c.label]));
const numero = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? null : Number(v));

const campos: Campo<RecursoApiResponse>[] = [
  // ---- O que a tabela da tela mostra ----
  {
    titulo: 'NOME',
    caminho: 'nome',
    tipo: 'texto',
    largura: 36,
    obrigatorio: 'Sim',
    explicacao: 'Nome do recurso. É por ele que as instruções o encontram na importação. Não pode repetir o de outro recurso da mesma categoria.',
    exemplo: 'Técnico eletricista',
    valor: (r) => r.nome,
  },
  {
    titulo: 'CATEGORIA',
    caminho: 'categoria',
    tipo: 'opcao',
    rotulos: ROTULO_DA_CATEGORIA,
    largura: 18,
    obrigatorio: 'Sim',
    explicacao: 'O tipo de insumo. Define quais formas de cobrança valem.',
    exemplo: 'Mão de obra',
    valor: (r) => r.categoria,
  },
  {
    titulo: 'FUNÇÃO',
    caminho: 'funcao',
    tipo: 'texto',
    largura: 22,
    obrigatorio: 'Só em mão de obra',
    explicacao: 'Só para mão de obra: a função de quem executa. Nas outras categorias fica vazia.',
    exemplo: 'Técnico',
    valor: (r) => r.funcao ?? null,
  },
  {
    titulo: 'CUSTO APURADO',
    tipo: 'moeda',
    largura: 16,
    explicacao: 'O preço de uma unidade da cobrança que as instruções aplicam hoje.',
    valor: (r) => r.preco_base ?? null,
  },
  {
    titulo: 'POR',
    tipo: 'texto',
    largura: 10,
    explicacao: 'A unidade do custo apurado.',
    valor: (r) => sufixoDaBase(r).replace('/', '') || null,
  },
  // ---- O resto do cadastro ----
  {
    titulo: 'COBRANÇA',
    caminho: 'base_calculo',
    tipo: 'opcao',
    rotulos: ROTULO_DA_BASE,
    largura: 16,
    vazioEhPadrao: true,
    explicacao:
      'Como o recurso é cobrado. Mão de obra: por hora ou por diária. Material: por unidade. Instrumento: por diária. Veículo: por quilômetro ou por diária. Terceiro: valor fechado. Despesa de campo: por diária, valor fechado ou por hora. Vazio = o padrão da categoria (o primeiro de cada lista).',
    exemplo: 'Por hora',
    valor: (r) => r.base_calculo,
  },
  {
    titulo: 'RUBRICA',
    caminho: 'rubrica',
    tipo: 'opcao',
    rotulos: ROTULO_DA_RUBRICA,
    largura: 20,
    vazioEhPadrao: true,
    explicacao: 'A linha do orçamento em que este custo entra. Vazio = o padrão da categoria.',
    exemplo: 'Instruções',
    valor: (r) => r.rubrica,
  },
  {
    titulo: 'PREÇO UNITÁRIO',
    caminho: 'preco_unitario',
    tipo: 'moeda',
    largura: 16,
    explicacao:
      'Preço por unidade da cobrança (hora, diária, unidade, km ou o valor fechado). No instrumento, só vale quando falta a amortização. Vazio = sem preço (aparece como pendência no orçamento, não como zero).',
    exemplo: '120,00',
    valor: (r) => numero(r.preco_unitario),
  },
  {
    titulo: 'UNIDADE',
    caminho: 'unidade',
    tipo: 'texto',
    largura: 10,
    explicacao: 'Unidade de compra do material (m, un, kg…).',
    exemplo: 'm',
    valor: (r) => r.unidade ?? null,
  },
  {
    titulo: 'HORAS POR DIÁRIA',
    caminho: 'horas_por_diaria',
    tipo: 'inteiro',
    largura: 12,
    vazioEhPadrao: true,
    explicacao: 'Quantas horas formam uma diária (1 a 24). Só a cobrança por diária usa. Vazio = mantém (8 no cadastro novo).',
    exemplo: '8',
    valor: (r) => r.horas_por_diaria,
  },
  {
    titulo: 'VALOR DE AQUISIÇÃO',
    caminho: 'valor_aquisicao',
    tipo: 'moeda',
    largura: 16,
    explicacao: 'Só instrumento: o investimento a amortizar.',
    exemplo: '38700,00',
    valor: (r) => numero(r.valor_aquisicao),
  },
  {
    titulo: 'PRAZO DE RETORNO (MESES)',
    caminho: 'prazo_retorno_meses',
    tipo: 'inteiro',
    largura: 14,
    explicacao: 'Só instrumento: em quantos meses o investimento se paga (1 a 600).',
    exemplo: '12',
    valor: (r) => r.prazo_retorno_meses ?? null,
  },
  {
    titulo: 'CUSTOS ANUAIS',
    caminho: 'custos_anuais',
    tipo: 'moeda',
    largura: 14,
    explicacao: 'Só instrumento: manutenção, calibração, seguro e licenças por ano.',
    exemplo: '2500,00',
    valor: (r) => (r.categoria === 'INSTRUMENTO' ? numero(r.custos_anuais) : null),
  },
  {
    titulo: 'META DE UTILIZAÇÃO (H/ANO)',
    caminho: 'meta_utilizacao_horas',
    tipo: 'numero',
    largura: 14,
    explicacao: 'Só instrumento: horas de uso previstas por ano.',
    exemplo: '150',
    valor: (r) => numero(r.meta_utilizacao_horas),
  },
  {
    titulo: 'DESCRIÇÃO',
    caminho: 'descricao',
    tipo: 'texto',
    largura: 30,
    explicacao: 'Observação livre.',
    valor: (r) => r.descricao ?? null,
  },
  {
    titulo: 'ATIVO',
    caminho: 'ativo',
    tipo: 'simnao',
    largura: 8,
    vazioEhPadrao: true,
    explicacao: 'NÃO tira o recurso de uso sem apagá-lo. Vazio = mantém (SIM no cadastro novo).',
    exemplo: 'SIM',
    valor: (r) => r.ativo,
  },
  {
    titulo: 'CUSTO POR HORA',
    tipo: 'moeda',
    largura: 14,
    explicacao: 'Só instrumento: a amortização por hora de uso.',
    valor: (r) => r.custo_hora ?? null,
  },
  {
    titulo: 'ORIGEM DO CUSTO',
    tipo: 'texto',
    largura: 22,
    explicacao: 'De onde saiu o custo apurado. Vazio = falta cadastro para apurar.',
    valor: (r) => (r.custo_origem ? ROTULO_DA_ORIGEM[r.custo_origem] : null),
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
    'Campos que não pertencem à categoria são limpos ao gravar (ex.: valor de aquisição num material).',
    'Recurso em uso numa instrução não se apaga nem pela tela: desative-o (ATIVO = NÃO).',
    'A planilha de recursos do Smart Project também importa aqui: os IDs de lá são ignorados e cada recurso casa pelo nome e pela categoria.',
  ],
};

export async function exportarRecursos(filtros: Pick<QueryRecursosParams, 'categoria' | 'search'>) {
  const recursos = await todasAsPaginas((page, limit) => recursosApi.listar({ ...filtros, page, limit }));
  await exportarPlana(definicaoDeRecursos, recursos);
}

/** A chave de casar a planilha de outro sistema: o nome dentro da categoria (o único que o cadastro exige) */
const chaveDoRecurso = (categoria: unknown, nome: unknown) => `${String(categoria ?? '')}|${String(nome ?? '')}`;

/**
 * Lê a aba RESUMO. A planilha do Smart Project (os IDs de lá não são daqui)
 * casa cada recurso pelo nome e pela categoria: o de mesmo nome edita, o resto
 * cria — e a prévia diz.
 */
export async function lerRecursos(livro: Workbook) {
  const { deOutroSistema, leitura } = separarOutroSistema(livro, lerPlana(definicaoDeRecursos, livro));
  if (!deOutroSistema) return leitura;

  const existentes = await todasAsPaginas((page, limit) => recursosApi.listar({ page, limit }));
  return casarPelaChave(
    leitura,
    existentes.map((r) => ({ id: r.id, chave: chaveDoRecurso(r.categoria, r.nome), nome: r.nome })),
    (registro) => chaveDoRecurso(registro.dados.categoria, registro.dados.nome),
    { singular: 'recurso' },
  );
}
